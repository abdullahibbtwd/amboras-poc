import { GoogleGenAI } from "@google/genai";
import { extractThemeContext } from "./extractor.js";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Extract once when server starts
const themeContext = extractThemeContext();

export async function askQuestion(question) {
  const prompt = `
You are an expert Shopify theme analyst.
Use ONLY the provided context.

=== THEME CONTEXT ===
${themeContext}
=== END CONTEXT ===

Question: ${question}
Answer:
`;

  try {
  
  const response = await ai.models.generateContent({
  model: "gemini-flash-latest",
  contents: prompt,
});

    return response.text;
  } catch (err) {
    console.error(err);
    return "Error: " + err.message;
  }
}