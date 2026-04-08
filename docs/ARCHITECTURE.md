# NexScan AI Agent - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web Chat    │  │  REST API    │  │  Main App    │          │
│  │  /chat       │  │  /api/agent  │  │  /           │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Server Actions (actions.ts)                │    │
│  │  • chatWithAgent()                                      │    │
│  │  • extractDataFromImage()                               │    │
│  │  • translateExtractedData()                             │    │
│  │  • analyzeDocument()                                    │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI ORCHESTRATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         NexScan Agent (nexscan-agent.ts)               │    │
│  │                                                          │    │
│  │  1. Receive user message                                │    │
│  │  2. Detect intent (extract/translate/analyze/answer)    │    │
│  │  3. Route to appropriate flow                           │    │
│  │  4. Format response                                     │    │
│  │  5. Suggest next actions                                │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│         ┌─────────────┼─────────────┐                           │
│         │             │             │                            │
└─────────┼─────────────┼─────────────┼────────────────────────────┘
          │             │             │
          ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI FLOWS (Genkit)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Extract    │  │  Translate   │  │   Analyze    │          │
│  │              │  │              │  │              │          │
│  │ • OCR        │  │ • Multi-lang │  │ • Domain     │          │
│  │ • Field      │  │ • Structure  │  │   detection  │          │
│  │   detection  │  │   preserved  │  │ • Priority   │          │
│  │ • Validation │  │              │  │ • Tags       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI MODEL (Gemini)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Google Gemini 2.5 Flash                         │    │
│  │  • Vision capabilities (image understanding)            │    │
│  │  • Natural language processing                          │    │
│  │  • Structured output generation                         │    │
│  │  • Multi-language support                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Document Extraction Flow

```
User uploads image
       ↓
Chat Interface / API
       ↓
chatWithAgent("Extract data", imageDataUri)
       ↓
NexScan Agent (detects "extract" intent)
       ↓
extractData(imageDataUri)
       ↓
Gemini Vision Model
       ↓
Structured JSON data
       ↓
Agent formats response
       ↓
User sees extracted data + suggested actions
```

### 2. Translation Flow

```
User: "Translate to Hindi"
       ↓
chatWithAgent("Translate to Hindi", extractedData)
       ↓
NexScan Agent (detects "translate" intent)
       ↓
translateData(extractedData, "Hindi")
       ↓
Gemini Model
       ↓
Translated data (structure preserved)
       ↓
Agent formats response
       ↓
User sees translated data
```

### 3. Analysis Flow

```
User: "Analyze this document"
       ↓
chatWithAgent("Analyze", extractedData)
       ↓
NexScan Agent (detects "analyze" intent)
       ↓
analyzeDocumentIntelligence(extractedData)
       ↓
Domain Detection → Priority Assignment → Tag Generation
       ↓
Intelligence Report
       ↓
Agent formats with emojis and structure
       ↓
User sees domain, priority, summary, tags, explanations
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    NexScanChat Component                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State:                                                           │
│  • messages: Message[]                                            │
│  • input: string                                                  │
│  • isLoading: boolean                                             │
│  • documentImage: string | null                                   │
│  • extractedData: Record<string, string> | null                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  User Actions                                            │   │
│  │  • Type message                                          │   │
│  │  • Upload file                                           │   │
│  │  • Click suggested action                                │   │
│  │  • Press Enter                                           │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  handleSendMessage()                                     │   │
│  │  1. Add user message to state                            │   │
│  │  2. Call chatWithAgent()                                 │   │
│  │  3. Update extractedData if available                    │   │
│  │  4. Add agent response to messages                       │   │
│  │  5. Display suggested actions                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Intent Detection Logic

```
User Message
     ↓
┌────────────────────────────────────────┐
│  NexScan Agent Prompt                  │
│  (Analyzes message + context)          │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Intent Classification                                  │
│                                                          │
│  Keywords/Patterns:                                      │
│  • "extract", "scan", "read" → EXTRACT                  │
│  • "translate", "convert" → TRANSLATE                   │
│  • "analyze", "urgent", "priority" → ANALYZE            │
│  • "what", "explain", "mean" → ANSWER                   │
│  • Unclear/ambiguous → CLARIFY                          │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Action Router                                          │
│                                                          │
│  EXTRACT    → extractData()                             │
│  TRANSLATE  → translateData()                           │
│  ANALYZE    → analyzeDocumentIntelligence()             │
│  ANSWER     → Generate contextual response              │
│  CLARIFY    → Ask for more information                  │
└─────────────────────────────────────────────────────────┘
```

## Domain Detection Algorithm

```
Structured Data + Raw OCR Text
           ↓
