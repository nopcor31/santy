export async function parseApiResponse<T = any>(response: Response): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok) {
        return { ok: true, data };
      } else {
        return { ok: false, error: data?.error || `Error HTTP ${response.status}` };
      }
    } else {
      const text = await response.text();
      const cleanSnippet = text.replace(/<[^>]*>/g, '').trim().slice(0, 200);
      return {
        ok: false,
        error: response.ok
          ? 'El servidor devolvió una respuesta no válida en formato JSON.'
          : `Error en el servidor (${response.status}): ${cleanSnippet || 'Respuesta HTML inesperada.'}`
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      error: `Error al procesar la respuesta del servidor: ${err.message}`
    };
  }
}
