# NexScan AI Agent - Testing Guide

## Manual Testing Checklist

### 1. Setup Verification

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with API key
- [ ] Next.js server running (`npm run dev`)
- [ ] Genkit server running (`npm run genkit:dev`)
- [ ] No console errors on startup

### 2. Chat Interface Tests

#### Basic Interaction
- [ ] Navigate to `/chat`
- [ ] Chat interface loads without errors
- [ ] Welcome message appears
- [ ] Input field is functional
- [ ] Send button is clickable

#### Greeting Test
```
Input: "Hello"
Expected: Friendly greeting + explanation of capabilities
```

#### Help Test
```
Input: "What can you do?"
Expected: List of capabilities (extract, translate, analyze, etc.)
```

### 3. Document Extraction Tests

#### Test 1: Upload Document
- [ ] Click upload button
- [ ] Select an image file
- [ ] Image uploads successfully
- [ ] Agent responds with "extracting data" message
- [ ] Extracted data appears in response
- [ ] Suggested actions appear

#### Test 2: Extraction Command
```
Input: "Extract data from this document" (with uploaded image)
Expected: Structured data extraction with all fields
```

#### Test 3: Missing Image
```
Input: "Extract data"
Expected: Agent asks for document upload
```

### 4. Translation Tests

#### Test 1: Translate to Hindi
```
Prerequisites: Have extracted data
Input: "Translate to Hindi"
Expected: All fields translated to Hindi
```

#### Test 2: Translate to Marathi
```
Prerequisites: Have extracted data
Input: "Translate to Marathi"
Expected: All fields translated to Marathi
```

#### Test 3: Translation Without Data
```
Input: "Translate to Hindi" (no extracted data)
Expected: Agent asks to extract data first
```

### 5. Analysis Tests

#### Test 1: Basic Analysis
```
Prerequisites: Have extracted data
Input: "Analyze this document"
Expected: 
- Domain detected
- Priority assigned (RED/YELLOW/GREEN)
- Summary provided
- Tags generated
- Field explanations
```

#### Test 2: Priority Check
```
Prerequisites: Have extracted data
Input: "Is this urgent?"
Expected: Priority level with explanation
```

#### Test 3: Domain Detection
```
Prerequisites: Have extracted data
Input: "What type of document is this?"
Expected: Domain classification with explanation
```

### 6. Question Answering Tests

#### Test 1: Field Explanation
```
Prerequisites: Have extracted data
Input: "What does complaint number mean?"
Expected: Simple explanation of the field
```

#### Test 2: General Question
```
Prerequisites: Have extracted data
Input: "What should I do with this document?"
Expected: Actionable recommendations
```

### 7. Conversation Context Tests

#### Test 1: Multi-step Workflow
```
Step 1: Upload document
Step 2: "Extract data"
Step 3: "Now translate to Hindi"
Step 4: "Is this urgent?"
Expected: Agent remembers context throughout
```

#### Test 2: Follow-up Questions
```
Step 1: "Analyze this document"
Step 2: "Why is it that priority?"
Expected: Agent references previous analysis
```

### 8. Suggested Actions Tests

- [ ] Suggested action badges appear
- [ ] Badges are clickable
- [ ] Clicking badge sends that action
- [ ] Agent responds appropriately

### 9. Error Handling Tests

#### Test 1: Invalid Image
```
Action: Upload non-image file
Expected: Error message or rejection
```

#### Test 2: Network Error
```
Action: Disconnect internet, send message
Expected: Graceful error message
```

#### Test 3: Large Image
```
Action: Upload very large image (>10MB)
Expected: Appropriate handling or size warning
```

### 10. API Endpoint Tests

#### Test 1: Health Check
```bash
curl http://localhost:9002/api/agent
Expected: 
{
  "status": "ok",
  "agent": "NexScan AI",
  "version": "1.0.0",
  "capabilities": [...]
}
```

#### Test 2: POST Request
```bash
curl -X POST http://localhost:9002/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
Expected: Valid JSON response with agent reply
```

#### Test 3: Invalid Request
```bash
curl -X POST http://localhost:9002/api/agent \
  -H "Content-Type: application/json" \
  -d '{}'
Expected: 400 error with message
```

## Automated Testing

### Unit Tests (Example)

