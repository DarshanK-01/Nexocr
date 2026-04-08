# NexScan AI Agent - Quick Reference

## 🚀 Access Points

| Interface | URL | Purpose |
|-----------|-----|---------|
| Chat UI | `/chat` | Interactive chat interface |
| API Endpoint | `/api/agent` | REST API for integrations |
| Main App | `/` | Original form extraction UI |

## 💬 Common Commands

### Extraction
```
"Extract data from this document"
"Scan this form"
"Read this image"
"What's in this document?"
```

### Translation
```
"Translate to Hindi"
"Convert to Marathi"
"Show me this in English"
"Translate to [language]"
```

### Analysis
```
"Analyze this document"
"Is this urgent?"
"What should I do with this?"
"Explain this document"
"What's the priority?"
```

### Questions
```
"What does [field name] mean?"
"Explain the complaint number"
"What is BCCD?"
"Tell me about this field"
```

## 🎯 Agent Actions

| Action | When Used | Needs |
|--------|-----------|-------|
| **extract** | User wants to extract data | Document image |
| **translate** | User wants translation | Extracted data + target language |
| **analyze** | User wants insights | Extracted data |
| **answer** | User asks questions | Context from conversation |
| **clarify** | Request is unclear | More information from user |

## 🏷️ Document Domains

| Domain | Focus Areas | Priority Indicators |
|--------|-------------|---------------------|
| **finance** | Payments, dues, penalties, fraud | Overdue payments, large amounts |
| **legal** | Obligations, compliance, deadlines | Legal liability, contract breaches |
| **medical** | Abnormal values, risk indicators | Patient risk, urgent conditions |
| **technical** | Failures, malfunctions, repairs | System failures, safety issues |
| **hr** | Employee status, approvals | Policy violations, urgent approvals |
| **logistics** | Shipments, delays, damage | Delivery failures, damaged goods |
| **customer_support** | Complaints, escalations | Severe complaints, angry customers |
| **general** | Neutral information | Standard processing |

## 🚦 Priority Levels

| Level | Meaning | Examples |
|-------|---------|----------|
| 🔴 **RED** | Urgent action required | Legal liability, patient risk, major financial loss, severe complaint |
| 🟡 **YELLOW** | Action needed soon | Pending approval, incomplete info, moderate issues |
| 🟢 **GREEN** | Informational only | Standard records, routine documents |

## 📊 Response Structure

```json
{
  "agentResponse": "Natural language response",
  "actionTaken": "extract|translate|analyze|answer|clarify",
  "extractedData": { "field": "value" },
  "translatedData": { "field": "translated_value" },
  "intelligence": {
    "domain": "technical",
    "summary": "3-5 sentence explanation",
    "priority": {
      "level": "YELLOW",
      "reason": "Short explanation"
    },
    "tags": ["tag1", "tag2"],
    "field_explanations": {
      "field": "Simple explanation"
    }
  },
  "needsMoreInfo": false,
  "suggestedActions": ["Action 1", "Action 2"]
}
```

## 🔌 API Usage

### Health Check
```bash
GET /api/agent
```

### Send Message
```bash
POST /api/agent
Content-Type: application/json

{
  "message": "Extract data from this document",
  "documentImage": "data:image/jpeg;base64,...",
  "extractedData": { ... },
  "conversationHistory": [ ... ]
}
```

## 💻 Code Examples

### Basic Chat
```typescript
import { chatWithAgent } from '@/app/actions';

const result = await chatWithAgent({
  userMessage: "Extract data",
  documentImage: imageDataUri,
});
```

### With Context
```typescript
const result = await chatWithAgent({
  userMessage: "Translate to Hindi",
  extractedData: previousData,
  conversationHistory: [
    { role: 'user', message: 'Extract data' },
    { role: 'agent', message: 'Data extracted!' }
  ],
});
```

### React Component
```tsx
import { NexScanChat } from '@/components/nexscan-chat';

export default function Page() {
  return <NexScanChat />;
}
```

## 🎨 UI Features

### Chat Interface
- Message history with timestamps
- File upload button
- Suggested action badges (clickable)
- Loading indicators
- Error handling
- Auto-scroll to latest message

### Suggested Actions
After each response, the agent may suggest:
- "Translate to another language"
- "Analyze document"
- "Ask questions"
- "Extract another document"

Click these badges to quickly perform actions.

## 🔧 Configuration

### Environment Variables
```env
GOOGLE_GENAI_API_KEY=your_key_here
```

### Model Configuration
Located in `src/ai/genkit.ts`:
```typescript
model: 'googleai/gemini-2.5-flash'
```

## 📝 Best Practices

### For Users
1. ✅ Upload clear, well-lit images
2. ✅ Be specific in requests
3. ✅ Use suggested actions
4. ✅ Ask follow-up questions
5. ✅ Check priority levels

### For Developers
1. ✅ Validate inputs before sending
2. ✅ Handle errors gracefully
3. ✅ Implement rate limiting
4. ✅ Add authentication for production
5. ✅ Log agent interactions
6. ✅ Monitor performance

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent doesn't understand | Rephrase more clearly, use suggested actions |
| Extraction fails | Upload clearer image, check lighting |
| Translation errors | Verify extracted data first |
| Slow response | Check API key, network connection |
| Missing data | Ensure all required fields in request |

## 📚 Documentation Links

- **Setup Guide**: `docs/AGENT_SETUP.md`
- **Full Documentation**: `docs/nexscan-agent.md`
- **Integration Examples**: `docs/agent-integration-examples.md`
- **Main README**: `README.md`

## 🎯 Workflow Examples

### Complete Document Processing
```
1. Upload document → Agent extracts data
2. "Translate to Hindi" → Agent translates
3. "Analyze this" → Agent provides insights
4. "Is this urgent?" → Agent confirms priority
```

### Quick Extraction
```
1. Upload document
2. Agent auto-extracts
3. Review data
4. Done!
```

### Multi-language Support
```
1. Upload Hindi document
2. Agent extracts
3. "Translate to English"
4. Agent translates
5. "Analyze"
6. Agent provides insights in English
```

## 🚀 Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Set up `.env` with API key
- [ ] Run Next.js: `npm run dev`
- [ ] Run Genkit: `npm run genkit:dev`
- [ ] Open `/chat` in browser
- [ ] Upload a test document
- [ ] Try different commands
- [ ] Check suggested actions
- [ ] Test translation
- [ ] Review analysis results

## 💡 Pro Tips

1. **Context Matters**: The agent remembers previous messages
2. **Suggested Actions**: Click them for quick workflows
3. **Natural Language**: No need for exact commands
4. **Priority Levels**: Always check for urgent documents
5. **Field Explanations**: Ask about unfamiliar fields
6. **Batch Processing**: Process multiple documents in sequence
7. **API Integration**: Use REST API for automation

---

**Need Help?** Check the full documentation in `docs/nexscan-agent.md`
