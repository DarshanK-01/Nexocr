# NexScan: AI-Powered Document Intelligence Platform

NexScan is a Next.js application that combines document extraction with intelligent analysis using Generative AI. It features:

- 📄 **Document Extraction**: Capture and extract data from handwritten forms and documents
- 🤖 **AI Agent**: Conversational bot that understands user intent and performs document operations
- 🌍 **Multi-language Support**: Translate extracted data to any language
- 🎯 **Domain Intelligence**: Automatic domain detection with context-aware analysis
- 🚦 **Priority Detection**: Smart prioritization (RED/YELLOW/GREEN) based on document type
- 💬 **Natural Language Interface**: Chat with the AI agent to process documents

## 🆕 NexScan AI Agent

The conversational AI agent is now **fully integrated into the main application**! After extracting data from a document, you can immediately ask questions in the chat panel on the right side of the screen.

**Features:**
- Ask questions about extracted data
- Get document analysis and priority detection
- Translate to any language
- Understand field meanings
- Get actionable recommendations

**Example workflow:**
```
1. Upload document → Data extracted
2. Ask: "Analyze this document"
3. Agent: "This is a TECHNICAL domain document with YELLOW priority..."
4. Ask: "Translate to Hindi"
5. Agent: [shows translated data]
6. Add to Excel sheet
```

**Quick Access:**
- Main App (with integrated agent): `http://localhost:9002`
- Standalone Chat Interface: `http://localhost:9002/chat`
- API Endpoint: `http://localhost:9002/api/agent`
- Documentation: See `docs/INTEGRATED_AGENT_GUIDE.md`

## Running the Project Locally

To run this project on your local machine using an editor like Visual Studio Code, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A Google AI API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 1. Installation

First, open the project folder in Visual Studio Code. Then, open the integrated terminal (you can use `Ctrl+\``) and install the necessary project dependencies by running:

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires an API key to connect to Google's AI services.

1.  Create a new file named `.env` in the root of your project directory.
2.  Add your Google AI API key to this file as follows:

```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with the actual key you obtained from Google AI Studio.

### 3. Run the Development Servers

This application consists of two main parts that need to be run simultaneously in separate terminals:

1.  **The Next.js Web Application:** This is the user interface.
2.  **The Genkit AI Flows:** This is the backend service that runs the AI models.

You'll need two separate terminal windows or use VS Code's split terminal feature.

**In your first terminal, run the Next.js app:**

```bash
npm run dev
```

This will start the web server, typically on `http://localhost:9002`.

**In your second terminal, run the Genkit server:**

```bash
npm run genkit:dev
```

This starts the Genkit development server, which makes the AI flows available for the Next.js application to call.

### 4. Access the Application

Once both servers are running, open your web browser and navigate to:

