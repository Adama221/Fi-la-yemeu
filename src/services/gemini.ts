import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function generateResponse(prompt: string, image?: { data: string, mimeType: string }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configurée sur le serveur');
  }
  
  const systemInstruction = `Tu es l'assistant de mode expert de Samabutik, une boutique de haute couture élégante au Sénégal. 
Ton ton est sophistiqué, chaleureux et professionnel. Tu aides les clients à trouver le look parfait, conseilles sur les tendances de mode (spécialement la mode africaine moderne et classique) et réponds aux questions sur les produits. 
N'hésite pas à utiliser des termes de mode et à être très stylé dans tes réponses.
Si on te pose des questions sur les prix ou les stocks, explique que tu es un conseiller en style et invite l'utilisateur à consulter les fiches produits pour les détails précis.`;

  const contents: any[] = [];
  if (image) {
    contents.push({
      parts: [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt }
      ]
    });
  } else {
    contents.push(prompt);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  return response.text;
}
