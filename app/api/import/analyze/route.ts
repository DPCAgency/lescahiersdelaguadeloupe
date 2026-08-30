import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Cette route est obsolète. Utilisez /api/import/analyze/start' },
    { status: 410 },
  );
}
