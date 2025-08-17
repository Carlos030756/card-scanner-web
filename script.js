/******** CONFIG ********/
const API_URL = "https://script.google.com/macros/s/AKfycbxGpl47I6Yaf_oov_Vrzowjt9Ld6mFihPyx6Q4AjAYEyc2hWN48T6nT-nm3p5XYJoCb1Q/exec"; // <-- URL Web App Apps Script
const API_KEY = "BigKeyMaxy1";       // <-- deve combaciare con quello nello script Apps Script

/******** DOM refs ********/
const cameraInput = document.getElementById("cameraInput"); // <input capture>
const galleryInput = document.getElementById("file");       // <input gallery>
const sendBtn      = document.getElementById("sendBtn");
const statusEl     = document.getElementById("status");
const previewEl    = document.getElementById("preview");
const resultEl     = document.getElementById("result");

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

/******** send to backend ********/
sendBtn.addEventListener("click", async () => {
  if (!imageBase64) return;

  sendBtn.disabled = true;
  resultEl.style.display = "none";
  resultEl.innerHTML = "";
  showStatus("Processing...");

  try {
    const res = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        fileName: "card.jpg" // va bene anche per PNG, il backend rileva il mime
      })
    });

    // se per qualche motivo la response non è JSON, evita crash
    let data = {};
    const text = await res.text();
    try { data = JSON.parse(text); } catch { throw new Error(text || "Invalid response"); }

    if (!data.ok) throw new Error(data.error || "Unknown error");

    const p = data.parsed || {};
    resultEl.innerHTML = `
      <div><strong>Name</strong>: ${p.full_name || ""}</div>
      <div><strong>Company</strong>: ${p.company || ""}</div>
      <div><strong>Role</strong>: ${p.role || ""}</div>
      <div><strong>Email</strong>: ${p.email || ""}</div>
      <div><strong>Phone</strong>: ${p.phone || ""}</div>
      <div><strong>Website</strong>: ${p.website || ""}</div>
      <div><strong>Address</strong>: ${p.address || ""}</div>
    `;
    resultEl.style.display = "block";
    showStatus("Saved ✔", "ok");
  } catch (err) {
    console.error(err);
    showStatus(`Error: ${err.message}`, "error");
    alert(err.message || String(err));
  } finally {
    sendBtn.disabled = false;
  }
});
