// src/ai/flows/extract-data-from-handwritten-form.ts
'use server';

/**
 * @fileOverview Genkit flow + fallback for extracting data from any form (handwritten or printed).
 * - Primary: Genkit flow with fixed schema (complaint forms)
 * - Fallback: Direct Gemini API call with dynamic field extraction (any document type)
 */

import { ai } from '@/ai/genkit';
import { callGeminiWithFallback } from '@/lib/gemini-caller';
import {
  ExtractDataInputSchema,
  ExtractDataOutputSchema,
  type ExtractDataInput,
  type ExtractDataOutput,
} from '@/ai/schemas/form-extraction-schemas';

// ─────────────────────────────────────────────
// PRIMARY: Genkit Flow (fixed schema — complaint form)
// ─────────────────────────────────────────────

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: ExtractDataInputSchema },
  output: { schema: ExtractDataOutputSchema },
  prompt: `You are NexScan, an expert OCR and data extraction system specializing in handwritten and printed forms.

DOCUMENT CONTEXT:
{{#if sparePartCode}}
The user has pre-selected the following — use as high-confidence context:
- Spare Part Code: {{{sparePartCode}}}
- Product Description: {{{productDescription}}}
{{/if}}

IMAGE: {{media url=photoDataUri}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTRACTION RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LANGUAGE: Handle English and Hindi (Devanagari) mixed text. Transliterate Hindi field values into English.

2. AMBIGUOUS CHARACTERS — resolve using context:
   - 0 vs O: numeric context → 0, alphabetic → O
   - 1 vs l vs I: numeric → 1, word → l or I
   - 5 vs S: numeric → 5, alphabetic → S
   - 8 vs B: numeric → 8, alphabetic → B

3. CORRECTIONS: If text is crossed out or overwritten, extract the FINAL written value only.

4. CHECKBOXES: Detect which option is checked/ticked/circled. Return the selected option label.
   Example: "☑ Male  ☐ Female" → "Male"

5. IMAGE QUALITY: Handle low contrast, slight rotation, partial crops, stamps, and watermarks.
   Do your best — never skip a field because of image quality.

6. UNCLEAR TEXT: If a value is genuinely unreadable after best effort, append "[unclear]" to your best guess.

7. DATES: Normalize all dates to DD/MM/YYYY format.

8. STAMPS / SIGNATURES / MARGIN NOTES: Capture any stamps, seals, signatures, or margin annotations in the "others" field.

9. EMPTY FIELDS: If a field is truly blank in the document, return an empty string — do not invent values.

10. OUTPUT: Return valid JSON matching the schema exactly. Never return empty or malformed output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELDS TO EXTRACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- branch: Branch name or office location
- bccdName: BCCD / customer / complainant name
- productDescription: Product name or description
- sparePartCode: Spare part code or part number
- productSrNo: Product serial number
- dateOfPurchase: Date of purchase (DD/MM/YYYY)
- complaintNo: Complaint number or reference ID
- natureOfDefect: Description of the defect or issue
- technicianName: Technician or engineer name
- others: Stamps, signatures, margin notes, or any text not fitting above fields
`,
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    const { output } = await extractDataPrompt(input);

    if (input.sparePartCode && output) {
      output.sparePartCode = input.sparePartCode;
      output.productDescription = input.productDescription;
    }

    return output!;
  }
);

// ─────────────────────────────────────────────
// DOCUMENT TYPE DETECTION
// ─────────────────────────────────────────────

export async function detectDocumentType(fileDataUri: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const prompt = `Look at this document image and classify it in 3 words or less.
Reply with ONLY one of these exact labels, nothing else:
- "BAJAJ_COMPLAINT_FORM" → if it is a Bajaj service/complaint/warranty/defective spare part form
- "OTHER" → if it is anything else (cheque, KYC, invoice, medical, bank slip, math sheet, exam paper, etc.)
Return only the label. No explanation. No punctuation.`;
  const result = await callGeminiWithFallback(prompt, fileDataUri, mimeType);
  return result.trim().toUpperCase();
}

// ─────────────────────────────────────────────
// FALLBACK: Universal extraction — no fixed schema, mirrors the actual document
// ─────────────────────────────────────────────

