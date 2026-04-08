'use server';

import { extractData, extractDataWithFallback, detectDocumentType } from '@/ai/flows/extract-data-from-handwritten-form';
import { translateData } from '@/ai/flows/translate-extracted-text';
import { analyzeDocumentIntelligence, type DocumentIntelligenceInput, type DocumentIntelligenceOutput } from '@/ai/flows/analyze-document-intelligence';
import type { ExtractDataInput, ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type FormState = {
  data: ExtractDataOutput | Record<string, any> | null;
  error: string | null;
  usedFallback?: boolean;
};

export type IntelligenceState = {
  intelligence: DocumentIntelligenceOutput | null;
  error: string | null;
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getMimeTypeFromDataUri(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

// ─────────────────────────────────────────────
// EXTRACTION — detect type, route to correct extractor
// ─────────────────────────────────────────────

export async function extractDataFromImage(
  extractionInput: ExtractDataInput,
): Promise<FormState> {
  if (!extractionInput.photoDataUri) {
    return { data: null, error: 'No image data provided.' };
  }

  const mimeType = getMimeTypeFromDataUri(extractionInput.photoDataUri);

  // PDFs skip Genkit entirely — Genkit's Handlebars prompt doesn't support PDF input
  if (mimeType === 'application/pdf') {
    try {
      const fallbackData = await extractDataWithFallback(extractionInput.photoDataUri, mimeType);
      return { data: fallbackData, error: null, usedFallback: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'PDF extraction failed.';
      return { data: null, error: errorMessage };
    }
  }

  // STEP 1: Detect document type for images
  let documentType = 'OTHER';
  try {
    documentType = await detectDocumentType(extractionInput.photoDataUri, mimeType);
  } catch (e) {
    console.warn('[actions] Document type detection failed, defaulting to OTHER:', e);
  }

  // STEP 2: Route to Genkit only for Bajaj forms
  if (documentType === 'BAJAJ_COMPLAINT_FORM') {
    try {
      const extractedData = await extractData(extractionInput);
      return { data: extractedData, error: null, usedFallback: false };
    } catch (genkitError) {
      console.warn('[actions] Genkit failed for Bajaj form, trying fallback:', genkitError);
    }
  }

  // STEP 3: Dynamic extraction for all other document types
  try {
    const fallbackData = await extractDataWithFallback(extractionInput.photoDataUri, mimeType);
    return { data: fallbackData, error: null, usedFallback: true };
  } catch (fallbackError) {
    console.error('[actions] Dynamic extraction failed:', fallbackError);
    const errorMessage = fallbackError instanceof Error
      ? fallbackError.message
      : 'Extraction failed on all attempts.';
    return { data: null, error: errorMessage };
  }
}

// ─────────────────────────────────────────────
// TRANSLATION
// ─────────────────────────────────────────────

export async function translateExtractedData(
  data: ExtractDataOutput,
  targetLanguage: string
): Promise<FormState> {
  if (!data) {
    return { data: null, error: 'No data provided for translation.' };
  }

  try {
    const translatedData = await translateData({ data, targetLanguage });
    return { data: translatedData, error: null };
  } catch (e) {
    console.error('Error translating data:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during translation.';
    return { data: null, error: errorMessage };
  }
}

// ─────────────────────────────────────────────
// DOCUMENT INTELLIGENCE
// ─────────────────────────────────────────────

export async function analyzeDocument(
  input: DocumentIntelligenceInput
): Promise<IntelligenceState> {
  if (!input.structuredData) {
    return { intelligence: null, error: 'No structured data provided.' };
  }

  try {
    const intelligence = await analyzeDocumentIntelligence(input);
    return { intelligence, error: null };
  } catch (e) {
    console.error('Error analyzing document:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis.';
    return { intelligence: null, error: errorMessage };
  }
}