```typescript
// __tests__/agent.test.ts
import { chatWithAgent } from '@/app/actions';

describe('NexScan Agent', () => {
  it('should respond to greetings', async () => {
    const result = await chatWithAgent({
      userMessage: "Hello",
    });
    
    expect(result.response).toBeTruthy();
    expect(result.error).toBeNull();
    expect(result.response?.agentResponse).toContain('NexScan');
  });

  it('should detect extract intent', async () => {
    const result = await chatWithAgent({
      userMessage: "Extract data from document",
    });
    
    expect(result.response?.actionTaken).toBe('extract');
    expect(result.response?.needsMoreInfo).toBe(true);
  });

  it('should handle translation requests', async () => {
    const mockData = {
      branch: "Test Branch",
      complaintNo: "123",
    };

    const result = await chatWithAgent({
      userMessage: "Translate to Hindi",
      extractedData: mockData,
    });
    
    expect(result.response?.actionTaken).toBe('translate');
    expect(result.response?.translatedData).toBeTruthy();
  });
});
```

### Integration Tests (Example)

```typescript
// __tests__/integration.test.ts
import { chatWithAgent } from '@/app/actions';

describe('End-to-End Workflow', () => {
  it('should complete full document processing', async () => {
    // Step 1: Extract
    const extractResult = await chatWithAgent({
      userMessage: "Extract data",
      documentImage: mockImageDataUri,
    });
    
    expect(extractResult.response?.extractedData).toBeTruthy();
    
    // Step 2: Translate
    const translateResult = await chatWithAgent({
      userMessage: "Translate to Hindi",
      extractedData: extractResult.response?.extractedData,
    });
    
    expect(translateResult.response?.translatedData).toBeTruthy();
    
    // Step 3: Analyze
    const analyzeResult = await chatWithAgent({
      userMessage: "Analyze this",
      extractedData: extractResult.response?.extractedData,
    });
    
    expect(analyzeResult.response?.intelligence).toBeTruthy();
    expect(analyzeResult.response?.intelligence?.priority).toBeTruthy();
  });
});
```

## Performance Testing

### Response Time Tests

| Operation | Expected Time | Acceptable Range |
|-----------|---------------|------------------|
| Greeting | < 1s | 0.5s - 2s |
| Extraction | < 5s | 3s - 10s |
| Translation | < 3s | 2s - 6s |
| Analysis | < 3s | 2s - 6s |
| Q&A | < 2s | 1s - 4s |

### Load Testing

```bash
# Using Apache Bench
ab -n 100 -c 10 -p request.json -T application/json \
  http://localhost:9002/api/agent
```

Expected:
- 95% of requests complete successfully
- Average response time < 5s
- No server crashes

## Test Data

### Sample Documents

1. **Technical Complaint Form**
   - Should detect: technical domain
   - Expected priority: YELLOW or RED (depending on severity)

2. **Financial Invoice**
   - Should detect: finance domain
   - Expected priority: YELLOW (if payment due)

3. **Medical Report**
   - Should detect: medical domain
   - Expected priority: RED (if abnormal values)

### Sample Conversations

#### Conversation 1: Complete Workflow
```
User: "Hello"
Agent: [greeting]
User: [uploads document]
Agent: [extracts data]
User: "Translate to Hindi"
Agent: [translates]
User: "Is this urgent?"
Agent: [provides priority]
```

#### Conversation 2: Question Flow
```
User: "What can you do?"
Agent: [explains capabilities]
User: [uploads document]
Agent: [extracts]
User: "What does BCCD mean?"
Agent: [explains field]
```

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Alt text for images
- [ ] ARIA labels present

## Security Testing

- [ ] API key not exposed in client
- [ ] Input validation working
- [ ] File upload restrictions enforced
- [ ] XSS prevention working
- [ ] CSRF protection (if applicable)

## Regression Testing

After any code changes, verify:
- [ ] All existing features still work
- [ ] No new console errors
- [ ] Performance hasn't degraded
- [ ] UI remains responsive
- [ ] Error handling still works

## Bug Reporting Template

```markdown
**Bug Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Node version: [e.g., 18.17.0]

**Screenshots:**
[If applicable]

**Console Errors:**
[Any error messages]
```

## Test Results Log

| Date | Tester | Test Suite | Pass/Fail | Notes |
|------|--------|------------|-----------|-------|
| | | | | |
| | | | | |

## Continuous Testing

### Pre-commit Checks
```bash
# Run before committing
npm run lint
npm run type-check
npm run test
```

### Pre-deployment Checks
```bash
# Run before deploying
npm run build
npm run test:e2e
npm run test:integration
```

## Known Issues

Document any known issues here:

1. [Issue description]
   - Workaround: [if any]
   - Status: [Open/In Progress/Fixed]

## Testing Resources

- **Test Images**: `docs/test-images/` (create this folder)
- **Mock Data**: `docs/mock-data.json` (create this file)
- **Test Scripts**: `scripts/test-agent.sh` (create this file)

---

**Remember**: Testing is ongoing. Add new test cases as features are added or bugs are discovered.
