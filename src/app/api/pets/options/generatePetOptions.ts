import { prisma } from "@/prisma/client";
import { PetOption, SupercastFarcasterAccount } from "@prisma/client";
import OpenAI from "openai";
import axios from "axios";
import { uploadImageToPinata } from "../../../../utils/pets/uploadPetPfpToPinata";
import { getUserPersonality } from "@/utils/pets/personalityTest";
import { generatePet } from "@/utils/pets/generatePet";

export const generatePetOptions = async (
  farcasterAccount: SupercastFarcasterAccount,
): Promise<PetOption[]> => {

  const userFid = farcasterAccount.fid;

  const userPersonality = await getUserPersonality(userFid);

  const [pet_male, pet_female, pet_baby, savedUserPersonality] = await Promise.all([
    generatePet(userFid, userPersonality, "male"),
    generatePet(userFid, userPersonality, "female"),
    generatePet(userFid, userPersonality, "baby"),

    prisma.userPersonality.create({
      data: {
        ...userPersonality,
        supercastFarcasterAccountId: farcasterAccount.id,
      },
    }),
  ]);

  const createdPets = await Promise.all([
    prisma.petOption.create({
      data: {
        ...pet_male,
        ownerId: farcasterAccount.id,
      },
    }),
    prisma.petOption.create({
      data: {
        ...pet_female,
        ownerId: farcasterAccount.id,
      },
    }),
    prisma.petOption.create({
      data: {
        ...pet_baby,
        ownerId: farcasterAccount.id,
      },
    }),
  ]);

  return createdPets;
};
