const API_URL = "YOUR_WEBAPP_URL"; // ← qui inserisci l’URL del tuo Apps Script WebApp
const API_KEY = "BigKeyMaxy1";     // deve corrispondere a quello che hai nello script Google

let currentImageBase64 = "";

// Buttons
const btnCamera = document.getElementById("btnCamera");
const btnGallery = document.getElementById("btnGallery");
const fileCamera = document.getElementById("fileCamera");
const fileGallery = document.getElementById("fileGallery");
const sendBtn = document.getElementById("sendBtn");
const resultDiv = document.getElementById("result");

// Open camera
btnCamera.addEventListener("click", () => fileCamera.click());
// Open gallery
btnGallery.addEventListener("click", () => fileGallery.click());

// Handle image selection
[fileCamera, fileGallery].forEach(input => {
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        currentImageBase64 = reader.result.split(",")[1];
        resultDiv.innerHTML = `<p><em>Image ready, press "Extract & Save"</em></p>`;
        sendBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }
  });
});

// Send image to backend
sendBtn.addEventListener("click", async () => {
  if (!currentImageBase64) return;

  resultDiv.innerHTML = `<p><em>Processing...</em></p>`;
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: currentImageBase64,
        fileName: "card.jpg"
      })
    });

    const data = await res.json();

    if (data.ok) {
      const p = data.parsed;
      resultDiv.innerHTML = `
        <p><strong>Name:</strong> ${p.full_name || ""}</p>
        <p><strong>Company:</strong> ${p.company || ""}</p>
        <p><strong>Role:</strong> ${p.role || ""}</p>
        <p><strong>Email:</strong> ${p.email || ""}</p>
        <p><strong>Phone:</strong> ${p.phone || ""}</p>
        <p><strong>Website:</strong> ${p.website || ""}</p>
        <p><strong>Address:</strong> ${p.address || ""}</p>
        <p style="color:green"><strong>Saved ✔</strong></p>
      `;
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red"><strong>Error:</strong> ${err.message}</p>`;
  }

  sendBtn.disabled = false;
});
