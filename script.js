/******** CONFIG ********/
const API_URL = "https://script.google.com/macros/s/AKfycbylucpybDEHvu39GZLJ4WQIXWL2MFuVO4QAEqIJUCTtnuoA0NHGOFGp7_P68OMjFObY/exec"; // <-- URL Web App Apps Script
const API_KEY = "BigKeyMaxy1";       // <-- deve combaciare con quello nello script Apps Script

/******** DOM refs ********/
const cameraInput = document.getElementById("cameraInput"); // <input capture>
const galleryInput = document.getElementById("file");       // <input gallery>
const sendBtn      = document.getElementById("sendBtn");
const statusEl     = document.getElementById("status");
const previewEl    = document.getElementById("preview");
const resultEl     = document.getElementById("result");
const commentInput = document.getElementById("commentInput"); // Campo commento
const charCount    = document.getElementById("charCount");   // Contatore caratteri

let imageBase64 = "";   // solo il payload (senza "data:image/...;base64,")

/******** helpers ********/
function showStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.style.color = type === "error" ? "#c1121f" : type === "ok" ? "#1fb980" : "";
}

function setPreviewFromFile(file) {
  const url = URL.createObjectURL(file);
  previewEl.innerHTML = `<img src="${url}" alt="preview">`;
  const reader = new FileReader();
  reader.onloadend = () => {
    const full = reader.result;                // es. "data:image/jpeg;base64,AAAA..."
    imageBase64 = String(full).split(",")[1] || "";
    sendBtn.disabled = !imageBase64;
    showStatus('Image ready. Tap "Extract & Save".');
  };
  reader.readAsDataURL(file);
}

// Aggiorna il contatore dei caratteri
function updateCharCount() {
  const currentLength = commentInput.value.length;
  charCount.textContent = currentLength;
  
  // Cambia colore se si avvicina al limite
  if (currentLength > 450) {
    charCount.style.color = '#c1121f';
  } else if (currentLength > 400) {
    charCount.style.color = '#ff8c00';
  } else {
    charCount.style.color = '#666';
  }
}

/******** events: inputs ********/
cameraInput.addEventListener("change", () => {
  const f = cameraInput.files && cameraInput.files[0];
  if (!f) return;
  setPreviewFromFile(f);
});

galleryInput.addEventListener("change", () => {
  const f = galleryInput.files && galleryInput.files[0];
  if (!f) return;
  setPreviewFromFile(f);
});

// Event listener per il contatore caratteri
commentInput.addEventListener('input', updateCharCount);

/******** send to backend ********/
sendBtn.addEventListener("click", async () => {
  if (!imageBase64) return;
  
  sendBtn.disabled = true;
  resultEl.style.display = "none";
  resultEl.innerHTML = "";
  showStatus("Processing...");
  
  try {
    const res = await fetch('/.netlify/functions/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // qui va bene JSON, è stessa origine
      body: JSON.stringify({
        imageBase64,
        fileName: 'card.jpg',
        comment: commentInput.value.trim() // Aggiungi il commento ai dati inviati
      })
    });
    
    // se per qualche motivo la response non è JSON, evita crash
    let data = {};
    const text = await res.text();
    try { 
      data = JSON.parse(text); 
    } catch { 
      throw new Error(text || "Invalid response"); 
    }
    
    if (!data.ok) throw new Error(data.error || "Unknown error");
    
    const p = data.parsed || {};
    const userComment = commentInput.value.trim();
    
    resultEl.innerHTML = `
      <div><strong>Name</strong>: ${p.full_name || ""}</div>
      <div><strong>Company</strong>: ${p.company || ""}</div>
      <div><strong>Role</strong>: ${p.role || ""}</div>
      <div><strong>Email</strong>: ${p.email || ""}</div>
      <div><strong>Phone</strong>: ${p.phone || ""}</div>
      <div><strong>Website</strong>: ${p.website || ""}</div>
      <div><strong>Address</strong>: ${p.address || ""}</div>
      ${userComment ? `<div><strong>Comment</strong>: ${userComment}</div>` : ''}
    `;
    
    resultEl.style.display = "block";
    showStatus("Saved ✔", "ok");
    
    // Reset dell'interfaccia dopo il salvataggio riuscito
    commentInput.value = '';
    updateCharCount();
    
  } catch (err) {
    console.error(err);
    showStatus(`Error: ${err.message}`, "error");
    alert(err.message || String(err));
  } finally {
    sendBtn.disabled = false;
  }
});

// Inizializza il contatore caratteri al caricamento della pagina
updateCharCount();