export async function extractDataWithFallback(fileDataUri: string, mimeType: string = 'image/jpeg'): Promise<Record<string, any>> {
  const prompt = `You are NexScan, an expert document intelligence system that extracts structured data from any document type.

STEP 1 — READ THE DOCUMENT:
Scan every part of this document completely:
- All printed and handwritten text
- Field labels and their corresponding values
- Headers, footers, stamps, watermarks, margin notes
- Tables with all rows and columns
- Checkboxes (identify which are checked/unchecked)
- Signatures (note their presence and location)
- Dates, numbers, codes, names — everything visible
- Mathematical expressions, equations, and formulas — capture them exactly

STEP 2 — EXTRACT ALL FIELDS:
Create a key-value pair for every field you find.
Rules:
- Use the EXACT label text from the document as the JSON key
  (clean it up slightly: trim whitespace, remove trailing colons)
- Use the written/printed value as the JSON value
- For handwritten text: resolve ambiguous characters using context
  (0 vs O, 1 vs l, 5 vs S, rn vs m, etc.)
- For Hindi/regional language labels: keep original script OR transliterate,
  whichever is more readable — be consistent throughout
- For mixed Hindi+English documents: handle both naturally
- For checkboxes: value should be the selected option name
- For crossed-out/corrected text: use the final corrected value only
- For multi-line values (addresses, descriptions): join with ", "
- For dates: normalize to DD/MM/YYYY format
- For unclear text: append "[unclear]" to your best guess
- For partially visible text: append "[partial]" to what you can read
- Empty fields in the document: use empty string "" as value

STEP 3 — HANDLE MATHEMATICAL CONTENT:
If the document contains equations, formulas, or mathematical expressions:
- Capture each equation or expression as a separate key-value pair
- Use a descriptive label as the key (e.g. "Equation 1", "Formula", "Area", "Quadratic Formula", or the label written next to it in the document)
- Represent the value in plain text math notation:
  - Use ^ for exponents: x^2, a^3
  - Use / for fractions: (a+b)/c
  - Use sqrt() for square roots: sqrt(x^2 + y^2)
  - Use * for multiplication: 2*pi*r
  - Use standard symbols as-is: +, -, =, ≠, ≤, ≥, ∑, ∫, π, θ, α, β, Δ
  - For complex fractions or multi-line expressions: write them linearly, e.g. (numerator)/(denominator)
  - Preserve the equation exactly as written — do not solve or simplify
- If the document is primarily a math sheet (exam, worksheet, notebook):
  - Group equations under keys like "Question 1", "Problem 2", "Step 1", etc.
  - Capture both the question/problem AND the written answer/working if present
  - Use "_equations" as a top-level array for all standalone equations without labels

STEP 4 — HANDLE TABLES:
If the document contains tabular data:
- Represent each table as an array of row objects under a descriptive key
- Use column headers as the nested keys
- Example: "Items": [{"Description": "...", "Qty": "...", "Amount": "..."}]

STEP 5 — CAPTURE METADATA:
Always include these metadata fields regardless of document type:
- "_documentType": your best classification of this document
  (e.g. "KYC Form", "Payment Slip", "Complaint Form", "Invoice", "Medical Prescription",
  "Math Worksheet", "Exam Paper", "Physics Notes", "Engineering Formula Sheet", etc.)
- "_language": all languages detected (e.g. "English", "Hindi", "English + Hindi")
- "_confidence": your overall extraction confidence
  "HIGH" = clear image, most text readable
  "MEDIUM" = some unclear areas but majority extracted
  "LOW" = poor image quality, significant guesswork involved
- "_signatures": "Yes - [location]" or "No"
- "_stamps": describe any stamps/seals visible, or "" if none

OUTPUT RULES — CRITICAL:
- Return ONLY a valid JSON object
- No markdown fences, no \`\`\`json, no explanation before or after
- All extracted document fields at the TOP LEVEL of the JSON
- Metadata fields (_documentType, _language, etc.) also at top level
- Never return null for any value — use "" for missing/empty
- The JSON structure will be DIFFERENT for every document type — that is correct
- Do not force any fixed schema — the shape mirrors the actual document`;

  async function attemptParse(rawResult: string): Promise<Record<string, any>> {
    const clean = rawResult.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  let raw = await callGeminiWithFallback(prompt, fileDataUri, mimeType);

  try {
    return await attemptParse(raw);
  } catch {
    raw = await callGeminiWithFallback(
      prompt + '\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY the raw JSON object. No text before it. No text after it. No markdown.',
      fileDataUri,
      mimeType
    );
    try {
      return await attemptParse(raw);
    } catch {
      throw new Error('Failed to parse extraction response after retry');
    }
  }
}
