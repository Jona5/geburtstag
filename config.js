// config.js - Logik für config.html (Verwaltung der Codes)
//
// ADMIN_PASSPHRASE ist nur eine Bremse gegen neugierige Gäste, kein echter
// Schutz: Das Repo ist öffentlich, jeder kann den Quelltext lesen. Einfach
// hier ändern, bevor du das Spiel aufsetzt.
const ADMIN_PASSPHRASE = 'geburtstag';

document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('gate');
  const panel = document.getElementById('panel');
  const gateForm = document.getElementById('gate-form');
  const gateInput = document.getElementById('gate-input');
  const gateError = document.getElementById('gate-error');

  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (gateInput.value === ADMIN_PASSPHRASE) {
      gate.hidden = true;
      panel.hidden = false;
      renderList();
    } else {
      gateError.hidden = false;
      gateInput.value = '';
    }
  });

  const list = document.getElementById('entry-list');
  const addForm = document.getElementById('add-form');
  const newCode = document.getElementById('new-code');
  const newText = document.getElementById('new-text');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const statusEl = document.getElementById('status');
  let statusTimer = null;

  function renderList() {
    const codes = loadCodes();
    const entries = Object.entries(codes).sort(([a], [b]) => a.localeCompare(b));

    list.innerHTML = '';
    if (entries.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Codes angelegt.</p>';
      return;
    }

    for (const [code, text] of entries) {
      const row = document.createElement('div');
      row.className = 'entry-row';

      const codeEl = document.createElement('div');
      codeEl.className = 'entry-code';
      codeEl.textContent = code;

      const textarea = document.createElement('textarea');
      textarea.className = 'entry-text';
      textarea.rows = 2;
      textarea.value = text;
      textarea.addEventListener('change', () => {
        const current = loadCodes();
        current[code] = textarea.value;
        saveCodes(current);
        flashStatus('Gespeichert.');
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.type = 'button';
      deleteBtn.title = 'Löschen';
      deleteBtn.textContent = '🗑';
      deleteBtn.addEventListener('click', () => {
        if (!confirm(`Code ${code} wirklich löschen?`)) return;
        const current = loadCodes();
        delete current[code];
        saveCodes(current);
        renderList();
        flashStatus('Gelöscht.');
      });

      row.appendChild(codeEl);
      row.appendChild(textarea);
      row.appendChild(deleteBtn);
      list.appendChild(row);
    }
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = newCode.value.trim();
    const text = newText.value.trim();

    if (!/^\d{4}$/.test(code)) {
      flashStatus('Der Code muss aus genau 4 Ziffern bestehen.', true);
      return;
    }
    if (!text) {
      flashStatus('Bitte einen Text eingeben.', true);
      return;
    }

    const codes = loadCodes();
    if (codes[code] !== undefined && !confirm(`Code ${code} existiert bereits. Überschreiben?`)) {
      return;
    }

    codes[code] = text;
    saveCodes(codes);
    newCode.value = '';
    newText.value = '';
    renderList();
    flashStatus('Hinzugefügt.');
  });

  exportBtn.addEventListener('click', () => {
    const codes = loadCodes();
    const blob = new Blob([JSON.stringify(codes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detektivspiel-codes.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener('change', () => {
    const file = importInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
          throw new Error('Ungültiges Format');
        }
        const codes = { ...loadCodes(), ...imported };
        saveCodes(codes);
        renderList();
        flashStatus('Import erfolgreich (vorhandene Codes wurden überschrieben).');
      } catch (err) {
        flashStatus('Import fehlgeschlagen: ' + err.message, true);
      }
      importInput.value = '';
    };
    reader.readAsText(file);
  });

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Wirklich ALLE Codes löschen?')) return;
    saveCodes({});
    renderList();
    flashStatus('Alle Codes gelöscht.');
  });

  function flashStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', isError);
    statusEl.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.hidden = true; }, 2500);
  }
});
