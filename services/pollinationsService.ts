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
    return models as string[];
  } catch (error) {
    console.error("Failed to fetch models from Pollinations API:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while fetching models.");
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates an image using the Pollinations.ai API, with retry logic for server errors.
 * @param params - An object containing the prompt and other generation parameters.
 * @param signal - An AbortSignal to allow for cancelling the request.
 * @param onRetry - A callback function invoked when a retry attempt is about to be made.
 * @returns A promise that resolves to an object containing the blob and original request URL.
 */
export const generateImage = async (
  params: PollinationsImageParams,
  signal: AbortSignal,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<GenerationResult> => {
  const { prompt, ...otherParams } = params;
  
  if (!prompt) {
    throw new Error('Prompt is required.');
  }

  const encodedPrompt = encodeURIComponent(prompt);
  const url = new URL(`${API_BASE_URL}/prompt/${encodedPrompt}`);
  
  Object.entries(otherParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !(typeof value === 'number' && isNaN(value))) {
       const paramValue = Array.isArray(value) ? value.join(',') : String(value);
       if (paramValue) {
         url.searchParams.append(key, paramValue);
       }
    }
  });
  
  url.searchParams.append('referrer', 'pollinations-ai-demo');

  const requestUrl = url.toString();

  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 5000; // 5 seconds
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(requestUrl, { signal });
      
      if (response.ok) {
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            const textError = await blob.text();
            console.error("Pollinations API returned non-image data:", textError);
            throw new Error(`API returned an invalid response. Check the console for details.`);
        }
        return { blob, requestUrl }; // Success!
      }

      // If not OK, prepare to retry for server errors
      if (response.status >= 500) {
        const errorText = await response.text().catch(() => response.statusText);
        lastError = new Error(`API Error (${response.status}): ${errorText}`);
        console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed with server error: ${response.status}. Retrying...`);
      } else {
        // It's a client error (4xx) or other non-retriable error, so don't retry.
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
       if (lastError.name === 'AbortError') {
        // If the request was aborted, don't retry. Immediately re-throw the error.
        throw lastError;
      }
      console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed with a network or fetch error. Retrying...`, error);
    }

    // If we haven't returned or thrown a fatal error yet, wait before the next attempt
    if (attempt < MAX_RETRIES) {
      onRetry?.(attempt + 1, MAX_RETRIES);
      await sleep(INITIAL_DELAY_MS * attempt); // Wait 5s, 10s
    }
  }

  // If all retries fail, throw the last captured error
  console.error(`All ${MAX_RETRIES} attempts to fetch the image failed.`);
  if (lastError) {
    (lastError as any).requestUrl = requestUrl;
    throw lastError;
  }
  
  // Fallback error, should not be reached if lastError is always set.
  const fallbackError = new Error(`Failed to generate image after ${MAX_RETRIES} attempts.`);
  (fallbackError as any).requestUrl = requestUrl;
  throw fallbackError;
};