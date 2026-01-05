
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TACTICAL_PHRASES = [
  "Мы побеждаем!",
  "А они сильны!!",
  "Вижу цель на радаре!",
  "Держим строй, не сдаваться!",
  "Враг отступает, поднажмем!",
  "Зарядить ионные пушки!",
  "Щиты на пределе, маневрируй!",
  "Отличный выстрел, командир!",
  "Они повсюду! Прикрой меня!",
  "Галактика будет свободна!"
];

// Simple state to track if we are currently rate limited
let isRateLimited = false;
let rateLimitResetTime = 0;

const FALLBACK_PILOT_URL = 'https://files.oaiusercontent.com/file-2fVjYQf3xK4P7k7T7GzE37M?se=2025-02-23T14%3A50%3A58Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D035f0f35-8664-46c9-9477-8f55309320b9.webp&sig=0/K0%3D';

export const getTacticalBriefing = async (score: number, level: number, health: number) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (health < 30) {
    return "Критическое состояние базы! Перенаправьте все ресурсы на перехват ближайших целей!";
  }
  const randomIndex = Math.floor(Math.random() * TACTICAL_PHRASES.length);
  return TACTICAL_PHRASES[randomIndex];
};

export const generatePilotImage = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        text: 'A close-up cinematic camera feed of a energetic ginger man with glasses sitting in a sci-fi spaceship cockpit, holding a futuristic flight steering wheel with both hands, intense and focused, glowing dashboard lights, stars outside the window, high fidelity, 4k.'
      }],
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return FALLBACK_PILOT_URL;
  } catch (error) {
    console.warn("Pilot generation failed, using fallback:", error);
    return FALLBACK_PILOT_URL;
  }
};

export const speakPilotPhrase = async (phrase: string): Promise<string | null> => {
  // Check if we are currently cooling down from a 429
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    return null;
  } else if (isRateLimited) {
    isRateLimited = false;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with extreme excitement: ${phrase}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error: any) {
    // Check for 429 specifically
    if (error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("TTS Quota exceeded. Entering cooldown...");
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 60000; // 1 minute cooldown
    } else {
      console.error("TTS failed", error);
    }
    return null;
  }
};

export const getRandomPilotPhrase = () => {
  return TACTICAL_PHRASES[Math.floor(Math.random() * TACTICAL_PHRASES.length)];
};
