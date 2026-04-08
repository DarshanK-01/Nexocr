# NexScan AI Agent - Integration Examples

## Quick Start Examples

### 1. Basic Chat Integration

```typescript
import { chatWithAgent } from '@/app/actions';

async function handleUserMessage(message: string) {
  const result = await chatWithAgent({
    userMessage: message,
  });
  
  if (result.error) {
    console.error('Error:', result.error);
    return;
  }
  
  console.log('Agent:', result.response?.agentResponse);
}

// Usage
await handleUserMessage("Hello, what can you do?");
```

### 2. Document Upload and Extraction

```typescript
async function extractFromDocument(imageFile: File) {
  // Convert file to data URI
  const dataUri = await fileToDataUri(imageFile);
  
  const result = await chatWithAgent({
    userMessage: "Extract data from this document",
    documentImage: dataUri,
  });
  
  if (result.response?.extractedData) {
    console.log('Extracted:', result.response.extractedData);
  }
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 3. Translation Workflow

```typescript
async function translateDocument(
  extractedData: Record<string, string>,
  targetLanguage: string
) {
  const result = await chatWithAgent({
    userMessage: `Translate to ${targetLanguage}`,
    extractedData,
  });
  
  return result.response?.translatedData;
}

// Usage
const hindiData = await translateDocument(extractedData, "Hindi");
```

### 4. Document Analysis

```typescript
async function analyzeDocument(extractedData: Record<string, string>) {
  const result = await chatWithAgent({
    userMessage: "Analyze this document and tell me what action is needed",
    extractedData,
  });
  
  const intelligence = result.response?.intelligence;
  
  if (intelligence) {
    console.log('Domain:', intelligence.domain);
    console.log('Priority:', intelligence.priority.level);
    console.log('Summary:', intelligence.summary);
    console.log('Tags:', intelligence.tags);
  }
  
  return intelligence;
}
```

### 5. Conversational Context

```typescript
const conversationHistory: Array<{role: 'user' | 'agent', message: string}> = [];

async function chat(message: string, documentImage?: string) {
  // Add user message to history
  conversationHistory.push({ role: 'user', message });
  
  const result = await chatWithAgent({
    userMessage: message,
    documentImage,
    conversationHistory,
  });
  
  // Add agent response to history
  if (result.response) {
    conversationHistory.push({
      role: 'agent',
      message: result.response.agentResponse,
    });
  }
  
  return result.response;
}

// Usage - maintains context across messages
await chat("Hello");
await chat("I have a complaint form");
await chat("Extract data from it", imageDataUri);
await chat("What's the priority level?");
```

### 6. REST API Integration

```bash
# Health check
curl http://localhost:3000/api/agent

# Send message
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Extract data from this document",
    "documentImage": "data:image/jpeg;base64,..."
  }'
```

```javascript
// JavaScript/Node.js
async function callAgentAPI(message, documentImage) {
  const response = await fetch('http://localhost:3000/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, documentImage }),
  });
  
  const data = await response.json();
  return data;
}
```

```python
# Python
import requests
import base64

def call_agent_api(message, image_path=None):
    payload = {"message": message}
    
    if image_path:
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode()
            payload["documentImage"] = f"data:image/jpeg;base64,{image_data}"
    
    response = requests.post(
        "http://localhost:3000/api/agent",
        json=payload
    )
    
    return response.json()

# Usage
result = call_agent_api("Extract data", "document.jpg")
print(result["data"]["agentResponse"])
```

### 7. React Component Integration

```tsx
'use client';

import { useState } from 'react';
import { chatWithAgent } from '@/app/actions';

export function DocumentProcessor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(file: File) {
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      
      const response = await chatWithAgent({
        userMessage: "Extract and analyze this document",
        documentImage: dataUri,
      });
      
      setResult(response.response);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      
      {loading && <p>Processing...</p>}
      
      {result && (
        <div>
          <h3>Agent Response:</h3>
          <p>{result.agentResponse}</p>
          
          {result.intelligence && (
            <div>
              <p>Priority: {result.intelligence.priority.level}</p>
              <p>Domain: {result.intelligence.domain}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 8. Webhook Integration

```typescript
// pages/api/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { chatWithAgent } from '@/app/actions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentUrl, action } = req.body;

  // Fetch document from URL
  const imageResponse = await fetch(documentUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64}`;

  // Process with agent
  const result = await chatWithAgent({
    userMessage: action || "Extract and analyze this document",
    documentImage: dataUri,
  });

  res.status(200).json(result);
}
```

### 9. Batch Processing

```typescript
async function processBatchDocuments(images: string[]) {
  const results = [];
  
  for (const imageDataUri of images) {
    const result = await chatWithAgent({
      userMessage: "Extract and analyze",
      documentImage: imageDataUri,
    });
    
    results.push({
      extractedData: result.response?.extractedData,
      intelligence: result.response?.intelligence,
    });
  }
  
  return results;
}

// Usage
const documents = [image1DataUri, image2DataUri, image3DataUri];
const results = await processBatchDocuments(documents);
```

### 10. Custom Domain Handler

```typescript
async function processFinanceDocument(imageDataUri: string) {
  // Extract
  const extractResult = await chatWithAgent({
    userMessage: "Extract data from this financial document",
    documentImage: imageDataUri,
  });
  
  const extractedData = extractResult.response?.extractedData;
  
  // Analyze with finance context
  const analyzeResult = await chatWithAgent({
    userMessage: "Analyze this as a financial document. Check for payment dues and penalties.",
    extractedData,
  });
  
  const intelligence = analyzeResult.response?.intelligence;
  
  // Custom business logic
  if (intelligence?.priority.level === 'RED') {
    // Send alert to finance team
    await sendFinanceAlert(intelligence);
  }
  
  return {
    data: extractedData,
    analysis: intelligence,
  };
}
```

## Environment Setup

```bash
# Install dependencies
npm install

# Set up environment variables
echo "GOOGLE_GENAI_API_KEY=your_key_here" > .env

# Run development server
npm run dev
```

## Testing

```typescript
// test/agent.test.ts
import { chatWithAgent } from '@/app/actions';

describe('NexScan Agent', () => {
  it('should respond to greetings', async () => {
    const result = await chatWithAgent({
      userMessage: "Hello",
    });
    
    expect(result.response?.agentResponse).toBeTruthy();
    expect(result.error).toBeNull();
  });
  
  it('should request image for extraction', async () => {
    const result = await chatWithAgent({
      userMessage: "Extract data",
    });
    
    expect(result.response?.needsMoreInfo).toBe(true);
  });
});
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for API endpoints
2. **Authentication**: Add auth middleware for production use
3. **Error Handling**: Implement comprehensive error handling
4. **Logging**: Add structured logging for debugging
5. **Monitoring**: Set up monitoring for agent performance
6. **Caching**: Cache frequently accessed data
7. **Validation**: Validate all inputs before processing
8. **Security**: Sanitize file uploads and user inputs

## Support

For issues or questions, refer to:
- Main documentation: `docs/nexscan-agent.md`
- API reference: `/api/agent` endpoint
- Chat interface: `/chat` page
