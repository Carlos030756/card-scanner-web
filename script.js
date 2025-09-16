/******** CONFIG ********/
// IMPORTANTE: Cambia questo URL con quello del tuo Google Apps Script deployato
const API_URL = "https://script.google.com/macros/s/AKfycbzHwxgUQii1Q0vBsDAeLudDkeOSMrYaEQnKsWN5womcqmAEI-Lvc4t6jNP22ur2mrkSlw/exec";
const API_KEY = "BigKeyMaxy1";

/******** DOM refs ********/
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("file");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const resultEl = document.getElementById("result");
const commentInput = document.getElementById("commentInput");
const charCount = document.getElementById("charCount");

let imageBase64 = "";

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
    const full = reader.result;
    imageBase64 = String(full).split(",")[1] || "";
    sendBtn.disabled = !imageBase64;
    showStatus('Image ready. Tap "Extract & Save".');
  };
  reader.readAsDataURL(file);
}

function updateCharCount() {
  const currentLength = commentInput.value.length;
  charCount.textContent = currentLength;
  
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

commentInput.addEventListener('input', updateCharCount);

/******** send to backend ********/
sendBtn.addEventListener("click", async () => {
  if (!imageBase64) return;
  
  sendBtn.disabled = true;
  resultEl.style.display = "none";
  resultEl.innerHTML = "";
  showStatus("Processing...");
  
  try {
    // CHIAMATA DIRETTA AL GOOGLE APPS SCRIPT (NON alla funzione Netlify)
    const url = `${API_URL}?key=${API_KEY}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        fileName: 'card.jpg',
        comment: commentInput.value.trim() // Il commento viene inviato
      })
    });
    
    let data = {};
    const text = await res.text();
    try { 
      data = JSON.parse(text); 
    } catch { 
      throw new Error(`Invalid response: ${text}`); 
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
    
    // Reset interfaccia
    commentInput.value = '';
    updateCharCount();
    
  } catch (err) {
    console.error('Error details:', err);
    showStatus(`Error: ${err.message}`, "error");
    alert(`Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
  }
});

// Inizializza contatore caratteri
updateCharCount();