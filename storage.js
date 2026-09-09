// storage.js
// Gemeinsame Helper zum Lesen/Schreiben der Rätsel-Schritte und der
// Darstellungs-Einstellungen im localStorage des Browsers. Genutzt von
// index.html (Spiel) und config.html (Verwaltung).
//
// Ein Rätsel-Schritt ist ein Objekt:
//   { id, code, title, description, image, audio }
// - id: interne, stabile Kennung (unabhängig vom Code, damit sich der Code
//   nachträglich ändern lässt ohne die Position zu verlieren)
// - code: der Code, der DIESEN Schritt löst
// - title/description/image/audio: benennen/beschreiben DIESEN Schritt
//   selbst (self-naming) - werden im Spiel angezeigt, sobald der Code des
//   VORHERIGEN Schritts gelöst wird (steps[i] beschreibt sich selbst,
//   wird aber getriggert durch das Lösen von steps[i-1])
//
// Die Reihenfolge im Array entspricht der Reihenfolge im Spiel (Config-Seite
// 3 = steps[0], Seite 4 = steps[1], ...). Für steps[0] (erstes Rätsel) gibt
// es keinen "vorherigen Code", der die Angaben freischaltet - der Fundort
// muss z.B. über die Willkommen-Seite kommuniziert werden.

const STEPS_KEY = 'detektivspiel-steps-v1';
const LEGACY_CODES_KEY = 'detektivspiel-codes-v1'; // altes Format vor der Schritte-Ansicht
const SETTINGS_KEY = 'detektivspiel-settings-v1';
const PROGRESS_KEY = 'detektivspiel-progress-v1';

const DEFAULT_SETTINGS = {
  theme: 'noir',
  background: 'none',
  wrongSound: 'soft',
  correctSound: 'chime',
  // Landing Page (landing.html): eigenständige Begrüßungsseite als Ziel
  // eines QR-Codes, mit Link weiter zum eigentlichen Spiel.
  landingTitle: '🎉 Willkommen zum Detektiv-Spiel!',
  landingText: 'Schön, dass du dabei bist! Finde die versteckten Hinweise und gib die Codes ein, die du entdeckst, um den Fall zu lösen.',
  landingImage: null,
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

// Fortschritt: Anzahl der bereits in Reihenfolge gelösten Rätsel-Schritte.
// steps[progress] ist der als Nächstes erwartete Code; frühere Codes
// gelten als "schon gelöst", spätere als "noch gesperrt".
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (e) {
    console.error('Konnte Fortschritt nicht laden:', e);
    return 0;
  }
}

function saveProgress(count) {
  localStorage.setItem(PROGRESS_KEY, String(count));
}

function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
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
