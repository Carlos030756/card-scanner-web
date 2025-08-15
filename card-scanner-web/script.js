const fileInput = document.getElementById('file');
const sendBtn = document.getElementById('sendBtn');
const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');
const result = document.getElementById('result');

let imageBase64 = null;

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) { imageBase64 = null; sendBtn.disabled = true; preview.innerHTML = ''; return; }

  // anteprima
  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${url}" alt="preview">`;

  // riduci un po' la risoluzione lato client per upload più rapido
  imageBase64 = await toBase64Resized(file, 1600, 0.85);
  sendBtn.disabled = !imageBase64;
});

sendBtn.addEventListener('click', async () => {
  if (!imageBase64) return;
  sendBtn.disabled = true;
  statusEl.textContent = 'Elaborazione…';
  result.style.display = 'none';

  try {
    const resp = await fetch('/.netlify/functions/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // semplice: nessun CORS perché chiamiamo la function sullo STESSO dominio
      body: JSON.stringify({ imageBase64, fileName: 'biglietto.jpg' })
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'Errore');

    const p = data.parsed || {};
    result.innerHTML = `
      <div><strong>Nome</strong>: ${p.full_name || ''}</div>
      <div><strong>Azienda</strong>: ${p.company || ''}</div>
      <div><strong>Ruolo</strong>: ${p.role || ''}</div>
      <div><strong>Email</strong>: ${p.email || ''}</div>
      <div><strong>Telefono</strong>: ${p.phone || ''}</div>
      <div><strong>Website</strong>: ${p.website || ''}</div>
      <div><strong>Indirizzo</strong>: ${p.address || ''}</div>
    `;
    result.style.display = 'block';
    statusEl.textContent = 'Salvato ✅';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Errore ❌';
    alert(String(err.message || err));
  } finally {
    sendBtn.disabled = false;
  }
});

// Utility: ridimensiona e converte a base64
async function toBase64Resized(file, maxWidth = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
  const b64 = await blobToBase64(blob);
  return b64.split(',')[1]; // togli "data:image/jpeg;base64,"
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