**Main Application (with Integrated AI Agent):**
[http://localhost:9002](http://localhost:9002)

The main page now features a **3-column layout**:
- **Left**: Upload and capture documents
- **Middle**: Review and edit extracted data
- **Right**: AI Agent chat - ask questions about your documents!

**Alternative - Standalone Chat Interface:**
[http://localhost:9002/chat](http://localhost:9002/chat)

You should now see the NexScan application running with the AI agent ready to help.

## 🤖 Using the Integrated AI Agent

The AI Agent is built right into the main page! Here's how to use it:

### Quick Start:
1. **Upload a document** (left column)
2. **Wait for extraction** (middle column shows data)
3. **Ask questions** (right column - AI Agent chat)

### Example Questions:
- "Analyze this document"
- "Is this urgent?"
- "Translate to Hindi"
- "What does complaint number mean?"
- "What should I do with this?"

### Features:
- **Smart Context**: Agent automatically knows about your extracted data
- **Suggested Actions**: Click badges for quick operations
- **Multi-language**: Translate to any language
- **Domain Intelligence**: Automatic document type detection
- **Priority Detection**: Know what's urgent (RED/YELLOW/GREEN)

For detailed documentation, see:
- `docs/INTEGRATED_AGENT_GUIDE.md` - How to use the integrated agent
- `docs/AGENT_SETUP.md` - Complete setup guide
- `docs/nexscan-agent.md` - Full documentation
- `docs/agent-integration-examples.md` - Code examples

## Project Structure & File Explanations

This project is built with Next.js (App Router), TypeScript, Tailwind CSS, and ShadCN UI components. AI capabilities are powered by Google's Gemini model via Genkit.

### Root Directory

- **`.env`**: Stores environment variables. For this project, it holds the `GEMINI_API_KEY` for the AI service.
- **`apphosting.yaml`**: Configuration file for deploying the application on Firebase App Hosting.
- **`components.json`**: The configuration file for `shadcn/ui`. It defines the style, component library path, and color settings for the UI components.
- **`next.config.ts`**: The main configuration file for Next.js. It includes settings for TypeScript, ESLint, and importantly, configures allowed remote image domains (`picsum.photos`, `images.unsplash.com`).
- **`package.json`**: Lists all project dependencies (like `next`, `react`, `genkit`, `lucide-react`) and defines scripts for running, building, and linting the application (e.g., `npm run dev`).
- **`README.md`**: This file, providing an overview and documentation of the project.
- **`tailwind.config.ts`**: The configuration file for Tailwind CSS. It sets up the visual design of the app, including custom fonts and a color palette based on CSS variables defined in `globals.css`.
- **`tsconfig.json`**: The TypeScript compiler configuration file. It sets rules for how TypeScript code is checked and compiled, and defines path aliases (like `@/*`) for cleaner imports.

---

### `src/ai` - Artificial Intelligence

This directory contains the core AI logic, powered by Genkit.

- **`genkit.ts`**: Initializes and configures the Genkit instance. It specifies the AI plugin to use (`@genkit-ai/google-genai`) and sets the default model for the application, which is `googleai/gemini-2.5-flash`.
- **`dev.ts`**: A development file used by the Genkit CLI to start and manage the AI flows during local development. It imports the flow files to make them available to the Genkit development server.

#### `src/ai/flows`

This sub-directory holds the Genkit "flows," which are server-side functions that orchestrate calls to the AI model.

- **`extract-data-from-handwritten-form.ts`**:
  - Defines the primary AI flow for the application.
  - It takes a photo of a form (as a Base64 data URI) as input.
  - It uses the Gemini model to analyze the image and extract data into a structured JSON object with fields like `branch`, `productDescription`, `complaintNo`, etc.
  - It also defines a field `others` to capture any text that doesn't fit into the predefined categories.
  - It exports the `extractData` function and its associated input/output TypeScript types (`ExtractDataInput`, `ExtractDataOutput`).

- **`improve-extraction-accuracy-with-llm.ts`**:
  - Defines a secondary (currently unused but available) flow designed to refine OCR results.
  - It would take raw text from an OCR process and the form image to correct and structure the data. This provides a potential two-step extraction process for higher accuracy if needed in the future.

- **`translate-extracted-text.ts`**:
  - Defines a flow for translating extracted data to different languages.
  - Takes structured data and a target language as input.
  - Returns the translated data maintaining the same structure.

- **`analyze-document-intelligence.ts`**:
  - Implements domain-adaptive document intelligence.
  - Automatically detects document domain (finance, legal, medical, technical, etc.).
  - Provides priority detection (RED/YELLOW/GREEN).
  - Generates searchable tags and field explanations.
  - Returns comprehensive analysis with actionable insights.

- **`nexscan-agent.ts`**:
  - The main conversational AI agent orchestrator.
  - Understands user intent from natural language.
  - Routes requests to appropriate flows (extract/translate/analyze/answer).
  - Maintains conversation context and history.
  - Provides suggested actions and natural language responses.
  - Exports the `chatWithNexScanAgent` function for conversational interactions.

---

### `src/app` - Application UI & Routing

This is the heart of the Next.js application, following the App Router paradigm.

- **`layout.tsx`**: The root layout of the application. It wraps all pages, applies the global stylesheet (`globals.css`), includes custom fonts from Google Fonts, and sets up the `Toaster` component for displaying notifications.
- **`page.tsx`**: The main page of the application (`/`).
  - This is a client-side component (`'use client'`) that manages the application's state, including the uploaded image, loading status, and extracted data.
  - It orchestrates the interaction between the `ImageUploader` and `DataForm` components.
  - When an image is ready, it calls the `extractDataFromImage` server action.
- **`actions.ts`**: A file for Next.js Server Actions.
  - It exports the `extractDataFromImage` function, which acts as a bridge between the client-side components and the server-side AI flow. It calls the `extractData` flow from the AI directory and handles any potential errors, returning a consistent state object to the client.
  - It also exports `chatWithAgent` for interacting with the NexScan AI Agent conversationally.
  - Additional actions include `translateExtractedData` and `analyzeDocument` for specific operations.
- **`globals.css`**: The global stylesheet. It includes base Tailwind CSS layers and defines the application's color theme using HSL CSS variables for both light and dark modes (e.g., `--primary`, `--background`).

#### `src/app/chat`

- **`page.tsx`**: The AI Agent chat interface page.
  - Provides a conversational UI for interacting with the NexScan AI Agent.
  - Users can upload documents, ask questions, and get intelligent insights.
  - Accessible at `/chat` route.

#### `src/app/api/agent`

- **`route.ts`**: REST API endpoint for the NexScan AI Agent.
  - POST `/api/agent` - Send messages and documents to the agent.
  - GET `/api/agent` - Health check and capabilities endpoint.
  - Enables external integrations and programmatic access.

---

### `src/components` - Reusable UI Components

This directory contains all the React components used to build the user interface.

- **`image-uploader.tsx`**: A component that allows the user to either upload an image file or use their device's camera.
  - It displays a preview of the image or the live camera feed.
  - It handles camera permissions and provides keyboard shortcuts (Enter to capture, Escape to quit).
  - When an image is captured or uploaded, it converts it to a data URI and passes it to the parent component (`page.tsx`) via the `onImageReady` prop.
- **`data-form.tsx`**: A form to display, validate, and edit the data extracted by the AI.
  - It uses `react-hook-form` for form state management and `zod` for validation.
  - It dynamically populates the form fields with the `initialData` received from the AI.
  - It includes functionality to "Export to CSV" and "Save Changes."
  - It contains a separate, non-editable "Other Extracted Text" area at the bottom to display any miscellaneous text captured by the AI, which is not part of the main form data and is discarded on save.
- **`nexscan-chat.tsx`**: The conversational AI agent chat interface component.
  - Provides a full-featured chat UI with message history.
  - Handles file uploads for document processing.
  - Displays agent responses with suggested actions.
  - Maintains conversation context across messages.
  - Shows loading states and error handling.

#### `src/components/ui`

This sub-directory contains general-purpose UI components provided by `shadcn/ui`, which are styled with Tailwind CSS. These include:

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`
- `textarea.tsx`
- `toast.tsx` & `toaster.tsx`
- And many others that provide the building blocks for the application's interface.

---

### `src/hooks` - Custom React Hooks

- **`use-toast.ts`**: A custom hook for showing "toast" notifications. It provides a `toast()` function that can be called from any component to display messages (e.g., "Extraction Successful").
- **`use-mobile.tsx`**: A utility hook to detect if the user is on a mobile device based on screen width.

---

### `src/lib` - Library & Utility Functions

- **`utils.ts`**: Contains utility functions. The `cn` function is a helper that merges Tailwind CSS classes, making it easier to apply conditional styling.
- **`placeholder-images.json`** & **`placeholder-images.ts`**: These files manage placeholder images for the app. The JSON file defines a list of images, and the TypeScript file exports them as a typed array, ensuring consistent use of placeholders throughout the app.
# nexscan
