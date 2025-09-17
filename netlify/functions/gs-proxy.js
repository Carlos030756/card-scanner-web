// netlify/functions/gs-proxy.js
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzHwxgUQii1Q0vBsDAeLudDkeOSMrYaEQnKsWN5womcqmAEI-Lvc4t6jNP22ur2mrkSlw/exec';
const API_KEY = process.env.GAS_API_KEY || 'BigKeyMaxy1'; // preferibile leggere da env

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function handler(event) {
  // Risponde al preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const body = event.body || '{}';

    const res = await fetch(`${GAS_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: String(err) })
    };
  }
}
