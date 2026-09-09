// config.js - Logik für config.html (Assistent: Willkommen-Seite + je eine
// Seite pro Rätsel, analog zum Ablauf des Spiels)
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
      renderCurrentStep();
    } else {
      gateError.hidden = false;
      gateInput.value = '';
    }
  });

  const stepNav = document.getElementById('step-nav');
  const stepLanding = document.getElementById('step-landing');
  const stepWelcome = document.getElementById('step-welcome');
  const stepPuzzleContainer = document.getElementById('step-puzzle-container');
  const stepFinale = document.getElementById('step-finale');
  const prevStepBtn = document.getElementById('prev-step-btn');
  const nextStepBtn = document.getElementById('next-step-btn');
  const stepIndicator = document.getElementById('step-indicator');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const resetProgressBtn = document.getElementById('reset-progress-btn');
  const statusEl = document.getElementById('status');
  let statusTimer = null;

  // currentStepIndex: 0 = Willkommen-Seite, k (>=1) = Rätsel steps[k - 1]
  let currentStepIndex = 0;

  // --- Sprachnachrichten-Aufnahme (gemeinsam für alle Rätsel-Seiten) ---

  function pickMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    if (!window.MediaRecorder) return '';
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidate)) return candidate;
    }
    return '';
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Baut eine kleine Aufnehmen/Abspielen/Löschen-UI in `container`.
  // `initialAudio` ist eine vorhandene data-URL oder null.
  // `onChange(dataUrlOrNull)` wird bei jeder Änderung aufgerufen.
  function attachRecorder(container, initialAudio, onChange) {
    let audio = initialAudio || null;
    let mediaRecorder = null;
    let stream = null;
    let chunks = [];
    let previewUrl = null;

    function releasePreviewUrl() {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
    }

    function renderIdle() {
      releasePreviewUrl();
      container.innerHTML = '';
      const row = document.createElement('div');
      row.className = 'recorder-row';

      const recBtn = document.createElement('button');
      recBtn.type = 'button';
      recBtn.className = 'btn btn-secondary';
      recBtn.textContent = audio ? '🎤 Neu aufnehmen' : '🎤 Sprachnachricht aufnehmen';
      recBtn.addEventListener('click', startRecording);
      row.appendChild(recBtn);

      if (audio) {
        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        row.appendChild(audioEl);

        // Über eine blob-URL statt direkt der data-URL laden: Safari kann
        // von MediaRecorder aufgenommenes, fragmentiertes MP4 sonst nicht
        // abspielen (Dauer bleibt "Infinity", kein Ton).
        dataUrlToObjectUrl(audio)
          .then((url) => {
            previewUrl = url;
            audioEl.src = url;
          })
          .catch((err) => {
            console.error('Vorschau konnte nicht geladen werden:', err);
            audioEl.src = audio;
          });

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-secondary';
        clearBtn.title = 'Sprachnachricht entfernen';
        clearBtn.textContent = '🗑';
        clearBtn.addEventListener('click', () => {
          audio = null;
          onChange(null);
          renderIdle();
        });
        row.appendChild(clearBtn);
      }

      container.appendChild(row);
    }

    function renderRecording() {
      container.innerHTML = '';
      const row = document.createElement('div');
      row.className = 'recorder-row';

      const label = document.createElement('span');
      label.className = 'recording-label';
      label.textContent = '⏺ Aufnahme läuft...';

      const stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'btn';
      stopBtn.textContent = '⏹ Stop';
      stopBtn.addEventListener('click', () => mediaRecorder && mediaRecorder.stop());

      row.appendChild(label);
      row.appendChild(stopBtn);
      container.appendChild(row);
    }

    async function startRecording() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        alert('Mikrofon-Zugriff wurde verweigert oder ist nicht verfügbar.');
        return;
      }

      const mimeType = pickMimeType();
      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunks = [];

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        audio = await blobToDataUrl(blob);
        onChange(audio);
        renderIdle();
      });

      mediaRecorder.start();
      renderRecording();
    }

    renderIdle();
  }

  // --- Bild-Upload (gemeinsam für alle Rätsel-Seiten) ---

  // Verkleinert/komprimiert ein ausgewähltes Bild vor dem Speichern, damit
  // localStorage (typisch 5-10 MB pro Seite) nicht überläuft - Fotos direkt
  // vom Handy können sonst mehrere MB groß sein.
  function resizeImageFile(file, maxDim = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
      img.src = objectUrl;
    });
  }

  // Baut eine kleine Auswählen/Vorschau/Löschen-UI in `container`.
  // `initialImage` ist eine vorhandene data-URL oder null.
  // `onChange(dataUrlOrNull)` wird bei jeder Änderung aufgerufen.
  function attachImagePicker(container, initialImage, onChange) {
    let image = initialImage || null;

    function render() {
      container.innerHTML = '';
      const row = document.createElement('div');
      row.className = 'recorder-row';

      const pickLabel = document.createElement('label');
      pickLabel.className = 'btn btn-secondary';
      pickLabel.style.cursor = 'pointer';
      pickLabel.textContent = image ? '🖼️ Anderes Bild wählen' : '🖼️ Bild wählen';

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.hidden = true;
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        try {
          image = await resizeImageFile(file);
          onChange(image);
          render();
        } catch (err) {
          console.error('Bild konnte nicht verarbeitet werden:', err);
          alert('Dieses Bild konnte nicht geladen werden.');
        }
      });
      pickLabel.appendChild(fileInput);
      row.appendChild(pickLabel);

      if (image) {
        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.src = image;
        row.appendChild(preview);

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-secondary';
        clearBtn.title = 'Bild entfernen';
        clearBtn.textContent = '🗑';
        clearBtn.addEventListener('click', () => {
          image = null;
          onChange(null);
          render();
        });
        row.appendChild(clearBtn);
      }

      container.appendChild(row);
    }

    render();
  }

  // --- Navigation zwischen den Seiten ---

  function goToStep(index) {
    currentStepIndex = index;
    renderCurrentStep();
  }

  // Seiten-Reihenfolge: 0 = Landing Page, 1 = Willkommen,
  // 2..steps.length+1 = je ein Rätsel, steps.length+2 = Finale.
  function renderStepNav(steps, finaleIndex) {
    stepNav.innerHTML = '';

    const landingPill = document.createElement('button');
    landingPill.type = 'button';
    landingPill.className = 'step-pill' + (currentStepIndex === 0 ? ' selected' : '');
    landingPill.textContent = '📱';
    landingPill.title = 'Seite 1: Landing Page';
    landingPill.addEventListener('click', () => goToStep(0));
    stepNav.appendChild(landingPill);

    const welcomePill = document.createElement('button');
    welcomePill.type = 'button';
    welcomePill.className = 'step-pill' + (currentStepIndex === 1 ? ' selected' : '');
    welcomePill.textContent = '👋';
    welcomePill.title = 'Seite 2: Willkommen';
    welcomePill.addEventListener('click', () => goToStep(1));
    stepNav.appendChild(welcomePill);

    steps.forEach((step, i) => {
      const pageIndex = i + 2;
      const pill = document.createElement('button');
      pill.type = 'button';
      let cls = 'step-pill';
      if (currentStepIndex === pageIndex) cls += ' selected';
      if (!step.code) cls += ' incomplete';
      pill.className = cls;
      pill.textContent = String(i + 1);
      pill.title = step.code ? `Rätsel ${i + 1}: Code ${step.code}` : `Rätsel ${i + 1} (noch kein Code)`;
      pill.addEventListener('click', () => goToStep(pageIndex));
      stepNav.appendChild(pill);
    });

    const addPill = document.createElement('button');
    addPill.type = 'button';
    addPill.className = 'step-pill step-pill-add';
    addPill.textContent = '+';
    addPill.title = 'Neues Rätsel hinzufügen';
    addPill.addEventListener('click', addNewStep);
    stepNav.appendChild(addPill);

    const finalePill = document.createElement('button');
    finalePill.type = 'button';
    finalePill.className = 'step-pill' + (currentStepIndex === finaleIndex ? ' selected' : '');
    finalePill.textContent = '🏁';
    finalePill.title = 'Letzte Seite: Finale';
    finalePill.addEventListener('click', () => goToStep(finaleIndex));
    stepNav.appendChild(finalePill);
  }

  function renderCurrentStep() {
    const steps = loadSteps();
    const finaleIndex = steps.length + 2;
    const totalPages = finaleIndex + 1; // Landing + Willkommen + Rätsel + Finale
    currentStepIndex = Math.max(0, Math.min(currentStepIndex, finaleIndex));

    stepLanding.hidden = currentStepIndex !== 0;
    stepWelcome.hidden = currentStepIndex !== 1;
    stepPuzzleContainer.hidden = !(currentStepIndex >= 2 && currentStepIndex <= steps.length + 1);
    stepFinale.hidden = currentStepIndex !== finaleIndex;

    if (currentStepIndex === 0) {
      // Landing-Felder werden einmalig beim Laden befüllt (siehe unten).
    } else if (currentStepIndex === 1) {
      refreshWelcomeUI();
    } else if (currentStepIndex === finaleIndex) {
      // Finale-Felder werden einmalig beim Laden befüllt (siehe unten).
    } else {
      renderPuzzleStep(steps[currentStepIndex - 2]);
    }

    stepIndicator.textContent = `Seite ${currentStepIndex + 1} von ${totalPages}`;
    prevStepBtn.disabled = currentStepIndex === 0;
    nextStepBtn.disabled = currentStepIndex === finaleIndex;

    renderStepNav(steps, finaleIndex);
  }

  prevStepBtn.addEventListener('click', () => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  });

  nextStepBtn.addEventListener('click', () => {
    goToStep(currentStepIndex + 1);
  });

  function addNewStep() {
    const steps = loadSteps();
    steps.push({ id: makeStepId(), code: '', title: '', description: '', audio: null, image: null });
    saveSteps(steps);
    goToStep(steps.length + 1);
  }

  function updateStep(id, changes) {
    const steps = loadSteps();
    const idx = steps.findIndex((s) => s.id === id);
    if (idx === -1) return;
    steps[idx] = { ...steps[idx], ...changes };
    saveSteps(steps);
    flashStatus('Gespeichert.');
    renderStepNav(steps);
  }

  function deleteStep(id) {
    const steps = loadSteps();
    const idx = steps.findIndex((s) => s.id === id);
    if (idx === -1) return;
    steps.splice(idx, 1);
    saveSteps(steps);
    flashStatus('Gelöscht.');
    currentStepIndex = Math.min(currentStepIndex, steps.length + 1);
    renderCurrentStep();
  }

  // --- Seite für ein einzelnes Rätsel ---

  function renderPuzzleStep(step) {
    stepPuzzleContainer.innerHTML = '';

    const heading = document.createElement('h2');
    heading.className = 'section-title';
    heading.textContent = `🧩 Rätsel ${currentStepIndex - 1}`;
    stepPuzzleContainer.appendChild(heading);
    const subheading = document.createElement('p');
    subheading.className = 'hint';
    subheading.style.marginTop = '0';
    subheading.textContent = 'Code für dieses Rätsel. Überschrift, Beschreibung, Bild und Sprachnachricht benennen DIESES Rätsel selbst und werden automatisch angezeigt, sobald der Code des vorherigen Rätsels gelöst wird.';
    stepPuzzleContainer.appendChild(subheading);

    if (currentStepIndex === 2) {
      const firstStepHint = document.createElement('p');
      firstStepHint.className = 'hint';
      firstStepHint.style.marginTop = '0';
      firstStepHint.textContent = 'ℹ️ Für das erste Rätsel gibt es keinen "vorherigen Code", der diese Angaben freischaltet - beschreibe den Fundort stattdessen z. B. auf der Willkommen-Seite.';
      stepPuzzleContainer.appendChild(firstStepHint);
    }

    // Code
    const codeLabel = document.createElement('label');
    const codeLabelSpan = document.createElement('span');
    codeLabelSpan.className = 'field-label';
    codeLabelSpan.style.marginTop = '0';
    codeLabelSpan.textContent = 'Code (beliebige Länge)';
    codeLabel.appendChild(codeLabelSpan);

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.className = 'text-input';
    codeInput.autocapitalize = 'characters';
    codeInput.autocorrect = 'off';
    codeInput.spellcheck = false;
    codeInput.value = step.code;
    codeInput.placeholder = 'z. B. AB12 oder SESAMOEFFNEDICH';
    codeLabel.appendChild(codeInput);
    stepPuzzleContainer.appendChild(codeLabel);

    const codeError = document.createElement('p');
    codeError.className = 'error-msg';
    codeError.hidden = true;
    codeError.style.marginTop = '0';
    stepPuzzleContainer.appendChild(codeError);

    codeInput.addEventListener('change', () => {
      const newCode = codeInput.value.trim().toUpperCase();
      codeInput.value = newCode;

      const steps = loadSteps();
      const duplicate = newCode && steps.some((s) => s.id !== step.id && s.code === newCode);
      if (duplicate) {
        codeError.textContent = 'Dieser Code wird bereits für ein anderes Rätsel verwendet.';
        codeError.hidden = false;
        return;
      }
      codeError.hidden = true;
      updateStep(step.id, { code: newCode });
    });

    // Überschrift
    const titleLabel = document.createElement('label');
    const titleLabelSpan = document.createElement('span');
    titleLabelSpan.className = 'field-label';
    titleLabelSpan.textContent = 'Überschrift dieses Rätsels';
    titleLabel.appendChild(titleLabelSpan);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'text-input';
    titleInput.placeholder = 'z. B. Die Bibliothek';
    titleInput.value = step.title || '';
    titleInput.addEventListener('change', () => {
      updateStep(step.id, { title: titleInput.value });
    });
    titleLabel.appendChild(titleInput);
    stepPuzzleContainer.appendChild(titleLabel);

    // Beschreibung
    const descLabel = document.createElement('label');
    const descLabelSpan = document.createElement('span');
    descLabelSpan.className = 'field-label';
    descLabelSpan.textContent = 'Beschreibung dieses Rätsels';
    descLabel.appendChild(descLabelSpan);

    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'text-input';
    descTextarea.rows = 3;
    descTextarea.placeholder = 'Der Hinweistext, den die Spieler sehen...';
    descTextarea.value = step.description || '';
    descTextarea.addEventListener('change', () => {
      updateStep(step.id, { description: descTextarea.value });
    });
    descLabel.appendChild(descTextarea);
    stepPuzzleContainer.appendChild(descLabel);

    // Bild
    const imageLabel = document.createElement('p');
    imageLabel.className = 'field-label';
    imageLabel.textContent = 'Optional: Bild zu diesem Rätsel';
    stepPuzzleContainer.appendChild(imageLabel);

    const imageContainer = document.createElement('div');
    stepPuzzleContainer.appendChild(imageContainer);
    attachImagePicker(imageContainer, step.image, (image) => {
      updateStep(step.id, { image });
    });

    // Sprachnachricht
    const recorderLabel = document.createElement('p');
    recorderLabel.className = 'field-label';
    recorderLabel.textContent = 'Optional: Sprachnachricht zu diesem Rätsel';
    stepPuzzleContainer.appendChild(recorderLabel);

    const recorderContainer = document.createElement('div');
    stepPuzzleContainer.appendChild(recorderContainer);
    attachRecorder(recorderContainer, step.audio, (audio) => {
      updateStep(step.id, { audio });
    });

    // Löschen
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-secondary';
    deleteBtn.style.marginTop = '1.5rem';
    deleteBtn.textContent = '🗑 Dieses Rätsel löschen';
    deleteBtn.addEventListener('click', () => {
      if (!confirm(`Rätsel ${currentStepIndex - 1} wirklich löschen?`)) return;
      deleteStep(step.id);
    });
    stepPuzzleContainer.appendChild(deleteBtn);
  }

  // --- Export / Import / Alles löschen ---

  exportBtn.addEventListener('click', () => {
    // Exportiert sowohl die Rätsel-Liste als auch alle Einstellungen
    // (Landing Page, Willkommen-Texte, Finale, Darstellung) in einer Datei.
    const data = {
      steps: loadSteps(),
      settings: loadSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detektivspiel-backup.json';
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

        // Unterstützt sowohl das aktuelle Format { steps, settings } als
        // auch ältere Exports, die nur ein Array von Rätseln waren.
        let importedSteps;
        let importedSettings = null;
        if (Array.isArray(imported)) {
          importedSteps = imported;
        } else if (imported && typeof imported === 'object' && Array.isArray(imported.steps)) {
          importedSteps = imported.steps;
          if (imported.settings && typeof imported.settings === 'object') {
            importedSettings = imported.settings;
          }
        } else {
          throw new Error('Ungültiges Format');
        }

        const steps = importedSteps.map((item) => ({
          id: (item && item.id) || makeStepId(),
          code: ((item && item.code) || '').toString().toUpperCase(),
          title: (item && item.title) || '',
          description: (item && item.description) || '',
          audio: (item && item.audio) || null,
          image: (item && item.image) || null,
        }));
        saveSteps(steps);

        if (importedSettings) {
          saveSettings({ ...DEFAULT_SETTINGS, ...importedSettings });
        }

        currentStepIndex = 0;
        renderCurrentStep();
        refreshWelcomeUI();
        populateTextSettings();
        populateLandingUI();
        populateFinaleUI();
        applyPresentation();
        flashStatus(importedSettings
          ? 'Import erfolgreich (Rätsel + Einstellungen ersetzt).'
          : 'Import erfolgreich (hat die komplette Rätsel-Liste ersetzt).');
      } catch (err) {
        flashStatus('Import fehlgeschlagen: ' + err.message, true);
      }
      importInput.value = '';
    };
    reader.readAsText(file);
  });

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Wirklich ALLE Rätsel löschen?')) return;
    saveSteps([]);
    resetProgress();
    currentStepIndex = 0;
    renderCurrentStep();
    flashStatus('Alle Rätsel gelöscht.');
  });

  resetProgressBtn.addEventListener('click', () => {
    resetProgress();
    flashStatus('Spielfortschritt zurückgesetzt.');
  });

  function flashStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', isError);
    statusEl.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.hidden = true; }, 2500);
  }

  // --- Willkommen-Seite: Darstellungs-Einstellungen ---

  function refreshWelcomeUI() {
    const settings = loadSettings();

    document.querySelectorAll('.theme-swatch').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.theme === settings.theme);
    });
    document.querySelectorAll('.bg-swatch').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.bg === settings.background);
    });
    document.querySelectorAll('.wrong-sound-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.sound === settings.wrongSound);
    });
    document.querySelectorAll('.correct-sound-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.sound === settings.correctSound);
    });
  }

  document.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const settings = loadSettings();
      settings.theme = btn.dataset.theme;
      saveSettings(settings);
      applyPresentation();
      refreshWelcomeUI();
    });
  });

  document.querySelectorAll('.bg-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const settings = loadSettings();
      settings.background = btn.dataset.bg;
      saveSettings(settings);
      applyPresentation();
      refreshWelcomeUI();
    });
  });

  document.querySelectorAll('.wrong-sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const settings = loadSettings();
      settings.wrongSound = btn.dataset.sound;
      saveSettings(settings);
      playWrongSound(btn.dataset.sound);
      refreshWelcomeUI();
    });
  });

  document.querySelectorAll('.correct-sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const settings = loadSettings();
      settings.correctSound = btn.dataset.sound;
      saveSettings(settings);
      playCorrectSound(btn.dataset.sound);
      refreshWelcomeUI();
    });
  });

  // --- Willkommen-Seite: Texte der Rätsel-Seite ---

  const settingTitle = document.getElementById('setting-title');
  const settingSubtitle = document.getElementById('setting-subtitle');
  const settingWrong = document.getElementById('setting-wrong');

  function populateTextSettings() {
    const settings = loadSettings();
    settingTitle.value = settings.gameTitle;
    settingSubtitle.value = settings.gameSubtitle;
    settingWrong.value = settings.wrongMessage;
  }

  settingTitle.addEventListener('input', () => {
    const settings = loadSettings();
    settings.gameTitle = settingTitle.value;
    saveSettings(settings);
  });

  settingSubtitle.addEventListener('input', () => {
    const settings = loadSettings();
    settings.gameSubtitle = settingSubtitle.value;
    saveSettings(settings);
  });

  settingWrong.addEventListener('input', () => {
    const settings = loadSettings();
    settings.wrongMessage = settingWrong.value;
    saveSettings(settings);
  });

  populateTextSettings();

  // --- Landing Page ---

  const landingTitleInput = document.getElementById('landing-title-input');
  const landingTextInput = document.getElementById('landing-text-input');
  const landingImagePickerContainer = document.getElementById('landing-image-picker');

  function populateLandingUI() {
    const settings = loadSettings();
    landingTitleInput.value = settings.landingTitle || '';
    landingTextInput.value = settings.landingText || '';
    attachImagePicker(landingImagePickerContainer, settings.landingImage, (image) => {
      const s = loadSettings();
      s.landingImage = image;
      saveSettings(s);
    });
  }

  landingTitleInput.addEventListener('input', () => {
    const settings = loadSettings();
    settings.landingTitle = landingTitleInput.value;
    saveSettings(settings);
  });

  landingTextInput.addEventListener('input', () => {
    const settings = loadSettings();
    settings.landingText = landingTextInput.value;
    saveSettings(settings);
  });

  populateLandingUI();

  // --- Finale-Seite ---

  const endTitleInput = document.getElementById('end-title-input');
  const endTextInput = document.getElementById('end-text-input');
  const endImagePickerContainer = document.getElementById('end-image-picker');

  function populateFinaleUI() {
    const settings = loadSettings();
    endTitleInput.value = settings.endTitle || '';
    endTextInput.value = settings.endText || '';
    attachImagePicker(endImagePickerContainer, settings.endImage, (image) => {
      const s = loadSettings();
      s.endImage = image;
      saveSettings(s);
    });
  }

  endTitleInput.addEventListener('input', () => {
    const settings = loadSettings();
    settings.endTitle = endTitleInput.value;
    saveSettings(settings);
  });

  endTextInput.addEventListener('input', () => {
    const settings = loadSettings();
    settings.endText = endTextInput.value;
    saveSettings(settings);
  });

  populateFinaleUI();
});
