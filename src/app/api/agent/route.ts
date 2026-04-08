import { NextRequest, NextResponse } from 'next/server';
import { chatWithNexScanAgent } from '@/ai/flows/nexscan-agent';

/**
 * POST /api/agent
 * 
 * API endpoint for NexScan AI Agent
 * 
 * Request body:
 * {
 *   "message": "User message",
 *   "documentImage": "data:image/jpeg;base64,...", // optional
 *   "extractedData": {...}, // optional
 *   "conversationHistory": [...] // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { message, documentImage, extractedData, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await chatWithNexScanAgent({
      userMessage: message,
      documentImage,
      extractedData,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    agent: 'NexScan AI',
    version: '1.0.0',
    capabilities: [
      'extract',
      'translate',
      'analyze',
      'answer',
      'clarify'
    ]
  });
}
