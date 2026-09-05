// storage.js
// Gemeinsame Helper zum Lesen/Schreiben der Code->Text-Zuordnung im localStorage
// des Browsers. Genutzt von index.html (Spiel) und config.html (Verwaltung).

const STORAGE_KEY = 'detektivspiel-codes-v1';

function loadCodes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Konnte Codes nicht laden:', e);
    return {};
  }
}

function saveCodes(codes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}
