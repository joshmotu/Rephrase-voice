const micBtn = document.getElementById('mic');
const playBtn = document.getElementById('play');
const copyBtn = document.getElementById('copy');
const originalDiv = document.getElementById('original');
const rephrasedDiv = document.getElementById('rephrased');
const toneSelect = document.getElementById('tone');
const status = document.getElementById('status');

let lastRephrased = '';
let recognition = null;

function supportsSpeechRecognition() {
  return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
}

if (supportsSpeechRecognition()) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => status.textContent = 'Listening... Speak now.';
  recognition.onerror = (e) => { status.textContent = 'Error during recognition: ' + e.error; };
  recognition.onend = () => status.textContent = '';
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    originalDiv.textContent = text;
    callRephrase(text);
  };
} else {
  micBtn.disabled = true;
  status.textContent = 'Speech recognition not supported in this browser.';
}

micBtn.onclick = () => {
  if (!recognition) return;
  try {
    recognition.start();
  } catch (e) {
    console.warn('Recognition start error', e);
  }
};

async function callRephrase(text) {
  status.textContent = 'Rephrasing...';
  rephrasedDiv.textContent = '';
  playBtn.disabled = true;
  copyBtn.disabled = true;
  const tone = toneSelect.value;
  try {
    const resp = await fetch('/rephrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tone })
    });
    const data = await resp.json();
    if (data && data.rephrased) {
      lastRephrased = data.rephrased;
      rephrasedDiv.textContent = lastRephrased;
      playBtn.disabled = false;
      copyBtn.disabled = false;
      status.textContent = 'Done.';
    } else {
      status.textContent = 'No response from server.';
    }
  } catch (err) {
    console.error(err);
    status.textContent = 'Error calling server: ' + err;
  }
}

playBtn.onclick = () => {
  if (!lastRephrased) return;
  const utter = new SpeechSynthesisUtterance(lastRephrased);
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
};

copyBtn.onclick = async () => {
  if (!lastRephrased) return;
  try {
    await navigator.clipboard.writeText(lastRephrased);
    status.textContent = 'Rephrased text copied to clipboard.';
  } catch (e) {
    status.textContent = 'Copy failed.';
  }
};
