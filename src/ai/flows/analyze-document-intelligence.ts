'use server';

/**
 * @fileOverview NexScan AI — Domain Adaptive Document Intelligence Agent
 * 
 * This flow analyzes extracted document data and provides domain-aware insights,
 * priority detection, and actionable recommendations for non-technical staff.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DocumentIntelligenceInputSchema = z.object({
  structuredData: z.record(z.string()).describe('Structured extracted data (field-value pairs)'),
  rawOcrText: z.string().optional().describe('Raw OCR text from the document'),
});

export type DocumentIntelligenceInput = z.infer<typeof DocumentIntelligenceInputSchema>;

const DocumentIntelligenceOutputSchema = z.object({
  domain: z.enum(['finance', 'legal', 'medical', 'technical', 'hr', 'logistics', 'customer_support', 'general'])
    .describe('Detected primary domain of the document'),
  summary: z.string().describe('3-5 sentence explanation in simple language'),
  priority: z.object({
    level: z.enum(['RED', 'YELLOW', 'GREEN']).describe('Priority level'),
    reason: z.string().describe('Short reason for priority assignment'),
  }),
  category: z.string().describe('Document category (same as domain)'),
  tags: z.array(z.string()).describe('5-10 searchable tags in lowercase snake_case'),
  field_explanations: z.record(z.string()).describe('Simple explanations of important fields'),
});

export type DocumentIntelligenceOutput = z.infer<typeof DocumentIntelligenceOutputSchema>;

export async function analyzeDocumentIntelligence(
  input: DocumentIntelligenceInput
): Promise<DocumentIntelligenceOutput> {
  return analyzeDocumentIntelligenceFlow(input);
}

const analyzeDocumentIntelligencePrompt = ai.definePrompt({
  name: 'analyzeDocumentIntelligencePrompt',
  input: { schema: DocumentIntelligenceInputSchema },
  output: { schema: DocumentIntelligenceOutputSchema },
  prompt: `You are NexScan AI — Domain Adaptive Document Intelligence Agent.
You help non-technical employees understand uploaded documents and decide what action is required.

You will receive:
- Structured extracted data (field-value pairs)
- Raw OCR text (if available)

STEP 1 — DOMAIN DETECTION
Identify the primary domain:
- finance
- legal
- medical
- technical
- hr
- logistics
- customer_support
- general

Use both structured fields and raw text.

STEP 2 — DOMAIN-AWARE ANALYSIS RULES
Apply the correct interpretation style:

FINANCE: Focus on payments, dues, penalties, fraud risk, approvals, totals, dates
LEGAL: Focus on obligations, compliance, liability, deadlines, agreements
MEDICAL: Focus on abnormal values, risk indicators, diagnosis meaning, urgency to patient
TECHNICAL: Focus on failures, root causes, malfunction, repair actions
HR: Focus on employee status, approvals, policy compliance
LOGISTICS: Focus on shipment status, delays, delivery issues, damage
CUSTOMER_SUPPORT: Focus on complaints, escalation tone, dissatisfaction
GENERAL: Provide neutral explanation

STEP 3 — SUMMARY
Write a short explanation (3–5 sentences):
• What the document represents
• Key important information
• What action is expected

Use simple language for non-technical staff.

STEP 4 — PRIORITY DETECTION
Assign exactly ONE:
- RED → urgent risk, legal liability, patient risk, major financial impact, severe complaint
- YELLOW → action required, pending approval, incomplete info
- GREEN → informational record only

Provide one short reason.
Priority must be decided using domain context.

STEP 5 — CATEGORY
Return the detected domain as category.

STEP 6 — TAG GENERATION
Generate 5–10 searchable tags. Use lowercase snake_case.

STEP 7 — FIELD EXPLANATIONS
Explain important fields in simple language.
Rules:
• For medical → explain health meaning
• For finance → explain money impact
• For legal → explain responsibility
• For technical → explain operational meaning

Max 2 sentences each. Avoid jargon. Expand abbreviations.

---

Structured Data:
{{{json structuredData}}}

{{#if rawOcrText}}
Raw OCR Text:
{{{rawOcrText}}}
{{/if}}

Analyze this document and provide your response.`,
});

const analyzeDocumentIntelligenceFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentIntelligenceFlow',
    inputSchema: DocumentIntelligenceInputSchema,
    outputSchema: DocumentIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeDocumentIntelligencePrompt(input);
    return output!;
  }
);
