import type { PollinationsImageParams, GenerationResult } from '../types';

const API_BASE_URL = 'https://image.pollinations.ai';

/**
 * Fetches the list of available models from the Pollinations.ai API.
 * @returns A promise that resolves to an array of model ID strings.
 */
export const fetchModels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): Could not fetch models.`);
    }
    const models = await response.json();
    // Filter out specific models as requested
    const filteredModels = (models as string[]).filter(
        id => id !== 'kontext'
    );
    return filteredModels;
  } catch (error) {
    console.error("Failed to fetch models from Pollinations API:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while fetching models.");
  }
};


/**
 * Generates an image using the Pollinations.ai API.
 * @param params - An object containing the prompt and other generation parameters.
 * @returns A promise that resolves to an object containing the blob and original request URL.
 */
export const generateImage = async (params: PollinationsImageParams): Promise<GenerationResult> => {
  const { prompt, ...otherParams } = params;
  
  if (!prompt) {
    throw new Error('Prompt is required.');
  }

  const encodedPrompt = encodeURIComponent(prompt);
  const url = new URL(`${API_BASE_URL}/prompt/${encodedPrompt}`);
  
  // Append query parameters, ensuring boolean values are strings 'true'/'false'
  Object.entries(otherParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && !(typeof value === 'number' && isNaN(value))) {
       url.searchParams.append(key, String(value));
    }
  });

  const requestUrl = url.toString();

  try {
    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const blob = await response.blob();
    
    if (!blob.type.startsWith('image/')) {
        const textError = await blob.text();
        console.error("Pollinations API returned non-image data:", textError);
        throw new Error(`API returned an invalid response. Check the console for details.`);
    }

    return { blob, requestUrl };
    
  } catch (error) {
    console.error("Failed to generate image with Pollinations API:", error);
    const errorToThrow = error instanceof Error ? error : new Error("An unknown error occurred during image generation.");
    // Attach the URL to the error object before throwing.
    (errorToThrow as any).requestUrl = requestUrl;
    throw errorToThrow;
  }
};