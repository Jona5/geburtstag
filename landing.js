// landing.js - Logik für landing.html (Begrüßungsseite als QR-Code-Ziel)

document.addEventListener('DOMContentLoaded', () => {
  const settings = loadSettings();

  document.getElementById('landing-title').textContent = settings.landingTitle;
  document.getElementById('landing-text').textContent = settings.landingText;

  const image = document.getElementById('landing-image');
  if (settings.landingImage) {
    image.src = settings.landingImage;
    image.hidden = false;
  }
});
