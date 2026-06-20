import OpenAI from "openai";
import { z } from "zod";
import type { MealAnalysisResult } from "@lifeplate/shared";
import { config } from "../config.js";
import {
  assertMealAnalysis,
  rejectNonMealDescription,
  rejectNonMealPhoto,
} from "./mealGuardrails.js";

const analysisFieldsSchema = z.object({
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

const textResponseSchema = z.object({
  isFoodDescription: z.boolean(),
  rejectReason: z.string().nullable().optional(),
  mealName: z.string().optional(),
  foods: z.array(z.string()).optional(),
  estimatedCalories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fibre: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const TEXT_SYSTEM_PROMPT = `You are a nutrition assistant for LifePlate.
The user is logging a meal without a photo by describing what they ate.
Return JSON only.

First decide if the description is about food someone ate or plans to eat.
ACCEPT: meals, snacks, beverages, ingredients, restaurant orders, simple food lists.
REJECT: non-food topics, gibberish, empty descriptions, questions with no food.

Return these keys:
- isFoodDescription (boolean): true only if the text describes food
- rejectReason (string|null): brief reason when isFoodDescription is false, otherwise null

When isFoodDescription is true, also return:
- mealName
- foods (non-empty array of identifiable food items)
- estimatedCalories
- protein (grams)
- carbs (grams)
- fat (grams)
- fibre (grams)
- sugar (grams)
- sodium (milligrams)
- confidence (0 to 1; lower when the description is vague)

Do not return markdown.`;

const visionResponseSchema = z.object({
  isMealPhoto: z.boolean(),
  rejectReason: z.string().nullable().optional(),
  mealName: z.string().optional(),
  foods: z.array(z.string()).optional(),
  estimatedCalories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fibre: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const SYSTEM_PROMPT = `You are a nutrition assistant for LifePlate, a meal-photo journaling app.
Return JSON only.

First decide if this image is suitable for meal logging.
ACCEPT: plated meals, bowls, snacks, beverages, packaged food with visible contents, grocery food items, ingredients clearly meant as food.
REJECT: people/portraits, pets, landscapes, documents, screenshots, memes, logos, random objects with no edible content, empty plates with no food, restaurant menus without visible food on a plate.

Return these keys:
- isMealPhoto (boolean): true only if the image is suitable for meal logging
- rejectReason (string|null): brief reason when isMealPhoto is false, otherwise null

When isMealPhoto is true, also return:
- mealName
- foods (non-empty array of identifiable food items)
- estimatedCalories
- protein (grams)
- carbs (grams)
- fat (grams)
- fibre (grams)
- sugar (grams)
- sodium (milligrams)
- confidence (0 to 1)

Do not return markdown.`;

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

const isProduction = process.env.NODE_ENV === "production";

function isPlaceholderKey(key: string): boolean {
  const k = key.trim();
  if (!k) return true;
  if (k.includes("your-openai-key")) return true;
  if (k.startsWith("sk-your-")) return true;
  return false;
}

function assertOpenAiConfigured() {
  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
}

function parseTextResponse(parsed: unknown): MealAnalysisResult {
  const result = textResponseSchema.parse(parsed);

  if (!result.isFoodDescription) {
    rejectNonMealDescription(result.rejectReason);
  }

  const analysis = analysisFieldsSchema.parse({
    mealName: result.mealName,
    foods: result.foods,
    estimatedCalories: result.estimatedCalories,
    protein: result.protein,
    carbs: result.carbs,
    fat: result.fat,
    fibre: result.fibre,
    sugar: result.sugar,
    sodium: result.sodium,
    confidence: result.confidence,
  });

  assertMealAnalysis(analysis, "text");
  return analysis;
}

function parseVisionResponse(parsed: unknown): MealAnalysisResult {
  const result = visionResponseSchema.parse(parsed);

  if (!result.isMealPhoto) {
    rejectNonMealPhoto(result.rejectReason);
  }

  const analysis = analysisFieldsSchema.parse({
    mealName: result.mealName,
    foods: result.foods,
    estimatedCalories: result.estimatedCalories,
    protein: result.protein,
    carbs: result.carbs,
    fat: result.fat,
    fibre: result.fibre,
    sugar: result.sugar,
    sodium: result.sodium,
    confidence: result.confidence,
  });

  assertMealAnalysis(analysis);
  return analysis;
}

export async function analyzeMealImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ analysis: MealAnalysisResult; raw: unknown }> {
  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    if (isProduction) assertOpenAiConfigured();
    return { analysis: MOCK, raw: { ...MOCK, isMealPhoto: true, mock: true } };
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
            { type: "text", text: "Classify this image, then analyze the meal if it is food." },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");
    const parsed = JSON.parse(content);
    const analysis = parseVisionResponse(parsed);
    return { analysis, raw: parsed };
  };

  try {
    return await run();
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status?: unknown }).status === 401
    ) {
      if (isProduction) throw new Error("OpenAI authentication failed");
      return { analysis: MOCK, raw: { ...MOCK, isMealPhoto: true, mock: true } };
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
        if (isProduction) throw new Error("OpenAI authentication failed");
        return { analysis: MOCK, raw: { ...MOCK, isMealPhoto: true, mock: true } };
      }
      throw err2;
    }
  }
}

