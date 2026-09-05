// game.js - Logik für index.html (die eigentliche Spielseite)

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('code-input');
  const checkBtn = document.getElementById('check-btn');
  const resetBtn = document.getElementById('reset-btn');
  const resultEl = document.getElementById('result');
  const resultText = document.getElementById('result-text');
  const errorEl = document.getElementById('error');
  const entryEl = document.getElementById('entry');

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    errorEl.hidden = true;
    if (input.value.length === 4) {
      checkCode();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkCode();
  });

  checkBtn.addEventListener('click', checkCode);

  resetBtn.addEventListener('click', () => {
    input.value = '';
    resultEl.hidden = true;
    entryEl.hidden = false;
    errorEl.hidden = true;
    input.focus();
  });

  function checkCode() {
    const code = input.value.trim();
    if (code.length !== 4) return;

    const codes = loadCodes();
    if (Object.prototype.hasOwnProperty.call(codes, code)) {
      resultText.textContent = codes[code];
      entryEl.hidden = true;
      errorEl.hidden = true;
      resultEl.hidden = false;
    } else {
      errorEl.hidden = false;
      errorEl.classList.remove('shake');
      void errorEl.offsetWidth; // Reflow erzwingen, damit die Animation neu startet
      errorEl.classList.add('shake');
    }
  }

  input.focus();
});
