import OpenAI from "openai";
import { UserPersonality, PetPersonality, PetCharacter } from "./types";
import { fetchProfileInfoByFid } from "./personalityTest";
import { generatePfp } from "./generatePetPfp";
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GENDER_CHARACTERISTICS = {
  male: {
    traits: [
      "aggressive", "protective", "dominant", "bold", "strong", "assertive",
      "territorial", "confident", "powerful", "adventurous"
    ],
    descriptors: [
      "muscular", "imposing", "majestic", "fierce", "commanding",
      "robust", "sturdy", "mighty", "formidable", "noble"
    ]
  },
  female: {
    traits: [
      "graceful", "elegant", "nurturing", "gentle", "sophisticated",
      "charming", "delicate", "refined", "poised", "maternal"
    ],
    descriptors: [
      "beautiful", "stunning", "enchanting", "lovely", "alluring",
      "gorgeous", "ethereal", "pristine", "dainty", "radiant"
    ]
  },
  baby: {
    traits: [
      "playful", "innocent", "curious", "energetic", "mischievous",
      "silly", "bouncy", "giggly", "clumsy", "adorable"
    ],
    descriptors: [
      "tiny", "cute", "fluffy", "chubby", "sweet",
      "precious", "cuddly", "small", "fuzzy", "lovable"
    ]
  }
};

function getRandomSpecies(character: PetCharacter): string {
  const speciesList = ["dog", "cat", "rabbit", "bird", "hamster", "bear", "bull"];
  const randomIndex = Math.floor(Math.random() * speciesList.length);
  return speciesList[randomIndex];
}

export async function generatePet(
  userFid: number,
  userPersonality: UserPersonality,
  character: PetCharacter
): Promise<PetPersonality> {
  // Pre-select the species
  const selectedSpecies = getRandomSpecies(character);

  const systemPrompt = `You are a pet personality expert who specializes in matching pets with their owners. Your task is to create a pet personality that would be a perfect companion for the given user, considering their lifestyle, interests, and personality traits.

IMPORTANT: You must return ONLY a valid JSON object with no additional text, comments, or explanations.
Every string must be enclosed in double quotes, including property names.

Follow these guidelines:
1. Create pets that complement the owner's lifestyle
2. Ensure the pet's personality strongly reflects their gender type:

For male pets:
- Must be strong, confident, and protective
- Should exhibit dominant and aggressive traits (in a positive way)
- Focus on power, bravery, and leadership qualities

For female pets:
- Must be graceful, elegant, and refined
- Should exhibit beauty and sophistication
- Focus on charm, poise, and nurturing qualities

For baby pets:
- Must be extremely cute and playful
- Should exhibit innocent and adorable traits
- Focus on being small, cuddly, and endearing

3. Make personality traits and interests that create natural interactions with the owner
4. Create a name that reflects both gender and species characteristics`;

  const exampleResponse = {
    "description": "Description of the pet. Use simple words. Tell why the owner and pet are best friends. Don't mention gender.",
    "interests": ["interest1", "interest2", "interest3"],
    "traits": ["trait1", "trait2", "trait3"],
    "name": "Example Name",
    "species": selectedSpecies
  };

  const genderTraits = GENDER_CHARACTERISTICS[character];
  const traitExamples = genderTraits.traits.join(', ');
  const descriptorExamples = genderTraits.descriptors.join(', ');

  const analysisPrompt = `Create a ${character} ${selectedSpecies} personality for the following user:

User Profile:
${JSON.stringify(userPersonality, null, 2)}

Pet Requirements:
- Must be a ${character} ${selectedSpecies}
- Should incorporate these kinds of traits: ${traitExamples}
- Should be described using terms like: ${descriptorExamples}

Consider:
1. The user's interests and how the pet can participate in them
2. The user's traits and what kind of pet would complement them
3. The channels they frequent and how the pet could be involved
4. Their lifestyle as indicated by their random facts

RESPONSE FORMAT:
Return ONLY a JSON object in exactly this format (replace example values with appropriate content):
${JSON.stringify(exampleResponse, null, 2)}

REQUIREMENTS:
- Use double quotes for all strings
- Include exactly 3-5 interests
- Include exactly 3-4 traits (use some from the provided trait list)
- Description should be 2-3 sentences, incorporating the provided descriptors
- No additional text or explanation outside the JSON object`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from GPT");
    }

    let result: PetPersonality;
    try {
      result = JSON.parse(content.trim()) as PetPersonality;
    } catch (parseError) {
      console.error("Parse error details:", parseError);
      console.error("Problematic content:", content);
      throw new Error(`Invalid JSON response from GPT: ${parseError.message}`);
    }

    // Override the species with our pre-selected one
    result.species = selectedSpecies;

    // Validate the response structure
    const requiredFields: (keyof PetPersonality)[] = [
      'description',
      'interests',
      'traits',
      'name',
      'species'
    ];

    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`Invalid response: missing ${field}`);
      }
    }

    // Validate array lengths
    if (result.interests.length < 3 || result.interests.length > 5) {
      throw new Error(`Invalid number of interests: expected 3-5, got ${result.interests.length}`);
    }
    if (result.traits.length < 3 || result.traits.length > 4) {
      throw new Error(`Invalid number of traits: expected 3-4, got ${result.traits.length}`);
    }

    const ownerProfileData = await fetchProfileInfoByFid(userFid);

    const pfp_url = await generatePfp(ownerProfileData, result, character);

    result.pfp_url = pfp_url;
    result.ownerUsername = ownerProfileData.username;

    return result;
  } catch (error) {
    console.error("Error generating pet personality:", error);
    if (error instanceof Error) {
      throw new Error(`Pet generation failed: ${error.message}`);
    }
    throw error;
  }
}