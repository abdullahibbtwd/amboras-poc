import { GoogleGenAI } from "@google/genai";
import { getThemeContextForQuestion } from "./extractor.js";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function getFriendlyErrorMessage(err) {
  const fallback =
    "Something went wrong while contacting AI. Please try again in a moment.";
  const raw = err?.message || "";

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const apiError = parsed?.error;
  const code = apiError?.code;
  const status = apiError?.status;
  const message = apiError?.message || raw;

  if (code === 429 || status === "RESOURCE_EXHAUSTED") {
    return "Usage limit reached right now. Please wait a bit and try again.";
  }

  if (code === 503 || status === "UNAVAILABLE") {
    return "AI service is busy at the moment. Please try again shortly.";
  }

  if (message?.toLowerCase().includes("api key")) {
    return "AI API key seems invalid or missing. Please check server configuration.";
  }

  return fallback;
}

export async function askQuestion(question) {
  const themeContext = getThemeContextForQuestion(question);
  const prompt = `
You are an expert Shopify theme analyst.
Use ONLY the provided context.
If the question asks about colors, return ONLY a concise bullet list in this format:
- foreground: black (#000000)
- background: not explicitly set
Rules for color answers:
- No paragraphs, no headings, no explanations.
- No mention of files, JSON, CSS variables, or analysis process.
- Include only final color mappings and explicit values.
- If a color is not explicitly defined, write: "not explicitly set".
- Keep each bullet to one line.
If the question asks about button style, include all available style details as concise bullets:
- button font family / weight / size
- text color
- background color
- border thickness / opacity
- radius
- shadow (opacity, offset, blur)
- related input or pill style values when relevant
For button colors:
- If scheme-specific button colors exist, list them per scheme (e.g., scheme-1, scheme-2).
- Do NOT say "not explicitly set" when scheme-specific button color values are available in context.
For non-color questions, answer with short bullets and concrete values only.

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
    return getFriendlyErrorMessage(err);
  }
}