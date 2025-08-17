// netlify/functions/scan.js
export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { APPSSCRIPT_URL, API_KEY } = process.env;
    if (!APPSSCRIPT_URL) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Missing APPSSCRIPT_URL env var' }) };
    }

    // Il client ci manda JSON (imageBase64, fileName)
    const bodyIn = event.body || '{}';

    // Forward verso Apps Script (server-side: niente CORS)
    const upstream = await fetch(`${APPSSCRIPT_URL}?key=${encodeURIComponent(API_KEY || '')}`, {
      method: 'POST',
      // Importante: text/plain per evitare preflight inutili lato GAS
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyIn
    });

    const text = await upstream.text(); // potrebbe essere JSON o errore testuale

    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err) })
    };
  }
}
