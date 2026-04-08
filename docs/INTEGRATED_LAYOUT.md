# Integrated AI Agent - Layout Guide

## 🎨 Visual Layout

The NexScan application now features a **3-column integrated layout** on a single page:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                          │
│  ┌──────────┐  ┌────────────────────┐  ┌──────────┐  ┌──────────┐         │
│  │ NexScan  │  │ Active Sheet: XXX  │  │ View     │  │ Export   │  [Menu] │
│  │   Logo   │  │                    │  │ Sheet    │  │  CSV     │         │
│  └──────────┘  └────────────────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────────┐
│                      │                      │                              │
│   IMAGE UPLOADER     │    DATA FORM         │    AI AGENT CHAT            │
│                      │                      │                              │
│  ┌────────────────┐  │  ┌────────────────┐  │  ┌────────────────────────┐ │
│  │                │  │  │ Branch:        │  │  │ 👋 Hi! I can help you  │ │
│  │   [Preview]    │  │  │ [_________]    │  │  │ understand the         │ │
│  │                │  │  │                │  │  │ extracted data...      │ │
│  │                │  │  │ BCCD Name:     │  │  └────────────────────────┘ │
│  └────────────────┘  │  │ [_________]    │  │                              │
│                      │  │                │  │  ┌────────────────────────┐ │
│  ┌────────────────┐  │  │ Product Desc:  │  │  │ User: Analyze this     │ │
│  │ Upload Image   │  │  │ [_________]    │  │  └────────────────────────┘ │
│  └────────────────┘  │  │                │  │                              │
│                      │  │ Serial No:     │  │  ┌────────────────────────┐ │
│  ┌────────────────┐  │  │ [_________]    │  │  │ Agent: This is a       │ │
│  │  Use Camera    │  │  │                │  │  │ TECHNICAL document     │ │
│  └────────────────┘  │  │ Date:          │  │  │ with YELLOW priority   │ │
│                      │  │ [_________]    │  │  │                        │ │
│  Status:             │  │                │  │  │ [Translate] [Analyze]  │ │
│  Ready to scan       │  │ Complaint No:  │  │  └────────────────────────┘ │
│                      │  │ [_________]    │  │                              │
│                      │  │                │  │  ┌────────────────────────┐ │
│                      │  │ Defect:        │  │  │ [Ask about document..] │ │
│                      │  │ [_________]    │  │  │                  [Send]│ │
│                      │  │                │  │  └────────────────────────┘ │
│                      │  │ Technician:    │  │                              │
│                      │  │ [_________]    │  │  Extract data first to      │
│                      │  │                │  │  ask questions              │
│                      │  │ ┌────────────┐ │  │                              │
│                      │  │ │Add to Sheet│ │  │                              │
│                      │  │ └────────────┘ │  │                              │
│                      │  └────────────────┘  │                              │
└──────────────────────┴──────────────────────┴──────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (1024px+)
```
┌─────────────┬─────────────┬─────────────┐
│   Upload    │    Form     │    Agent    │
│   (33%)     │    (33%)    │    (33%)    │
└─────────────┴─────────────┴─────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────┐
│            Upload                        │
├─────────────────────────────────────────┤
│            Form                          │
├─────────────────────────────────────────┤
│            Agent                         │
└─────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────────┐
│     Upload        │
├───────────────────┤
│     Form          │
├───────────────────┤
│     Agent         │
└───────────────────┘
```

## 🔄 Workflow Visualization

```
Step 1: Upload Document
┌──────────────────┐
│  Image Uploader  │
│  [Upload/Camera] │ ──────┐
└──────────────────┘       │
                           ▼
Step 2: Automatic Extraction
                    ┌──────────────┐
                    │  AI Process  │
                    │  Extracting  │
                    └──────────────┘
                           │
                           ▼
Step 3: Review Data        │        Step 4: Ask Questions
┌──────────────────┐       │        ┌──────────────────┐
│   Data Form      │◄──────┴───────►│   AI Agent       │
│   • Branch       │                │   Chat Panel     │
│   • BCCD Name    │                │                  │
│   • Product      │                │   "Analyze this" │
│   • Serial No    │                │   "Translate"    │
│   • Date         │                │   "Is urgent?"   │
│   • Complaint    │                │                  │
│   • Defect       │                │   [Responses]    │
│   • Technician   │                │   [Actions]      │
│                  │                │                  │
│ [Add to Sheet]   │                │   [Ask more...]  │
└──────────────────┘                └──────────────────┘
         │
         ▼
Step 5: Save to Excel
┌──────────────────┐
│  Excel Sheet     │
│  • Row 1         │
│  • Row 2         │
│  • Row 3         │
│  [Export CSV]    │
└──────────────────┘
```

## 🎯 User Journey

