// theme.js - wendet die gespeicherten Darstellungs-Einstellungen
// (Farbschema + Hintergrundbild) auf die aktuelle Seite an. Wird von
// index.html und config.html eingebunden.

const BACKGROUND_CLASSES = [
  'bg-corkboard', 'bg-paper', 'bg-fog-city', 'bg-blueprint', 'bg-police-tape',
  'bg-mesh-aurora', 'bg-gradient-dusk', 'bg-dot-grid', 'bg-glow-orbs', 'bg-wave-lines',
];

function applyPresentation() {
  const settings = loadSettings();
  document.documentElement.setAttribute('data-theme', settings.theme);

  document.body.classList.remove(...BACKGROUND_CLASSES);
  if (settings.background && settings.background !== 'none') {
    document.body.classList.add(settings.background);
  }
}

document.addEventListener('DOMContentLoaded', applyPresentation);
