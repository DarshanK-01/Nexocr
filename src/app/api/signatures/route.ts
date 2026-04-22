import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.SIGNATURE_BACKEND_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/detect-signatures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    // Backend not running — return graceful empty result
    console.warn('[signatures] Backend unreachable:', e.message);
    return NextResponse.json({ count: 0, signatures: [], annotatedBase64: '' });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: 'offline', modelLoaded: false });
  }
}
