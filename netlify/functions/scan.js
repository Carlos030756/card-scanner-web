exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { imageBase64, fileName } = JSON.parse(event.body || '{}');
    if (!imageBase64) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'imageBase64 mancante' })
      };
    }

    const url = process.env.APPS_SCRIPT_URL; // es: https://script.google.com/macros/s/.../exec
    const key = process.env.APPS_SCRIPT_KEY; // es: b1gL0ngS3cr3t_2025_Dino!
    if (!url || !key) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Config mancante' })
      };
    }

    const resp = await fetch(`${url}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        fileName: fileName || 'biglietto.jpg'
      })
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Risposta non JSON', raw: text.slice(0, 200) })
      };
    }

    return {
      statusCode: resp.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
};
