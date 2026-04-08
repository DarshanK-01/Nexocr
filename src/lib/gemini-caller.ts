/**
 * Gemini Caller — direct REST API calls with key rotation,
 * exponential backoff, and failure tracking via keyManager.
 */

import { keyManager } from './gemini-key-manager';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash';

/**
 * Call Gemini with automatic key rotation and retry on rate-limit errors.
 * Accepts a text prompt and an optional base64 image data URI.
 */
export async function callGeminiWithFallback(
  prompt: string,
  fileBase64?: string,
  mimeType: string = 'image/jpeg',
  maxRetries = 4
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = keyManager.getNextKey();

    try {
      const parts: object[] = [{ text: prompt }];

      if (fileBase64) {
        const base64Data = fileBase64.includes(',')
          ? fileBase64.split(',')[1]
          : fileBase64;

        // PDFs and images both use inlineData — Gemini 2.5 Flash supports both natively
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }

      const res = await fetch(`${GEMINI_BASE_URL}/${MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
      });

      if (!res.ok) {
        const body = await res.text();
        const err = new Error(`Gemini ${res.status}: ${body}`);
        (err as any).status = res.status;
        throw err;
      }

      const json = await res.json();
      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      keyManager.markSuccess(apiKey);
      return text;

    } catch (err: any) {
      lastError = err;
      keyManager.markFailure(apiKey);

      const isRetryable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.message?.includes('429') ||
        err?.message?.includes('503') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('quota');

      console.warn(
        `[GeminiCaller] Attempt ${attempt + 1}/${maxRetries} failed: ${err?.message}`
      );

      if (!isRetryable) break;

      // Backoff: 2s, 4s, 6s, 8s — gives 503 overload time to recover
      await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
    }
  }

  throw lastError ?? new Error('All Gemini API attempts failed');
}
