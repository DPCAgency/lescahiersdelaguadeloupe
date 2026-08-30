export async function safeJsonFetch(
  url: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const resp = await fetch(url, options);
  const contentType = resp.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await resp.text();
    return {
      ok: false,
      status: resp.status,
      data: null,
      error: `Réponse non-JSON (${resp.status}) depuis ${url}: ${text.slice(0, 200)}`,
    };
  }

  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}