export async function analyzeMealText(
  description: string,
): Promise<{ analysis: MealAnalysisResult; raw: unknown }> {
  const text = description.trim();
  if (!text) {
    rejectNonMealDescription("empty description");
  }

  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    if (isProduction) assertOpenAiConfigured();
    const mockName = text.length > 40 ? `${text.slice(0, 37)}…` : text;
    return {
      analysis: { ...MOCK, mealName: mockName },
      raw: { ...MOCK, isFoodDescription: true, textOnly: true, mock: true },
    };
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });

  const run = async () => {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TEXT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Describe what I ate:\n${text}`,
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");
    const parsed = JSON.parse(content);
    const analysis = parseTextResponse(parsed);
    return { analysis, raw: { ...parsed, textOnly: true } };
  };

  try {
    return await run();
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status?: unknown }).status === 401
    ) {
      if (isProduction) throw new Error("OpenAI authentication failed");
      const mockName = text.length > 40 ? `${text.slice(0, 37)}…` : text;
      return {
        analysis: { ...MOCK, mealName: mockName },
        raw: { ...MOCK, isFoodDescription: true, textOnly: true, mock: true },
      };
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
        if (isProduction) throw new Error("OpenAI authentication failed");
        const mockName = text.length > 40 ? `${text.slice(0, 37)}…` : text;
        return {
          analysis: { ...MOCK, mealName: mockName },
          raw: { ...MOCK, isFoodDescription: true, textOnly: true, mock: true },
        };
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

  const refinePrompt = `Re-analyze this already-validated meal photo using the user's correction.
Previous analysis JSON: ${JSON.stringify(previous)}
User correction: "${note}"
Apply the correction (e.g. sauce type, portion, missing item). Update foods, macros, and confidence accordingly.
Keep isMealPhoto true. Return JSON only with keys: isMealPhoto, rejectReason, mealName, foods, estimatedCalories, protein, carbs, fat, fibre, sugar, sodium, confidence.`;

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
  const analysis = parseVisionResponse(parsed);
  return { analysis, raw: { refined: true, clarification: note, ...parsed } };
}

const REANALYZE_SYSTEM_PROMPT = `You are a nutrition assistant for LifePlate.
The user edited a logged meal and provided an authoritative list of foods they ate.
Re-estimate the full meal nutrition from that list only — do not invent extra foods.
Return JSON only with keys:
- mealName (string; keep or lightly improve the provided name)
- foods (non-empty array; normalize spelling but include every user item)
- estimatedCalories
- protein (grams)
- carbs (grams)
- fat (grams)
- fibre (grams)
- sugar (grams)
- sodium (milligrams)
- confidence (0 to 1; lower when portions are unclear)

Do not return markdown.`;

export async function reanalyzeMealFromFoods(input: {
  mealName: string;
  mealType?: string | null;
  foods: string[];
}): Promise<{ analysis: MealAnalysisResult; raw: unknown }> {
  const foods = input.foods.map((food) => food.trim()).filter(Boolean);
  if (foods.length === 0) {
    rejectNonMealDescription("empty food list");
  }

  const mealName = input.mealName.trim() || "Meal";
  const userPrompt = [
    `Meal name: ${mealName}`,
    input.mealType ? `Meal type: ${input.mealType}` : null,
    `Foods eaten: ${foods.join(", ")}`,
    "Re-estimate total macros for everything listed.",
  ]
    .filter(Boolean)
    .join("\n");

  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    if (isProduction) assertOpenAiConfigured();
    return {
      analysis: {
        ...MOCK,
        mealName,
        foods,
        confidence: Math.min(0.9, MOCK.confidence + 0.05),
      },
      raw: { reanalyzed: true, textOnly: true, mock: true, foods },
    };
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REANALYZE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty OpenAI response");
  const parsed = JSON.parse(content);
  const analysis = analysisFieldsSchema.parse(parsed);
  assertMealAnalysis(analysis, "text");
  return { analysis, raw: { reanalyzed: true, ...parsed } };
}
