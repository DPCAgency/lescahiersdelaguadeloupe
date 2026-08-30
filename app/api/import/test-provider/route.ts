import { NextResponse } from 'next/server';
import { getProviderMode } from '@/lib/imports/provider-factory';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const mode = getProviderMode();

  if (mode === 'mock') {
    return NextResponse.json({
      available: true,
      mode: 'mock',
      message: 'Service disponible (mode simulation)',
    });
  }

  if (mode === 'openai') {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    try {
      const resp = await fetch(`${url}/functions/v1/openai-vision?action=health`, {
        headers: { 'Authorization': `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const data = await resp.json() as { available?: boolean; model?: string };
        return NextResponse.json({
          available: data.available ?? false,
          mode: 'openai',
          message: data.available ? 'Service disponible' : 'Service indisponible',
        });
      }

      return NextResponse.json({
        available: false,
        mode: 'openai',
        message: `Service indisponible (${resp.status})`,
      });
    } catch {
      return NextResponse.json({
        available: false,
        mode: 'openai',
        message: 'Service indisponible — erreur de connexion',
      });
    }
  }

  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    return NextResponse.json({
      available: false,
      mode: 'azure',
      message: 'Service indisponible — credentials manquantes',
    });
  }

  try {
    const testUrl = `${endpoint}/documentintelligence/documentModels?api-version=2024-11-30`;
    const resp = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': key },
      signal: AbortSignal.timeout(10000),
    });

    if (resp.ok || resp.status === 404) {
      return NextResponse.json({
        available: true,
        mode: 'azure',
        message: 'Service disponible',
      });
    }

    return NextResponse.json({
      available: false,
      mode: 'azure',
      message: `Service indisponible (${resp.status})`,
    });
  } catch {
    return NextResponse.json({
      available: false,
      mode: 'azure',
      message: 'Service indisponible — erreur de connexion',
    });
  }
}
