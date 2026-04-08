# NexScan AI Agent - Complete Setup Guide

## 🎯 What is NexScan AI Agent?

NexScan AI is an intelligent conversational bot that helps users interact with documents through natural language. It can:

✅ Extract data from handwritten forms and documents  
✅ Translate extracted data to multiple languages  
✅ Analyze documents with domain-specific intelligence  
✅ Detect priority levels (RED/YELLOW/GREEN)  
✅ Answer questions about documents  
✅ Provide actionable recommendations  

## 🚀 Quick Start

### 1. Files Created

```
src/
├── ai/flows/
│   ├── nexscan-agent.ts                    # Main AI agent orchestrator
│   └── analyze-document-intelligence.ts    # Domain-adaptive analysis
├── app/
│   ├── actions.ts                          # Updated with agent actions
│   ├── chat/page.tsx                       # Chat interface page
│   └── api/agent/route.ts                  # REST API endpoint
├── components/
│   └── nexscan-chat.tsx                    # Chat UI component
docs/
├── nexscan-agent.md                        # Full documentation
├── agent-integration-examples.md           # Code examples
└── AGENT_SETUP.md                          # This file
```

### 2. Run the Project

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### 3. Access the Agent

**Web Interface:**
```
http://localhost:3000/chat
```

**API Endpoint:**
```
http://localhost:3000/api/agent
```

## 💬 How to Use

### Web Chat Interface

1. Navigate to `/chat`
2. Type a message or upload a document
3. The agent will respond and suggest next actions

**Example conversations:**

```
You: "Hello"
Agent: "Hi! I'm NexScan AI. I can help you extract data from documents..."

You: [uploads document image]
Agent: "I've extracted the data! Here's what I found..."

You: "Translate to Hindi"
Agent: [shows translated data]

You: "Is this urgent?"
Agent: "This is a YELLOW priority document. Action required..."
```

### API Usage

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Extract data from this document",
    "documentImage": "data:image/jpeg;base64,..."
  }'
```

### Programmatic Usage

```typescript
import { chatWithAgent } from '@/app/actions';

const result = await chatWithAgent({
  userMessage: "Extract and analyze this document",
  documentImage: imageDataUri,
});

console.log(result.response?.agentResponse);
```

## 🎨 Features

### 1. Automatic Intent Detection

The agent understands what you want to do:

- "Extract data" → Triggers extraction flow
- "Translate to Hindi" → Triggers translation flow
- "Is this urgent?" → Triggers analysis flow
- "What does this field mean?" → Answers questions

### 2. Domain-Adaptive Intelligence

Automatically detects document type and provides relevant insights:

- **Finance**: Payment analysis, fraud detection
- **Legal**: Compliance, liability assessment
- **Medical**: Health risk indicators
- **Technical**: Failure analysis, repair actions
- **HR**: Policy compliance, approvals
- **Logistics**: Delivery status, delays
- **Customer Support**: Complaint severity
- **General**: Neutral explanations

### 3. Priority Detection

- 🔴 **RED**: Urgent action required
- 🟡 **YELLOW**: Action needed soon
- 🟢 **GREEN**: Informational only

### 4. Suggested Actions

The agent provides clickable suggestions for next steps:
- "Translate to another language"
- "Analyze document"
- "Ask questions"

### 5. Conversation Memory

The agent remembers context within a conversation:

```
You: "Extract this document"
Agent: [extracts data]
You: "Now translate it to Marathi"
Agent: [translates the previously extracted data]
```

## 🔧 Configuration

Ensure your `.env` file has:

```env
GOOGLE_GENAI_API_KEY=your_api_key_here
```

## 📊 Agent Capabilities

| Capability | Description | Trigger Examples |
|------------|-------------|------------------|
| **Extract** | Extract data from documents | "Extract data", "Scan this form" |
| **Translate** | Translate to any language | "Translate to Hindi", "Convert to Marathi" |
| **Analyze** | Provide intelligent insights | "Analyze this", "Is this urgent?" |
| **Answer** | Answer questions | "What does this mean?", "Explain this field" |
| **Clarify** | Ask for more info | Automatic when needed |

## 🎯 Use Cases

### 1. Customer Service
```
Customer uploads complaint form
→ Agent extracts data
→ Analyzes priority
→ Routes to appropriate team
```

### 2. Document Processing
```
Employee uploads invoice
→ Agent extracts amounts
→ Detects payment due date
→ Flags if urgent
```

### 3. Multi-language Support
```
User uploads Hindi document
→ Agent extracts data
→ Translates to English
→ Provides analysis
```

### 4. Quality Control
```
Technician uploads defect report
→ Agent extracts details
→ Categorizes severity
→ Suggests next steps
```

## 🔌 Integration Options

### Option 1: Embed Chat Component

```tsx
import { NexScanChat } from '@/components/nexscan-chat';

export default function MyPage() {
  return <NexScanChat />;
}
```

### Option 2: Use Server Actions

```typescript
import { chatWithAgent } from '@/app/actions';

const result = await chatWithAgent({
  userMessage: "Your message",
  documentImage: imageDataUri,
});
```

### Option 3: REST API

```javascript
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Extract data",
    documentImage: imageDataUri,
  }),
});
```

## 📚 Documentation

- **Full Documentation**: `docs/nexscan-agent.md`
- **Integration Examples**: `docs/agent-integration-examples.md`
- **API Reference**: Visit `/api/agent` for health check

## 🐛 Troubleshooting

**Agent doesn't understand:**
- Be more specific in your request
- Use suggested actions
- Break complex requests into steps

**Extraction issues:**
- Upload clear, well-lit images
- Avoid blurry or rotated images
- Ensure text is readable

**Translation errors:**
- Verify extracted data first
- Specify target language clearly

## 🚀 Next Steps

1. **Test the chat interface**: Go to `/chat` and try it out
2. **Upload a document**: Test extraction with a real document
3. **Try different languages**: Test translation capabilities
4. **Integrate into your app**: Use the provided examples
5. **Customize**: Modify prompts and flows as needed

## 💡 Tips

- Upload clear images for best extraction results
- Use natural language - the agent understands context
- Click suggested actions for quick workflows
- Ask follow-up questions - the agent remembers context
- Check priority levels for urgent documents

## 🎉 You're Ready!

The NexScan AI Agent is now fully set up and ready to use. Start by visiting:

```
http://localhost:3000/chat
```

Happy document processing! 🚀
