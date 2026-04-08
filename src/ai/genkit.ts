// src/ai/genkit.ts
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { keyManager } from "@/lib/gemini-key-manager";

// Get first available key for Genkit initialization
const initialKey = keyManager.getNextKey();

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: initialKey,
    }),
  ],
  model: "googleai/gemini-2.5-flash",
});