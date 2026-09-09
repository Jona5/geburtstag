// game.js - Logik für index.html (die eigentliche Spielseite)

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('code-input');
  const checkBtn = document.getElementById('check-btn');
  const resetBtn = document.getElementById('reset-btn');
  const replayVoiceBtn = document.getElementById('replay-voice-btn');
  const resultEl = document.getElementById('result');
  const resultTitle = document.getElementById('result-title');
  const resultImage = document.getElementById('result-image');
  const resultText = document.getElementById('result-text');
  const resultAudio = document.getElementById('result-audio');
  const resultFinale = document.getElementById('result-finale');
  const endTitle = document.getElementById('end-title');
  const endImage = document.getElementById('end-image');
  const endText = document.getElementById('end-text');
  const errorEl = document.getElementById('error');
  const entryEl = document.getElementById('entry');
  const titleEl = document.getElementById('game-title');
  const subtitleEl = document.getElementById('game-subtitle');

  const settings = loadSettings();

  titleEl.textContent = settings.gameTitle;
  subtitleEl.textContent = settings.gameSubtitle;
  errorEl.textContent = settings.wrongMessage;

  let currentVoiceUrl = null;

  function releaseVoiceUrl() {
    if (currentVoiceUrl) {
      URL.revokeObjectURL(currentVoiceUrl);
      currentVoiceUrl = null;
    }
  }

  resultAudio.addEventListener('error', () => {
    // Hilft bei der Fehlersuche, falls ein Browser das Aufnahmeformat
    // doch nicht abspielen kann.
    console.error('Sprachnachricht konnte nicht abgespielt werden:', resultAudio.error);
  });

  input.addEventListener('input', () => {
    // Codes sind nicht auf Ziffern und keine feste Länge beschränkt, werden
    // aber einheitlich in Großbuchstaben verglichen - sonst hängt es an
    // Groß-/Kleinschreibung beim Tippen (Autokorrektur, mobile Tastaturen).
    input.value = input.value.toUpperCase();
    errorEl.hidden = true;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkCode();
  });

  checkBtn.addEventListener('click', checkCode);

  replayVoiceBtn.addEventListener('click', () => {
    playVoiceMessage();
  });

  resetBtn.addEventListener('click', () => {
    input.value = '';
    resultAudio.pause();
    resultAudio.removeAttribute('src');
    releaseVoiceUrl();
    replayVoiceBtn.hidden = true;
    resultFinale.hidden = true;
    resultEl.hidden = true;
    entryEl.hidden = false;
    errorEl.hidden = true;
    input.focus();
  });

  function playVoiceMessage() {
    resultAudio.currentTime = 0;
    const playPromise = resultAudio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        console.error('Wiedergabe der Sprachnachricht blockiert:', err);
      });
    }
  }

  // Wandelt die gespeicherte data-URL in eine blob-URL um und spielt sie
  // ab. Der Umweg über blob: ist nötig, weil Safari fragmentiertes MP3/MP4
  // (so nimmt MediaRecorder dort auf) von einer data-URL nicht abspielen
  // kann - von einer blob-URL desselben Inhalts aber schon.
  async function showVoiceMessage(dataUrl) {
    releaseVoiceUrl();
    try {
      currentVoiceUrl = await dataUrlToObjectUrl(dataUrl);
    } catch (err) {
      console.error('Sprachnachricht konnte nicht geladen werden:', err);
      currentVoiceUrl = dataUrl; // Fallback: direkt versuchen
    }
    resultAudio.src = currentVoiceUrl;
    resultAudio.load();
    replayVoiceBtn.hidden = false;
    playVoiceMessage();
  }

  function checkCode() {
    const code = input.value.trim();
    if (!code) return;

    const steps = loadSteps();
    const currentSettings = loadSettings();
    const stepIndex = steps.findIndex((s) => s.code === code);
    const step = stepIndex === -1 ? null : steps[stepIndex];

    if (step) {
      const title = step.title || '';
      resultTitle.textContent = title;
      resultTitle.hidden = !title;
      resultText.textContent = step.description || '';

      if (step.image) {
        resultImage.src = step.image;
        resultImage.hidden = false;
      } else {
        resultImage.hidden = true;
        resultImage.removeAttribute('src');
      }

      // Letzter Rätsel-Schritt: zusätzlich die dedizierte Finale-Seite zeigen.
      if (stepIndex === steps.length - 1) {
        endTitle.textContent = currentSettings.endTitle || '';
        endTitle.hidden = !currentSettings.endTitle;
        endText.textContent = currentSettings.endText || '';
        if (currentSettings.endImage) {
          endImage.src = currentSettings.endImage;
          endImage.hidden = false;
        } else {
          endImage.hidden = true;
          endImage.removeAttribute('src');
        }
        resultFinale.hidden = false;
      } else {
        resultFinale.hidden = true;
      }

      const audioSrc = step.audio;
      if (audioSrc) {
        showVoiceMessage(audioSrc);
      } else {
        resultAudio.pause();
        resultAudio.removeAttribute('src');
        releaseVoiceUrl();
        replayVoiceBtn.hidden = true;
        playCorrectSound(currentSettings.correctSound);
      }

      entryEl.hidden = true;
      errorEl.hidden = true;
      resultEl.hidden = false;
    } else {
      errorEl.hidden = false;
      errorEl.classList.remove('shake');
      void errorEl.offsetWidth; // Reflow erzwingen, damit die Animation neu startet
      errorEl.classList.add('shake');
      playWrongSound(currentSettings.wrongSound);
    }
  }

  input.focus();
});
