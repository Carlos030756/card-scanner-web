// netlify/functions/scan.js
export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    // Fallback multipli per NON rimanere bloccati se il nome è diverso
    const env = process.env;
    const appscriptUrl =
      env.APPS_SCRIPT_URL || env.APPSSCRIPT_URL || env.APPS_SCRIPT || env.APPSSCRIPT;
    const apiKey =
      env.API_KEY || env.APPS_SCRIPT_KEY || env.APPSSCRIPT_KEY || '';

    if (!appscriptUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: 'Missing APPS_SCRIPT_URL env var' })
      };
    }

    // Log non sensibili (lunghezze) per capire se le env ci sono
    console.log('scan fn: url ok, key length =', apiKey ? apiKey.length : 0);

    const bodyIn = event.body || '{}';
    
    // Parsing del body per aggiungere log sui commenti (opzionale per debug)
    try {
      const bodyData = JSON.parse(bodyIn);
      if (bodyData.comment) {
        console.log('Comment included, length:', bodyData.comment.length);
      }
    } catch (e) {
      // Se non è JSON valido, continua comunque
      console.log('Body parsing failed (continuing anyway)');
    }

    // Forward server-side verso Apps Script (niente CORS dal browser)
    const upstream = await fetch(`${appscriptUrl}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight su GAS
      body: bodyIn // Inoltra tutto il body, incluso il commento
    });

    const text = await upstream.text();
    
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
    
  } catch (err) {
    console.error(err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ ok: false, error: String(err) }) 
    };
  }
}