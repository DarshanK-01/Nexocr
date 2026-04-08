'use server';

/**
 * @fileOverview NexScan AI Agent - Conversational Document Intelligence Bot
 * 
 * This agent handles user requests conversationally and performs document operations:
 * - Extract data from documents
 * - Translate extracted data
 * - Analyze and provide intelligent insights
 * - Answer questions about documents
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { extractData } from './extract-data-from-handwritten-form';
import { translateData } from './translate-extracted-text';
import { analyzeDocumentIntelligence } from './analyze-document-intelligence';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

const NexScanAgentInputSchema = z.object({
  userMessage: z.string().describe('The user request or question'),
  documentImage: z.string().optional().describe('Document image as data URI (if provided)'),
  extractedData: z.record(z.string()).optional().describe('Previously extracted data (if available)'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    message: z.string(),
  })).optional().describe('Previous conversation messages'),
});

export type NexScanAgentInput = z.infer<typeof NexScanAgentInputSchema>;

const AgentActionSchema = z.object({
  action: z.enum(['extract', 'translate', 'analyze', 'answer', 'clarify'])
    .describe('The action the agent should take'),
  parameters: z.record(z.any()).optional().describe('Parameters for the action'),
  response: z.string().describe('Natural language response to the user'),
});

const NexScanAgentOutputSchema = z.object({
  agentResponse: z.string().describe('Natural language response to user'),
  actionTaken: z.string().describe('Description of action performed'),
  extractedData: z.record(z.string()).optional().describe('Extracted document data'),
  translatedData: z.record(z.string()).optional().describe('Translated data'),
  intelligence: z.object({
    domain: z.string(),
    summary: z.string(),
    priority: z.object({
      level: z.string(),
      reason: z.string(),
    }),
    tags: z.array(z.string()),
    field_explanations: z.record(z.string()),
  }).optional().describe('Document intelligence analysis'),
  needsMoreInfo: z.boolean().describe('Whether agent needs more information'),
  suggestedActions: z.array(z.string()).optional().describe('Suggested next actions for user'),
});

export type NexScanAgentOutput = z.infer<typeof NexScanAgentOutputSchema>;

export async function chatWithNexScanAgent(
  input: NexScanAgentInput
): Promise<NexScanAgentOutput> {
  return nexScanAgentFlow(input);
}

const nexScanAgentPrompt = ai.definePrompt({
  name: 'nexScanAgentPrompt',
  input: { schema: NexScanAgentInputSchema },
  output: { schema: AgentActionSchema },
  prompt: `You are NexScan AI Agent, a helpful document intelligence assistant.

Your capabilities:
1. EXTRACT - Extract data from document images (handwritten forms, receipts, invoices, etc.)
2. TRANSLATE - Translate extracted data to different languages
3. ANALYZE - Provide intelligent insights about documents (domain detection, priority, explanations)
4. ANSWER - Answer questions about documents and extracted data
5. CLARIFY - Ask for clarification when needed

User Message: {{{userMessage}}}

{{#if documentImage}}
Document Image: Available
{{/if}}

{{#if extractedData}}
Previously Extracted Data:
{{{json extractedData}}}
{{/if}}

{{#if conversationHistory}}
Conversation History:
{{#each conversationHistory}}
{{role}}: {{message}}
{{/each}}
{{/if}}

Analyze the user's request and determine:
1. What action should be taken (extract/translate/analyze/answer/clarify)
2. What parameters are needed
3. How to respond naturally to the user

If the user wants to:
- Upload/scan/extract from a document → action: "extract"
- Translate to another language → action: "translate" (needs targetLanguage parameter)
- Understand/analyze/get insights → action: "analyze"
- Ask questions about data → action: "answer"
- Request is unclear → action: "clarify"

Respond in a friendly, helpful manner.`,
});

const nexScanAgentFlow = ai.defineFlow(
  {
    name: 'nexScanAgentFlow',
    inputSchema: NexScanAgentInputSchema,
    outputSchema: NexScanAgentOutputSchema,
  },
  async (input) => {
    // Step 1: Understand user intent
    const { output: agentAction } = await nexScanAgentPrompt(input);
    
    if (!agentAction) {
      return {
        agentResponse: "I'm sorry, I couldn't understand your request. Could you please rephrase?",
        actionTaken: 'none',
        needsMoreInfo: true,
      };
    }

    let result: NexScanAgentOutput = {
      agentResponse: agentAction.response,
      actionTaken: agentAction.action,
      needsMoreInfo: false,
    };

    // Step 2: Execute the appropriate action
    try {
      switch (agentAction.action) {
        case 'extract':
          if (!input.documentImage) {
            result.needsMoreInfo = true;
            result.agentResponse = "I'd be happy to extract data from your document! Please upload an image of the document you'd like me to analyze.";
            result.suggestedActions = ['Upload document image'];
          } else {
            const extracted = await extractData({ 
              photoDataUri: input.documentImage,
            });
            result.extractedData = extracted as Record<string, string>;
            result.agentResponse = `I've successfully extracted data from your document! Here's what I found:\n\n${formatExtractedData(extracted)}\n\nWould you like me to translate this to another language or analyze it for insights?`;
            result.suggestedActions = ['Translate to another language', 'Analyze document', 'Ask questions'];
          }
          break;

        case 'translate':
          if (!input.extractedData) {
            result.needsMoreInfo = true;
            result.agentResponse = "I need extracted data to translate. Please extract data from a document first.";
            result.suggestedActions = ['Extract data from document'];
          } else {
            const targetLanguage = agentAction.parameters?.targetLanguage || 'English';
            const translated = await translateData({
              data: input.extractedData as ExtractDataOutput,
              targetLanguage,
            });
            result.translatedData = translated as Record<string, string>;
            result.agentResponse = `I've translated the data to ${targetLanguage}:\n\n${formatExtractedData(translated)}`;
            result.suggestedActions = ['Analyze document', 'Translate to another language'];
          }
          break;

        case 'analyze':
          if (!input.extractedData) {
            result.needsMoreInfo = true;
            result.agentResponse = "I need extracted data to analyze. Please extract data from a document first.";
            result.suggestedActions = ['Extract data from document'];
          } else {
            const intelligence = await analyzeDocumentIntelligence({
              structuredData: input.extractedData,
            });
            result.intelligence = intelligence;
            result.agentResponse = formatIntelligenceReport(intelligence);
            result.suggestedActions = ['Ask questions', 'Translate data', 'Extract another document'];
          }
          break;

        case 'answer':
          // Answer questions based on available data
          result.agentResponse = agentAction.response;
          if (input.extractedData) {
            result.suggestedActions = ['Analyze document', 'Translate data', 'Ask another question'];
          }
          break;

        case 'clarify':
          result.needsMoreInfo = true;
          result.agentResponse = agentAction.response;
          break;
      }
    } catch (error) {
      result.agentResponse = `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
      result.actionTaken = 'error';
    }

    return result;
  }
);

// Helper function to format extracted data
function formatExtractedData(data: Record<string, any>): string {
  return Object.entries(data)
    .filter(([_, value]) => value)
    .map(([key, value]) => `• ${formatFieldName(key)}: ${value}`)
    .join('\n');
}

// Helper function to format field names
function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Helper function to format intelligence report
function formatIntelligenceReport(intelligence: any): string {
  const priorityEmoji = {
    RED: '🔴',
    YELLOW: '🟡',
    GREEN: '🟢',
  }[intelligence.priority.level] || '⚪';

  return `📊 Document Analysis Complete!

${priorityEmoji} Priority: ${intelligence.priority.level}
Reason: ${intelligence.priority.reason}

📁 Domain: ${intelligence.domain.toUpperCase()}
📝 Category: ${intelligence.category}

Summary:
${intelligence.summary}

🏷️ Tags: ${intelligence.tags.join(', ')}

${Object.keys(intelligence.field_explanations).length > 0 ? `
📖 Field Explanations:
${Object.entries(intelligence.field_explanations)
  .map(([field, explanation]) => `• ${formatFieldName(field)}: ${explanation}`)
  .join('\n')}
` : ''}`;
}