┌──────────────────────────────────────────┐
│  Analyze Field Names & Values             │
│  • Look for domain-specific keywords      │
│  • Check field patterns                   │
│  • Analyze value types                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Domain Classification                    │
│                                            │
│  Finance:    payment, invoice, amount     │
│  Legal:      contract, agreement, clause  │
│  Medical:    patient, diagnosis, lab      │
│  Technical:  defect, repair, malfunction  │
│  HR:         employee, leave, policy      │
│  Logistics:  shipment, delivery, tracking │
│  Support:    complaint, issue, feedback   │
│  General:    default fallback             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Apply Domain-Specific Rules              │
│  • Set priority thresholds                │
│  • Generate relevant tags                 │
│  • Create field explanations              │
│  • Format summary appropriately           │
└───────────────────────────────────────────┘
```

## Priority Assignment Logic

```
Document Domain + Field Values
           ↓
┌──────────────────────────────────────────┐
│  Domain-Specific Risk Assessment          │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  RED (Urgent)                             │
│  • Finance: Large overdue amounts         │
│  • Legal: Liability, breach               │
│  • Medical: Abnormal critical values      │
│  • Technical: System failure              │
│  • Support: Severe complaint              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  YELLOW (Action Required)                 │
│  • Pending approvals                      │
│  • Incomplete information                 │
│  • Moderate issues                        │
│  • Upcoming deadlines                     │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  GREEN (Informational)                    │
│  • Standard records                       │
│  • Routine documents                      │
│  • No action required                     │
└───────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│  • React 18                                                       │
│  • Next.js 14 (App Router)                                        │
│  • TypeScript                                                     │
│  • Tailwind CSS                                                   │
│  • shadcn/ui components                                           │
│  • Lucide React (icons)                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js Server Actions                                         │
│  • Next.js API Routes                                             │
│  • Google Genkit (AI orchestration)                               │
│  • Zod (validation)                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         AI/ML                                    │
├─────────────────────────────────────────────────────────────────┤
│  • Google Gemini 2.5 Flash                                        │
│  • Vision API (image understanding)                               │
│  • Natural Language Processing                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Input Validation                                              │
│     • Zod schema validation                                       │
│     • Type checking (TypeScript)                                  │
│     • File type validation                                        │
│                                                                   │
│  2. Server-Side Processing                                        │
│     • All AI calls on server                                      │
│     • API keys never exposed to client                            │
│     • Server Actions for data mutations                           │
│                                                                   │
│  3. Error Handling                                                │
│     • Try-catch blocks                                            │
│     • Graceful degradation                                        │
│     • User-friendly error messages                                │
│                                                                   │
│  4. Recommended for Production                                    │
│     • Rate limiting                                               │
│     • Authentication/Authorization                                │
│     • Input sanitization                                          │
│     • CORS configuration                                          │
│     • Logging and monitoring                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Current Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│  • Stateless server actions                                       │
│  • Client-side state management                                   │
│  • No database (ephemeral data)                                   │
│  • Direct API calls to Gemini                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Future Enhancements                           │
├─────────────────────────────────────────────────────────────────┤
│  • Add Redis for caching                                          │
│  • Implement request queuing                                      │
│  • Add database for persistence                                   │
│  • Implement WebSocket for real-time                              │
│  • Add CDN for static assets                                      │
│  • Implement load balancing                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Development                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Local Next.js server (port 9002)                               │
│  • Local Genkit dev server                                        │
│  • Environment variables from .env                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Production (Recommended)                    │
├─────────────────────────────────────────────────────────────────┤
│  • Vercel / Firebase App Hosting                                  │
│  • Environment variables in platform                              │
│  • CDN for static assets                                          │
│  • Monitoring and logging                                         │
│  • Rate limiting middleware                                       │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── ai/
│   ├── genkit.ts                    # Genkit configuration
│   ├── dev.ts                       # Development server
│   ├── flows/
│   │   ├── nexscan-agent.ts         # Main agent orchestrator
│   │   ├── analyze-document-intelligence.ts
│   │   ├── extract-data-from-handwritten-form.ts
│   │   ├── translate-extracted-text.ts
│   │   └── improve-extraction-accuracy-with-llm.ts
│   └── schemas/
│       └── form-extraction-schemas.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # Main app page
│   ├── actions.ts                   # Server actions
│   ├── globals.css
│   ├── chat/
│   │   └── page.tsx                 # Chat interface page
│   └── api/
│       └── agent/
│           └── route.ts             # REST API endpoint
├── components/
│   ├── nexscan-chat.tsx             # Chat UI component
│   ├── image-uploader.tsx
│   ├── data-form.tsx
│   └── ui/                          # shadcn/ui components
└── lib/
    └── utils.ts

docs/
├── AGENT_SETUP.md                   # Setup guide
├── nexscan-agent.md                 # Full documentation
├── agent-integration-examples.md    # Code examples
├── QUICK_REFERENCE.md               # Quick reference
├── IMPLEMENTATION_SUMMARY.md        # Implementation summary
└── ARCHITECTURE.md                  # This file
```

---

This architecture provides a solid foundation for document intelligence with room for future enhancements and scalability.
