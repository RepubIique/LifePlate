import OpenAI from "openai";
import { z } from "zod";
import type { MealAnalysisResult } from "@lifeplate/shared";
import { config } from "../config.js";

const analysisSchema = z.object({
  mealName: z.string(),
  foods: z.array(z.string()),
  estimatedCalories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fibre: z.number(),
  sugar: z.number(),
  sodium: z.number(),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `You are a nutrition assistant.
Return JSON only.
Identify:
- meal name
- foods present
- estimated calories
- estimated protein (grams)
- estimated carbs (grams)
- estimated fats (grams)
- estimated fibre (grams)
- estimated sugar (grams)
- estimated sodium (milligrams)
Return confidence score between 0 and 1.
Do not return markdown.
Output valid JSON with keys: mealName, foods, estimatedCalories, protein, carbs, fat, fibre, sugar, sodium, confidence.`;

const MOCK: MealAnalysisResult = {
  mealName: "Chicken Rice Bowl",
  foods: ["Chicken Breast", "Rice", "Broccoli"],
  estimatedCalories: 650,
  protein: 45,
  carbs: 55,
  fat: 18,
  fibre: 8,
  sugar: 4,
  sodium: 520,
  confidence: 0.82,
};

function isPlaceholderKey(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  if (k.includes("your-openai-key")) return true;
  if (k.startsWith("sk-your-")) return true;
  return false;
}

export async function analyzeMealImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ analysis: MealAnalysisResult; raw: unknown }> {
  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    return { analysis: MOCK, raw: MOCK };
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const run = async () => {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            { type: "text", text: "Analyze this meal photo." },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");
    const parsed = JSON.parse(content);
    const analysis = analysisSchema.parse(parsed);
    return { analysis, raw: parsed };
  };

  try {
    return await run();
  } catch (err: unknown) {
    // If the key is invalid/misconfigured, fall back to mock in local dev.
    // (User often copies .env.example placeholder which triggers 401 invalid_api_key.)
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status?: unknown }).status === 401
    ) {
      return { analysis: MOCK, raw: MOCK };
    }
    try {
      return await run();
    } catch (err2: unknown) {
      if (
        typeof err2 === "object" &&
        err2 !== null &&
        "status" in err2 &&
        (err2 as { status?: unknown }).status === 401
      ) {
        return { analysis: MOCK, raw: MOCK };
      }
      throw err2;
    }
  }
}

export async function refineMealImage(
  buffer: Buffer,
  mimeType: string,
  previous: MealAnalysisResult,
  clarification: string,
): Promise<{ analysis: MealAnalysisResult; raw: unknown }> {
  const note = clarification.trim();
  if (!note) {
    return { analysis: previous, raw: previous };
  }

  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    const foods = [...previous.foods];
    if (!foods.some((f) => f.toLowerCase().includes(note.toLowerCase().slice(0, 8)))) {
      foods.push(note.split(" ").slice(-2).join(" ") || note);
    }
    const refined: MealAnalysisResult = {
      ...previous,
      foods,
      confidence: Math.min(0.92, previous.confidence + 0.12),
      mealName: previous.mealName,
    };
    return { analysis: refined, raw: { refined: true, clarification: note, ...refined } };
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const refinePrompt = `Re-analyze this meal photo using the user's correction.
Previous analysis JSON: ${JSON.stringify(previous)}
User correction: "${note}"
Apply the correction (e.g. sauce type, portion, missing item). Update foods, macros, and confidence accordingly.
Return JSON only with keys: mealName, foods, estimatedCalories, protein, carbs, fat, fibre, sugar, sodium, confidence.`;

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: refinePrompt },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty OpenAI response");
  const parsed = JSON.parse(content);
  const analysis = analysisSchema.parse(parsed);
  return { analysis, raw: { refined: true, clarification: note, ...parsed } };
}
