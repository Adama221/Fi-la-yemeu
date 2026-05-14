import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function generateResponse(
  prompt: string, 
  image?: { data: string, mimeType: string }, 
  history: any[] = [], 
  db?: any
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configurée sur le serveur');
  }
  
  const systemInstruction = `Tu es l'assistant de mode expert de Samabutik, une boutique de haute couture élégante au Sénégal. 
Ton ton est sophistiqué, chaleureux et professionnel. Tu aides les clients à trouver le look parfait, conseilles sur les tendances de mode (spécialement la mode africaine moderne et classique) et réponds aux questions sur les produits. 
N'hésite pas à utiliser des termes de mode et à être très stylé dans tes réponses.

Tu as accès à deux outils principaux :
1. Recherche Google : Pour les tendances actuelles et informations externes.
2. Recherche de produits : Pour trouver des articles spécifiques dans notre catalogue (Sénégal).

Si on te pose des questions sur les prix ou les stocks, utilise l'outil de recherche de produits si possible, sinon invite l'utilisateur à consulter les fiches produits.`;

  // Define tools
  const tools = [
    { googleSearch: {} },
    {
      functionDeclarations: [
        {
          name: "get_products",
          description: "Recherche des produits dans le catalogue de Samabutik par mot-clé ou catégorie.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Le mot-clé (ex: robe, boubou, mariage)" },
              category: { type: Type.STRING, description: "La catégorie (ex: Homme, Femme, Accessoires)" }
            }
          }
        }
      ]
    }
  ];

  const contents: any[] = [];
  
  // Add history
  history.forEach(item => {
    contents.push({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }]
    });
  });

  // Current prompt
  if (image) {
    contents.push({
      role: 'user',
      parts: [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: prompt || "Analyse cette image." }
      ]
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction,
      tools: tools
    }
  });

  // Handle Function Calling
  let responseText = result.text;
  const calls = result.functionCalls;

  if (calls && calls.length > 0 && db) {
    const call = calls[0];
    if (call.name === "get_products") {
      const { query, category } = call.args as any;
      const productsSnap = await db.collection('products').get();
      const products: any[] = [];
      productsSnap.forEach((doc: any) => {
        const p = doc.data();
        if (
          (!query || p.name?.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())) &&
          (!category || p.category === category)
        ) {
          products.push({ name: p.name, price: p.price, category: p.category });
        }
      });

      // Send function response back to Gemini
      const secondResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...contents,
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: "get_products", response: { products: products.slice(0, 5) } } }] }
        ],
        config: { systemInstruction, tools }
      });
      responseText = secondResult.text;
    }
  }

  return responseText;
}
