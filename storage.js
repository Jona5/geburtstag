// storage.js
// Gemeinsame Helper zum Lesen/Schreiben der Rätsel-Schritte und der
// Darstellungs-Einstellungen im localStorage des Browsers. Genutzt von
// index.html (Spiel) und config.html (Verwaltung).
//
// Ein Rätsel-Schritt ist ein Objekt:
//   { id, code, title, description, audio }
// - id: interne, stabile Kennung (unabhängig vom Code, damit sich der Code
//   nachträglich ändern lässt ohne die Position zu verlieren)
// - code: der einzugebende Code (leer, solange das Rätsel noch nicht
//   fertig konfiguriert ist)
// - title/description: Überschrift + Hinweistext des NÄCHSTEN Rätsels,
//   die angezeigt werden, wenn dieser Code richtig eingegeben wird
// - audio: data-URL einer aufgenommenen Sprachnachricht, oder null
//
// Die Reihenfolge im Array entspricht der Reihenfolge im Spiel (Config-Seite
// 2 = steps[0], Seite 3 = steps[1], ...).

const STEPS_KEY = 'detektivspiel-steps-v1';
const LEGACY_CODES_KEY = 'detektivspiel-codes-v1'; // altes Format vor der Schritte-Ansicht
const SETTINGS_KEY = 'detektivspiel-settings-v1';

const DEFAULT_SETTINGS = {
  theme: 'noir',
  background: 'none',
  wrongSound: 'soft',
  correctSound: 'chime',
  gameTitle: '🕵️ Akte des Falls',
  gameSubtitle: 'Gib den Code ein, den du gefunden hast.',
  wrongMessage: "❌ Dieser Code ist unbekannt. Versuch's nochmal.",
  // Dedizierte Abschluss-Seite: wird zusätzlich angezeigt, wenn der Code
  // des letzten konfigurierten Rätsel-Schritts richtig eingegeben wird.
  endTitle: '🎉 Fall gelöst!',
  endText: 'Herzlichen Glückwunsch, Detektiv! Du hast alle Rätsel gelöst und den Fall abgeschlossen.',
  endImage: null,
};

function makeStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Wandelt das alte Format ({ code: entry, ... } ohne Reihenfolge) einmalig
// in die neue Schritte-Liste um, falls noch keine Schritte-Liste existiert.
function migrateLegacyCodes() {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_CODES_KEY);
    if (!legacyRaw) return [];
    const legacyCodes = JSON.parse(legacyRaw);
    const codeKeys = Object.keys(legacyCodes).sort((a, b) => a.localeCompare(b));

    const steps = codeKeys.map((code) => {
      const entry = legacyCodes[code];
      const isObj = entry && typeof entry === 'object';
      return {
        id: makeStepId(),
        code,
        title: isObj ? (entry.title || '') : '',
        description: isObj
          ? (entry.description !== undefined ? entry.description : (entry.text || ''))
          : (entry || ''),
        audio: isObj ? (entry.audio || null) : null,
        image: isObj ? (entry.image || null) : null,
      };
    });

    if (steps.length > 0) saveSteps(steps);
    return steps;
  } catch (e) {
    console.error('Migration alter Codes fehlgeschlagen:', e);
    return [];
  }
}

function loadSteps() {
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Konnte Rätsel-Schritte nicht laden:', e);
  }
  return migrateLegacyCodes();
}

function saveSteps(steps) {
  localStorage.setItem(STEPS_KEY, JSON.stringify(steps));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    console.error('Konnte Einstellungen nicht laden:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Wandelt eine data-URL in eine blob-URL um. Wichtig für Sprachnachrichten:
// Safari/WebKit kann von MediaRecorder aufgenommenes, fragmentiertes MP4
// nicht von einer data-URL abspielen (Dauer bleibt "Infinity", kein Sound),
// wohl aber von einer blob-URL desselben Inhalts. Andere Browser spielen
// data-URLs zwar auch ab, aber der Umweg über blob: schadet dort nicht.
async function dataUrlToObjectUrl(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
