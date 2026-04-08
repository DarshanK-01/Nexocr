# Integrated AI Agent - Quick Guide

## 🎯 Overview

The AI Agent is now fully integrated into your main application! You can ask questions about extracted documents directly on the same page.

## 🚀 How to Use

### Step 1: Start Your Servers

Open two terminals:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run genkit:dev
```

### Step 2: Access the Application

Open your browser and go to:
```
http://localhost:9002
```

You'll see a **3-column layout**:
1. **Left**: Image Uploader
2. **Middle**: Data Form
3. **Right**: AI Agent Chat

## 💬 Using the Agent

### Workflow

1. **Upload a Document**
   - Click "Upload Image" or "Use Camera" in the left column
   - The document will be extracted automatically

2. **Review Extracted Data**
   - Check the middle column for extracted fields
   - Edit if needed

3. **Ask the Agent Questions**
   - The right column shows the AI Agent chat
   - Once data is extracted, you can ask questions!

### Example Questions

**Analysis:**
```
"Analyze this document"
"Is this urgent?"
"What's the priority level?"
```

**Translation:**
```
"Translate to Hindi"
"Convert to Marathi"
"Show me this in English"
```

**Field Explanations:**
```
"What does complaint number mean?"
"Explain the nature of defect field"
"What is BCCD?"
```

**General Questions:**
```
"What should I do with this?"
"What type of document is this?"
"Summarize this document"
```

## 🎨 Features

### Smart Context
- Agent automatically knows about your extracted data
- No need to re-upload or copy-paste
- Maintains conversation history

### Suggested Actions
- After each response, the agent suggests next steps
- Click the badges to quickly perform actions
- Examples: "Translate to another language", "Analyze document"

### Real-time Updates
- When you extract new data, the agent resets
- Ready to answer questions about the new document
- Previous conversations are cleared

## 📊 Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        Header                                │
│  NexScan | View Excel Sheet | Export CSV | Menu             │
└─────────────────────────────────────────────────────────────┘
┌─────────────┬─────────────────┬──────────────────────────────┐
│             │                 │                              │
│   Image     │   Data Form     │    AI Agent Chat            │
│  Uploader   │                 │                              │
│             │  • Branch       │  👋 Hi! I can help you...   │
│  [Upload]   │  • BCCD Name    │                              │
│  [Camera]   │  • Product      │  User: Analyze this         │
│             │  • Serial No    │  Agent: This is a...        │
│             │  • Date         │                              │
│             │  • Complaint    │  [Suggested Actions]        │
│             │  • Defect       │                              │
│             │  • Technician   │  [Ask about document...]    │
│             │                 │  [Send]                      │
│             │  [Add to Sheet] │                              │
│             │                 │                              │
└─────────────┴─────────────────┴──────────────────────────────┘
```

## 🎯 Common Use Cases

### Use Case 1: Quick Analysis
```
1. Upload document
2. Wait for extraction
3. Ask: "Is this urgent?"
4. Agent tells you priority level
```

### Use Case 2: Multi-language
```
1. Upload Hindi document
2. Data extracted in Hindi
3. Ask: "Translate to English"
4. Agent translates all fields
```

### Use Case 3: Understanding Fields
```
1. Upload document
2. See unfamiliar field
3. Ask: "What does [field name] mean?"
4. Agent explains in simple terms
```

### Use Case 4: Complete Workflow
```
1. Upload document
2. Ask: "Analyze this"
3. Review priority and domain
4. Ask: "What should I do?"
5. Get actionable recommendations
6. Add to Excel sheet
```

## 💡 Tips

### For Best Results
1. ✅ Extract data before asking questions
2. ✅ Be specific in your questions
3. ✅ Use suggested actions for quick workflows
4. ✅ Ask follow-up questions - agent remembers context
5. ✅ Check priority levels for urgent documents

### Agent Capabilities
- **Extract**: Already done automatically on upload
- **Translate**: Ask to translate to any language
- **Analyze**: Get domain detection and priority
- **Answer**: Ask questions about fields or document
- **Clarify**: Agent will ask if it needs more info

## 🔧 Customization

### Adjust Layout
The layout is responsive:
- **Desktop**: 3 columns side by side
- **Tablet**: Stacked vertically
- **Mobile**: Full width, scrollable

### Modify Agent Behavior
Edit `src/components/agent-chat-panel.tsx` to:
- Change welcome message
- Adjust suggested questions
- Customize appearance
- Add more features

## 🐛 Troubleshooting

**Agent not responding:**
- Check that Genkit server is running
- Verify `.env` has API key
- Check browser console for errors

**"Extract data first" message:**
- Upload a document first
- Wait for extraction to complete
- Then ask questions

**Slow responses:**
- Check internet connection
- Verify API key is valid
- Large images take longer to process

## 📱 Mobile Experience

The agent works great on mobile:
- Touch-friendly interface
- Responsive layout
- Easy to type questions
- Suggested actions are tappable

## 🎓 Learning Path

### Beginner (5 minutes)
1. Upload a test document
2. Wait for extraction
3. Ask: "Analyze this document"
4. Review the response

### Intermediate (10 minutes)
1. Upload document
2. Ask for analysis
3. Ask for translation
4. Ask specific field questions
5. Use suggested actions

### Advanced (15+ minutes)
1. Process multiple documents
2. Compare priorities
3. Use agent for decision making
4. Integrate into your workflow
5. Customize as needed

## 🚀 Next Steps

1. **Try it now**: Upload a document and ask questions
2. **Explore features**: Try different types of questions
3. **Integrate workflow**: Use agent in your daily tasks
4. **Customize**: Modify to fit your needs

## 📚 Related Documentation

- **Full Agent Docs**: `docs/nexscan-agent.md`
- **Quick Reference**: `docs/QUICK_REFERENCE.md`
- **Integration Examples**: `docs/agent-integration-examples.md`
- **Testing Guide**: `docs/TESTING_GUIDE.md`

---

**The AI Agent is now part of your main workflow - no separate page needed!** 🎉

Just upload, extract, and ask questions - all in one place on `http://localhost:9002`
