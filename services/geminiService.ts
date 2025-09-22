
import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = (imageModelId: string, stylePrompt?: string): string => {
    let instruction = `You are an expert at writing creative, detailed, and artistic prompts for AI image generators. A user will provide a simple idea, and you must expand it into a single, descriptive paragraph. Do not add any extra text, explanations, or markdown. Only return the enhanced prompt text.`;
    
    if (imageModelId.toLowerCase().includes('flux')) {
        instruction += `\nThe target image model is 'flux', which excels with highly descriptive, detailed, and narrative-style prompts. Focus on scene composition, lighting, mood, and fine details. Avoid simple lists of keywords.`;
    } else if (imageModelId.toLowerCase().includes('turbo')) {
        instruction += `\nThe target image model is 'turbo', which works best with a mix of descriptive phrases and specific keywords. Be concise but impactful.`;
    } else {
        instruction += `\nThe prompt should be well-suited for a modern, general-purpose AI image generator.`;
    }

    if (stylePrompt) {
        instruction += `\n\nIt is crucial to preserve the following artistic style. Integrate it seamlessly into the enhanced prompt: "${stylePrompt}". The style is the most important component and should not be altered, only expanded upon.`;
    }
    return instruction;
};

/**
 * Checks if a Gemini API key is valid by making a lightweight test call.
 * @param apiKey The Gemini API key to validate.
 * @returns A promise that resolves to true if the key is valid, false otherwise.
 */
export const checkGeminiApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        // A very simple, low-token request to check for authentication.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        return true;
    } catch (error) {
        console.error("Gemini API key check failed:", error);
        return false;
    }
};


/**
 * Enhances a user's prompt using the Gemini API.
 * @returns An object containing the enhanced prompt and a boolean indicating failure.
 */
export const enhancePrompt = async (prompt: string, imageModelId: string, apiKey: string, stylePrompt?: string): Promise<{ enhancedPrompt: string; enhancementFailed: boolean; }> => {
    if (!prompt || !apiKey) {
        return { enhancedPrompt: prompt, enhancementFailed: true };
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = getSystemInstruction(imageModelId, stylePrompt);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                topP: 0.9,
                thinkingConfig: { thinkingBudget: 0 }, 
            },
        });

        const enhancedPrompt = response.text?.trim() ?? '';
        
        if (enhancedPrompt && enhancedPrompt.length > prompt.length + 5) {
            return { enhancedPrompt, enhancementFailed: false };
        }

        // If the prompt was not meaningfully enhanced, treat it as a failure for UI feedback.
        // This can happen if the model returns the same prompt or something very short.
        console.warn("Gemini enhancement was not significant. Using original prompt.");
        return { enhancedPrompt: prompt, enhancementFailed: true };

    } catch (error) {
        console.error("Error enhancing prompt with Gemini. Using original prompt:", error);
        // On error, gracefully fall back to the original prompt
        return { enhancedPrompt: prompt, enhancementFailed: true };
    }
};

/**
 * Translates a prompt to English if needed. Falls back to Google Translate.
 * @returns An object containing the translated text and a boolean indicating if fallback was used.
 */
export const translateToEnglishIfNeeded = async (prompt: string, apiKey: string): Promise<{ translatedText: string, usedFallback: boolean }> => {
    if (!prompt) {
        return { translatedText: '', usedFallback: false };
    }

    // --- Primary Method: Gemini API ---
    if (apiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            const systemInstruction = `You are a translation assistant. Your task is to translate the user-provided text to English. This text will be used as a prompt for an AI image generator, so it's crucial to preserve the core concepts, keywords, and artistic style descriptions. If the provided text is already in English, return the original text without any changes, additions, or explanations. Only output the final translated text and nothing else.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.1,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            });
            
            const translatedText = response.text?.trim() ?? '';
            
            if (translatedText) {
                return { translatedText, usedFallback: false };
            }
            
            console.warn("Gemini translation returned an empty response. Falling back to Google Translate.");
        } catch (error) {
            console.error("Error translating prompt with Gemini, falling back to Google Translate:", error);
        }
    }

    // --- Fallback Method: Google Translate Public API ---
    try {
        console.log("Attempting translation with Google Translate fallback...");
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(prompt)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Google Translate API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        const translatedText = data?.[0]?.[0]?.[0];

        if (typeof translatedText === 'string' && translatedText.trim()) {
            return { translatedText: translatedText.trim(), usedFallback: true };
        }

        console.warn("Google Translate fallback did not return valid text. Using original prompt.");
        return { translatedText: prompt, usedFallback: true };

    } catch (fallbackError) {
        console.error("Error with Google Translate fallback:", fallbackError);
        return { translatedText: prompt, usedFallback: true };
    }
};