### Journey 1: Quick Scan
```
User Action                    System Response
───────────────────────────────────────────────────────
1. Upload document        →    Shows preview
2. Wait                   →    Extracts data automatically
3. Review form            →    Data populated in middle column
4. Ask "Is urgent?"       →    Agent: "YELLOW priority..."
5. Click "Add to Sheet"   →    Saved to Excel
```

### Journey 2: Multi-language
```
User Action                    System Response
───────────────────────────────────────────────────────
1. Upload Hindi doc       →    Shows preview
2. Wait                   →    Extracts Hindi text
3. Ask "Translate to EN"  →    Agent translates all fields
4. Review translation     →    English data in chat
5. Add to sheet           →    Saved with original data
```

### Journey 3: Understanding
```
User Action                    System Response
───────────────────────────────────────────────────────
1. Upload document        →    Extracts data
2. See unfamiliar field   →    Data in form
3. Ask "What is BCCD?"    →    Agent explains in simple terms
4. Ask "Analyze this"     →    Domain + priority + summary
5. Make decision          →    Based on agent insights
```

## 💡 Interactive Elements

### Column 1: Image Uploader
```
┌─────────────────────┐
│  [Image Preview]    │  ← Shows uploaded/captured image
├─────────────────────┤
│  [Upload Image]     │  ← Click to select file
│  [Use Camera]       │  ← Click to use device camera
├─────────────────────┤
│  Status: Ready      │  ← Shows current state
└─────────────────────┘
```

### Column 2: Data Form
```
┌─────────────────────┐
│  Field: [_______]   │  ← Editable text fields
│  Field: [_______]   │  ← Auto-populated from extraction
│  Field: [_______]   │  ← Can be manually edited
│  ...                │
├─────────────────────┤
│  [Add to Sheet]     │  ← Saves to active Excel sheet
└─────────────────────┘
```

### Column 3: AI Agent Chat
```
┌─────────────────────┐
│  Chat History       │  ← Scrollable message area
│  • Agent messages   │
│  • User messages    │
│  • Timestamps       │
├─────────────────────┤
│  [Suggested Action] │  ← Clickable badges
│  [Suggested Action] │
├─────────────────────┤
│  [Type message...] │  ← Input field
│  [Send]            │  ← Send button
└─────────────────────┘
```

## 🎨 Color Coding

### Priority Indicators (in Agent responses)
- 🔴 **RED**: Urgent - immediate action required
- 🟡 **YELLOW**: Important - action needed soon
- 🟢 **GREEN**: Informational - no urgent action

### Message Types (in Chat)
- **Blue background**: User messages (right-aligned)
- **Gray background**: Agent messages (left-aligned)
- **Badge buttons**: Suggested actions (clickable)

## 📊 Data Flow

```
┌─────────────┐
│   Upload    │
│   Image     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Extract    │
│  Data       │
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Display    │    │  Store      │    │  Send to    │
│  in Form    │    │  Image      │    │  Agent      │
└─────────────┘    └─────────────┘    └──────┬──────┘
       │                                      │
       │                                      ▼
       │                              ┌─────────────┐
       │                              │  Agent      │
       │                              │  Processes  │
       │                              └──────┬──────┘
       │                                     │
       │                                     ▼
       │                              ┌─────────────┐
       │                              │  Response   │
       │                              │  in Chat    │
       │                              └─────────────┘
       ▼
┌─────────────┐
│  Add to     │
│  Excel      │
└─────────────┘
```

## 🔧 Customization Points

### Adjust Column Widths
In `src/app/page.tsx`:
```tsx
// Current: Equal 3 columns
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// Option 1: Wider form
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-3">Upload</div>
  <div className="lg:col-span-5">Form</div>
  <div className="lg:col-span-4">Agent</div>
</div>

// Option 2: Wider agent
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-3">Upload</div>
  <div className="lg:col-span-4">Form</div>
  <div className="lg:col-span-5">Agent</div>
</div>
```

### Change Agent Position
```tsx
// Move agent to bottom
<div className="space-y-6">
  <div className="grid grid-cols-2 gap-6">
    <div>Upload</div>
    <div>Form</div>
  </div>
  <div>Agent (full width)</div>
</div>
```

## 📱 Mobile Optimization

### Touch Targets
- All buttons: Minimum 44x44px
- Input fields: Large enough for typing
- Suggested actions: Easy to tap

### Scrolling
- Each column scrolls independently on desktop
- Vertical scroll on mobile
- Chat area has internal scroll

### Keyboard
- Input fields auto-focus when appropriate
- Enter key sends messages
- Escape key closes dialogs

## 🎉 Benefits of Integration

### Single Page Workflow
✅ No need to switch between pages
✅ All tools in one place
✅ Faster workflow

### Context Awareness
✅ Agent knows about extracted data
✅ No need to re-upload
✅ Seamless experience

### Efficient Layout
✅ See everything at once
✅ Compare data and responses
✅ Make quick decisions

---

**The integrated layout provides a complete document processing experience on a single page!** 🚀
