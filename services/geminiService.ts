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
      [
        "You are an expert Indian agricultural assistant (कृषी तज्ञ) specializing in crop disease,",
        "pest, and nutrient diagnostics from leaf/plant images and short questions.",
        "OUTPUT CONTRACT:",
        "1) Respond ONLY with JSON that strictly matches the provided schema.",
        "2) All human-readable text must be in Marathi (mr-IN).",
        "3) Keep enum fields exactly as defined by the schema (e.g., severity must be one of: low, moderate, high, critical).",
        "STYLE:",
        "- Clear, farmer-friendly Marathi. Short sentences. No markdown.",
        "- Diagnosis must be specific (उदा. 'अर्ली ब्लाईट (Alternaria solani)').",
        "- Actions must be practical, stepwise, low-cost first, and safe.",
        "SAFETY/GUIDELINES:",
        "- If chemical control is suggested, give generic actives (उदा. 'imidacloprid 17.8% SL') not brands.",
        "- Mention basic PPE and re-entry/harvest gap only if relevant.",
        "- If image quality is poor or diagnosis uncertain, set lower confidence and add warnings + need_expert=true.",
        "- If the question is unrelated to agriculture, say so in Marathi and set low confidence.",
      ].join(" ")
  });

  const generationConfig: any = {
    responseMimeType: "application/json",
    responseSchema,
    temperature: 0.2
  };

  const userTask =
    [
      "TASK:",
      "दिलेल्या फोटो आणि प्रश्नावर आधारित, पिकाचे आजार/किड/आहारकमतरता ओळखा.",
      "खालील JSON स्कीमा प्रमाणेच फील्ड भरा. फक्त वैध JSON परत करा.",
      "",
      "REQUIREMENTS:",
      "- diagnosis: मराठीत, शक्य तितके विशिष्ट (उदा., रोगाचे/किडीचे नाव + वैज्ञानिक नाव).",
      "- probable_causes: 3–6 बुलेट्स, मराठीत, लक्षणे/हवामान/शेती पद्धती संदर्भात.",
      "- severity: {low|moderate|high|critical} पैकी एक (इंग्रजीतच).",
      "- recommended_actions: 4–8, चरणबद्ध, मराठीत, प्रथम कृषी व सांस्कृतिक उपाय; नंतर जैविक/रसायनिक उपाय.",
      "- warnings: गरज असल्यास मराठी चेतावणी (उदा., 'चित्र अस्पष्ट', 'रासायनिक वापरताना PPE').",
      "- need_expert: अस्पष्टता/गंभीरता असल्यास true.",
      "- confidence: 0.0–1.0; आधार नसल्यास कमी ठेवा.",
      "- metadata.captured_on: ISO तारीख (auto if unknown).",
      "- metadata.prompt: वापरकर्त्याचा प्रश्न मराठीत संक्षिप्त.",
      "",
      "CONTEXT HINTS:",
      "- भारतातील हवामान/पीक पद्धती गृहीत धरा.",
      "- जर प्रतिमेत एकाहून अधिक शक्यता दिसत असतील तर सर्वात संभाव्य द्या आणि बाकी causes मध्ये नोंदवा.",
      "",
      "LANGUAGE:",
      "- Marathi (mr-IN) for all strings/arrays.",
      "- Only severity enum remains English."
    ].join("\n");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: userTask },
          imagePart as any,
          {
            text:
              [
                `User question (original): ${prompt}`,
                "",
                "Convert/condense the question into Marathi for metadata.prompt.",
              ].join("\n")
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

  // If still no JSON, wrap raw into default structure (Marathi)
  if (!json) {
    json = {
      diagnosis: raw.slice(0, 5000),
      confidence: 0,
      probable_causes: [],
      severity: "low",
      recommended_actions: [],
      warnings: ["मॉडेलने फक्त मजकूर परत केला; कच्चा निदान दर्शवित आहोत."],
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
  } else {
    // ensure captured_on exists
    if (!json.metadata.captured_on) {
      json.metadata.captured_on = new Date().toISOString();
    }
    if (!json.metadata.prompt) {
      json.metadata.prompt = toText(prompt);
    }
  }

  const modelResult: ModelResult = { raw, json };
  return modelResult;
};
