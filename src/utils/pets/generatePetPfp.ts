import { getColorsFromProfilePic } from "./getColorsFromProfilePic";
import { PetCharacter, PetPersonality, ProfileInfo } from "./types";
import { uploadImageToPinata } from "./uploadPetPfpToPinata";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generatePfp = async (
  userProfileData: ProfileInfo,
  petPersonality: PetPersonality,
  character: PetCharacter
): Promise<string> => {
  const ownerPfpUrl = userProfileData.pfp_url;
  const pfpColors = await getColorsFromProfilePic(ownerPfpUrl);

  // Helper function to get style attributes based on character type
  const getCharacterStyle = (character: PetCharacter) => {
    switch (character) {
      case "male":
        return {
          pose: "confident pose, head held high, proud stance",
          expression: "friendly but confident smile, alert eyes",
          features: "strong, well-defined features, neat appearance"
        };
      case "female":
        return {
          pose: "graceful pose, elegant posture, gentle tilt of the head",
          expression: "warm, inviting smile, sparkling eyes",
          features: "refined features, delicate details, flowing elements"
        };
      case "baby":
        return {
          pose: "playful pose, slightly tilted head, bouncy stance",
          expression: "big innocent eyes, adorable smile, excited look",
          features: "round features, extra fluffy, small and cute proportions"
        };
    };
  };

  // Get character-specific styling
  const style = getCharacterStyle(character);

  const profilePictureGenerationPrompt = `Create a Disney-style 2D portrait of a ${petPersonality.species} character for a profile picture, incorporating these specific elements:
  
  COLOR SCHEME:
  * Primary colors from owner's profile: ${pfpColors.join(', ')}
  * Use these colors for key elements while maintaining natural ${petPersonality.species} features
  * Ensure colors blend harmoniously and maintain Disney-like vibrancy
  
  CHARACTER DESIGN:
  * Species: ${petPersonality.species}
  * Character Type: ${character}
  * Personality Traits: ${petPersonality.traits.join(', ')}
  * Pose: ${style.pose}
  * Expression: ${style.expression}
  * Features: ${style.features}
  
  ARTISTIC STYLE:
  * Disney 2D animation style, similar to modern Disney films
  * Clean, bold lines with smooth curves
  * Professional lighting with subtle highlights and shadows
  * Soft gradients and careful color blending
  * High attention to detail in fur/feathers/scales texture
  * Engaging eye design with catchlights and depth
  
  COMPOSITION:
  * Head and shoulders portrait format
  * Centered composition with slight angle for dynamic feel
  * Subtle background gradient using owner's profile colors
  * Clear focal point on face and eyes
  * Professional profile picture framing
  * Seamless edge treatment
  
  TECHNICAL SPECIFICATIONS:
  * Ensure clean, vector-like quality
  * Sharp details without pixelation
  * Professional lighting and shading
  * No text or overlays
  * No accessories unless specifically tied to personality traits
  
  CRITICAL REQUIREMENTS:
  * Must be instantly likable and appealing
  * Should look natural and characterful, not artificial
  * Must maintain professional quality while being friendly
  * Should feel like a coherent character, not a generic animal
  * Must be appropriate for all audiences
  
  PERSONALITY EXPRESSION:
  ${petPersonality.description}
  * Show personality through facial expression and pose
  * Incorporate subtle hints of listed interests: ${petPersonality.interests.join(', ')}
  * Maintain consistency with personality traits
  
  DO NOT INCLUDE:
  * No human elements or clothing unless essential to character
  * No props or busy backgrounds
  * No text or graphics
  * No overly cartoony or exaggerated features
  * No photorealistic elements
  
  Create this as a high-quality, professional profile picture that would fit seamlessly into a social media platform while maintaining Disney's signature charm and appeal.`;

  console.log("profilePictureGenerationPrompt", profilePictureGenerationPrompt);

  const imageResponse = await openai.images.generate({
    model: "dall-e-3",
    prompt: profilePictureGenerationPrompt,
    size: "1024x1024",
    quality: "hd",
    n: 1,
  });

  const openaiImageUrl = imageResponse.data[0].url;
  const pfp_url = await uploadImageToPinata(openaiImageUrl, petPersonality.name);

  return pfp_url;
};

