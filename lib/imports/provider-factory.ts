import type { DocumentAnalysisProvider } from './types';
import { MockDocumentAnalysisProvider } from './mock-provider';
import { AzureDocumentAnalysisProvider } from './azure-provider';
import { OpenAIVisionProvider } from './openai-provider';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export type ProviderMode = 'mock' | 'azure' | 'openai';

export function getAnalysisProvider(): DocumentAnalysisProvider {
  const configured = (process.env.DOCUMENT_ANALYSIS_PROVIDER ?? 'mock') as ProviderMode;
  const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (configured === 'azure' && azureEndpoint && azureKey) {
    return new AzureDocumentAnalysisProvider(azureEndpoint, azureKey);
  }

  if (configured === 'openai' && openaiKey) {
    return new OpenAIVisionProvider(openaiKey);
  }

  return new MockDocumentAnalysisProvider();
}

export function getProviderMode(): ProviderMode {
  const configured = (process.env.DOCUMENT_ANALYSIS_PROVIDER ?? 'mock') as ProviderMode;
  const azureEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const azureKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (configured === 'azure' && azureEndpoint && azureKey) {
    return 'azure';
  }

  if (configured === 'openai' && openaiKey) {
    return 'openai';
  }

  return 'mock';
}
