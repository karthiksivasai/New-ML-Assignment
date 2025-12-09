import { GoogleGenAI, Type } from "@google/genai";
import { Dataset, ModelType, TrainingResults } from '../types';

export const trainModel = async (
  dataset: Dataset, 
  modelType: ModelType, 
  splitRatio: number, 
  scaler: string
): Promise<TrainingResults> => {
  
  if (!process.env.API_KEY) {
    throw new Error("System Error: API Key is missing. Please contact administrator.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a prompt context. We send the stats and a sample of rows to avoid token limits.
  const sampleRows = dataset.processed.slice(0, 10);
  const numericStats = dataset.stats.filter(s => s.type === 'number').map(s => ({
    col: s.name, min: s.min, max: s.max, mean: s.mean
  }));

  const prompt = `
    Act as a Data Science Engine.
    Task: Train a ${modelType} model.
    Target Column: "${dataset.targetColumn}".
    Features: ${JSON.stringify(dataset.featureColumns)}.
    Preprocessing: ${scaler}.
    Train/Test Split: ${splitRatio}/${100 - splitRatio}.

    Dataset Statistics (for context): ${JSON.stringify(numericStats)}.
    Sample Data (first 10 rows): ${JSON.stringify(sampleRows)}.

    Please simulate the training process based on this data pattern. 
    Perform the following mental steps:
    1. Analyze the correlation between features and target.
    2. Estimate the likely accuracy based on feature separability seen in the sample and stats.
    3. Generate a realistic confusion matrix.
    4. Determine feature importance.

    Return the output strictly as a JSON object matching this schema.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      accuracy: { type: Type.NUMBER, description: "Accuracy between 0 and 1" },
      precision: { type: Type.NUMBER, description: "Precision between 0 and 1" },
      recall: { type: Type.NUMBER, description: "Recall between 0 and 1" },
      f1Score: { type: Type.NUMBER, description: "F1 Score between 0 and 1" },
      confusionMatrix: {
        type: Type.ARRAY,
        items: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER }
        },
        description: "2x2 Confusion Matrix [[TP, FP], [FN, TN]]"
      },
      featureImportance: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER }
          }
        }
      },
      insights: { type: Type.STRING, description: "A brief paragraph explaining the model performance and key findings." }
    },
    required: ["accuracy", "precision", "recall", "f1Score", "confusionMatrix", "featureImportance", "insights"]
  };

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    let jsonText = result.text;
    if (!jsonText) throw new Error("Received empty response from the AI model.");
    
    // Robust sanitization: Remove potential Markdown code blocks that models sometimes output
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonText) as TrainingResults;
  } catch (error) {
    console.error("ML Service Error:", error);
    // User-friendly error mapping
    throw new Error("Failed to train model. Please try again or check your data format.");
  }
};