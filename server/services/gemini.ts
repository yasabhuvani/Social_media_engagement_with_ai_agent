/**
 * Server-side Gemini API Integration via @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const GEMINI_MODEL = 'gemini-3.8-flash';
export const EMBEDDING_MODEL = 'gemini-embedding-2-preview';

/**
 * Generate structured text using Gemini 3.8 Flash
 */
export async function generateAgentText(params: {
  systemInstruction?: string;
  prompt: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: params.prompt,
    config: {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature ?? 0.7,
      responseMimeType: params.responseMimeType,
    },
  });

  return response.text || '';
}

/**
 * Generate vector embedding using Gemini embedding model
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!apiKey || !text) return null;
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });
    // In @google/genai, embeddings is an array
    if (result && result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
      return result.embeddings[0].values;
    }
    return null;
  } catch (err) {
    console.warn('Gemini embedContent failed, falling back to local hybrid vectorizer:', err);
    return null;
  }
}
