
import { GoogleGenAI } from "@google/genai";

const getSystemInstruction = (imageModelId: string, stylePrompt?: string): string => {
    // Base instruction
    let instruction = `You are an expert at writing creative, detailed, and artistic prompts for AI image generators. A user will provide a simple idea. Your task is to expand it into a single, optimized prompt for a specific AI model. Do not add any extra text, explanations, or markdown. Only return the final prompt text. The final prompt should be a reasonable length, not excessively long.`;
    
    // Model-specific instructions
    if (imageModelId.toLowerCase().includes('flux')) {
        instruction += `\n\n**Target Model: Flux.** This model excels with highly descriptive, narrative-style prompts written in natural language.
- **DO:** Write a single, cohesive paragraph of about 2-4 sentences.
- **DO:** Focus on scene composition, lighting, mood, atmosphere, and fine details.
- **DO NOT:** Make the prompt excessively long.
- **DO NOT:** Use comma-separated lists of keywords.
- **Example:** Instead of "lion, crown, city, futuristic", write "A majestic lion with a crown of shimmering light sits enthroned amidst the towering, neon-lit skyscrapers of a futuristic metropolis, its gaze filled with ancient wisdom."`;
    } else if (imageModelId.toLowerCase().includes('turbo')) {
        instruction += `\n\n**Target Model: Turbo.** This model works best with a concise, impactful mix of descriptive phrases and specific keywords, separated by commas, similar to Stable Diffusion prompts.
- **DO:** Use a comma-separated list of keywords and short descriptive phrases.
- **DO:** Focus on key elements, style, and quality tags.
- **DO NOT:** Write long narrative paragraphs.
- **Example:** "majestic lion, glowing crown, futuristic city, neon lights, towering skyscrapers, highly detailed, cinematic lighting, 4k".`;
    } else {
        instruction += `\n\n**Target Model: General.** The prompt should be a well-suited, descriptive paragraph for a modern, general-purpose AI image generator.`;
    }

    // Style integration instruction
    if (stylePrompt) {
        instruction += `\n\n**Crucial Style Constraint:** The user has selected a specific artistic style. It is absolutely critical that you preserve this style with high fidelity. Integrate the following style description and keywords verbatim into your enhanced prompt: "${stylePrompt}". This style is the most important part of the request and must not be altered, rephrased, or diluted.`;
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
