import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseModelJsonOutput } from '../utils/formatters';
import type { ModelResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Gemini API key is not configured. Please set the VITE_GEMINI_API_KEY environment variable.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Strict response schema for consistent UI
const responseSchema = {
  type: "object",
  properties: {
    diagnosis: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    probable_causes: { type: "array", items: { type: "string" } },
    severity: { type: "string", enum: ["low", "moderate", "high", "critical"] },
    recommended_actions: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    need_expert: { type: "boolean" },
    metadata: {
      type: "object",
      properties: {
        captured_on: { type: "string" },
        prompt: { type: "string" }
      },
      required: ["captured_on", "prompt"]
    }
  },
  required: ["diagnosis", "confidence", "probable_causes", "severity", "recommended_actions", "need_expert", "metadata"]
} as const;

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as a data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  const data = await base64EncodedDataPromise;
  return {
    inlineData: { data, mimeType: file.type },
  };
}

// normalizers to keep UI primitive-safe
const toText = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    if ("description" in v && typeof (v as any).description === "string") {
      return ("type" in v && (v as any).type) ? `${(v as any).type}: ${(v as any).description}` : (v as any).description;
    }
    try { return JSON.stringify(v); } catch { return ""; }
  }
  return String(v);
};

const toTextArray = (arr: any): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(toText).filter(Boolean);
};

export const analyzePlantImage = async (image: File, prompt: string): Promise<ModelResult> => {
  if (!genAI) {
    throw new Error("Gemini API key is not configured. Please set the VITE_GEMINI_API_KEY environment variable.");
  }

  const imagePart = await fileToGenerativePart(image);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction:
      "You are an expert agricultural assistant specializing in plant diseases and crop health. " +
      "Only return JSON that matches the provided schema. Do not include any explanatory text outside of JSON."
  });

  const generationConfig: any = {
    responseMimeType: "application/json",
    responseSchema,
    temperature: 0.3
  };

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: "Analyze the plant image and user question. Return ONLY valid JSON per schema." },
          imagePart as any,
          {
            text:
              `Question: ${prompt}\n` +
              `Make the diagnosis specific (e.g., 'Early blight (Alternaria solani)').\n` +
              `Keep 'recommended_actions' actionable for a farmer.`
          }
        ]
      }
    ],
    generationConfig
  });

  const response = await result.response;
  const raw = await response.text();

  // Try strict parse first
  let json: any | undefined = undefined;

  try {
    json = JSON.parse(raw);
  } catch {
    const parsed = parseModelJsonOutput(raw);
    json = parsed.json;
    if (parsed.error) {
      console.warn("Model JSON parse warning:", parsed.error);
    }
  }

  // If still no JSON, wrap raw into default structure
  if (!json) {
    json = {
      diagnosis: raw.slice(0, 5000),
      confidence: 0,
      probable_causes: [],
      severity: "low",
      recommended_actions: [],
      warnings: ["Model returned plain text; showing raw diagnosis."],
      need_expert: false,
      metadata: { captured_on: new Date().toISOString(), prompt }
    };
  }

  // Normalize to primitives/arrays of strings
  json.diagnosis = toText(json.diagnosis);
  json.probable_causes = toTextArray(json.probable_causes);
  json.recommended_actions = toTextArray(json.recommended_actions);
  json.warnings = toTextArray(json.warnings);
  if (!json.metadata) {
    json.metadata = { captured_on: new Date().toISOString(), prompt };
  }

  const modelResult: ModelResult = { raw, json };
  return modelResult;
};
