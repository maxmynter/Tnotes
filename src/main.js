const { invoke } = window.__TAURI__.core;

// Transparency levels: 10%, 40%, 70%, 100%
const transparencyLevels = [0.1, 0.4, 0.6, 1.0];
let currentTransparencyIndex = 3; // Start at 100%

let noteTextarea;
let wordCountEl;
let transparencyBtn;

function updateWordCount() {
  const text = noteTextarea.value.trim();
  const words = text === '' ? 0 : text.split(/\s+/).filter(word => word.length > 0).length;
  wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

function updateTransparency() {
  const opacity = transparencyLevels[currentTransparencyIndex];
  const percentage = Math.round(opacity * 100);

  // Update CSS custom property
  document.documentElement.style.setProperty('--bg-opacity', opacity.toString());

  // Update button text
  transparencyBtn.textContent = `${percentage}%`;
}

function cycleTransparency() {
  currentTransparencyIndex = (currentTransparencyIndex + 1) % transparencyLevels.length;
  updateTransparency();
}

function saveNote() {
  // Save note content to localStorage
  localStorage.setItem('noteContent', noteTextarea.value);
  localStorage.setItem('transparencyIndex', currentTransparencyIndex.toString());
}

function loadNote() {
  // Load note content from localStorage
  const savedContent = localStorage.getItem('noteContent');
  const savedTransparencyIndex = localStorage.getItem('transparencyIndex');

  if (savedContent) {
    noteTextarea.value = savedContent;
    updateWordCount();
  }

  if (savedTransparencyIndex !== null) {
    currentTransparencyIndex = parseInt(savedTransparencyIndex, 10);
    updateTransparency();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  noteTextarea = document.querySelector("#note-textarea");
  wordCountEl = document.querySelector("#word-count");
  transparencyBtn = document.querySelector("#transparency-btn");

  // Initialize
  loadNote();
  updateWordCount();
  updateTransparency();

  // Event listeners
  noteTextarea.addEventListener("input", () => {
    updateWordCount();
    saveNote();
  });

  transparencyBtn.addEventListener("click", () => {
    cycleTransparency();
    saveNote();
  });

  // Auto-save on window close
  window.addEventListener("beforeunload", saveNote);

  // Focus the textarea on load
  noteTextarea.focus();
});
