import { NextResponse } from 'next/server';
import { keyManager } from '@/lib/gemini-key-manager';

export async function GET() {
  const keys = keyManager.getStatus();
  return NextResponse.json({ status: 'ok', keyCount: keys.length, keys });
}
