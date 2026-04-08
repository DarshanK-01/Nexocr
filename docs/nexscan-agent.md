# NexScan AI Agent Documentation

## Overview

NexScan AI is an intelligent conversational agent that helps users interact with documents through natural language. It can extract data, translate content, analyze documents, and provide domain-specific insights.

## Features

### 1. Document Data Extraction
- Extract structured data from handwritten forms, receipts, invoices, and other documents
- OCR-powered text recognition
- Intelligent field detection

### 2. Multi-Language Translation
- Translate extracted data to any language
- Maintains data structure during translation
- Supports multiple languages including Marathi, Hindi, English, etc.

### 3. Domain-Adaptive Intelligence
The agent automatically detects document domains and provides context-aware analysis:

- **Finance**: Payments, dues, penalties, fraud risk, approvals
- **Legal**: Obligations, compliance, liability, deadlines
- **Medical**: Abnormal values, risk indicators, diagnosis meaning
- **Technical**: Failures, root causes, repair actions
- **HR**: Employee status, approvals, policy compliance
- **Logistics**: Shipment status, delays, delivery issues
- **Customer Support**: Complaints, escalation, dissatisfaction
- **General**: Neutral explanations

### 4. Priority Detection
- **RED**: Urgent risk, legal liability, patient risk, major financial impact
- **YELLOW**: Action required, pending approval, incomplete info
- **GREEN**: Informational record only

### 5. Conversational Interface
- Natural language understanding
- Context-aware responses
- Suggested actions for users
- Conversation history tracking

## Usage

### Web Interface

Navigate to `/chat` to access the conversational interface:

```
http://localhost:3000/chat
```

**Example interactions:**
- "Extract data from this document" (with uploaded image)
- "Translate this to Hindi"
- "Analyze this document and tell me what action is needed"
- "What does the complaint number mean?"

### API Endpoint

**POST** `/api/agent`

```json
{
  "message": "Extract data from this document",
  "documentImage": "data:image/jpeg;base64,...",
  "extractedData": { ... },
  "conversationHistory": [
    { "role": "user", "message": "Hello" },
    { "role": "agent", "message": "Hi! How can I help?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agentResponse": "I've successfully extracted data...",
    "actionTaken": "extract",
    "extractedData": { ... },
    "intelligence": { ... },
    "needsMoreInfo": false,
    "suggestedActions": ["Translate to another language", "Analyze document"]
  }
}
```

### Programmatic Usage

```typescript
import { chatWithAgent } from '@/app/actions';

const result = await chatWithAgent({
  userMessage: "Extract data from this document",
  documentImage: imageDataUri,
});

console.log(result.response?.agentResponse);
console.log(result.response?.extractedData);
```

## Agent Capabilities

### Extract
Extracts structured data from document images.

**Trigger phrases:**
- "Extract data from this document"
- "Scan this form"
- "Read this document"
- "What's in this image?"

### Translate
Translates extracted data to target language.

**Trigger phrases:**
- "Translate to Hindi"
- "Convert this to Marathi"
- "Show me this in English"

### Analyze
Provides intelligent insights about the document.

**Trigger phrases:**
- "Analyze this document"
- "What should I do with this?"
- "Is this urgent?"
- "Explain this document"

### Answer
Answers questions about extracted data.

**Trigger phrases:**
- "What does complaint number mean?"
- "Explain the nature of defect field"
- "What is BCCD?"

### Clarify
Asks for more information when needed.

**Automatic when:**
- User request is ambiguous
- Required data is missing
- Multiple interpretations possible

## Architecture

```
User Input
    ↓
NexScan Agent (Intent Detection)
    ↓
Action Router
    ├── Extract Flow → OCR + LLM Extraction
    ├── Translate Flow → Multi-language Translation
    ├── Analyze Flow → Domain Detection + Intelligence
    └── Answer Flow → Context-aware Q&A
    ↓
Formatted Response
    ↓
User
```

## Files Structure

```
src/
├── ai/
│   ├── flows/
│   │   ├── nexscan-agent.ts              # Main agent orchestrator
│   │   ├── extract-data-from-handwritten-form.ts
│   │   ├── translate-extracted-text.ts
│   │   └── analyze-document-intelligence.ts
│   └── schemas/
│       └── form-extraction-schemas.ts
├── app/
│   ├── actions.ts                        # Server actions
│   ├── chat/
│   │   └── page.tsx                      # Chat UI page
│   └── api/
│       └── agent/
│           └── route.ts                  # REST API endpoint
└── components/
    └── nexscan-chat.tsx                  # Chat interface component
```

## Configuration

The agent uses Genkit AI framework. Ensure your `.env` file contains:

```env
GOOGLE_GENAI_API_KEY=your_api_key_here
```

## Best Practices

1. **Upload Clear Images**: Better image quality = better extraction accuracy
2. **Be Specific**: Clear requests get better responses
3. **Use Suggested Actions**: The agent provides helpful next steps
4. **Provide Context**: Mention document type for better analysis
5. **Ask Follow-up Questions**: The agent maintains conversation context

## Examples

### Example 1: Extract and Analyze
```
User: "I have a complaint form, can you help?"
Agent: "Of course! Please upload the complaint form image."
User: [uploads image]
Agent: "I've extracted the data. This is a TECHNICAL domain document 
       with YELLOW priority. Action required: Technician needs to 
       review the defect and provide repair estimate."
```

### Example 2: Multi-language Workflow
```
User: "Extract this form and translate to Marathi"
Agent: [extracts data]
Agent: "Data extracted! Now translating to Marathi..."
Agent: [shows translated data in Marathi]
```

### Example 3: Question Answering
```
User: "What does 'Nature of Defect' mean?"
Agent: "The 'Nature of Defect' field describes what's wrong with 
       the product. It helps technicians understand the problem 
       before they start repairs."
```

## Troubleshooting

**Agent doesn't understand request:**
- Rephrase your question more clearly
- Use suggested actions
- Break complex requests into steps

**Extraction accuracy issues:**
- Upload higher quality images
- Ensure good lighting
- Avoid blurry or rotated images

**Translation errors:**
- Verify source data is correct first
- Specify target language clearly

## Future Enhancements

- Voice input support
- Batch document processing
- Custom domain training
- Integration with external systems
- Advanced analytics dashboard
- Multi-modal document support (PDF, Word, etc.)
