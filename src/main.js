const { invoke } = window.__TAURI__.core;

// Transparency levels: 10%, 40%, 70%, 100%
const transparencyLevels = [0.1, 0.4, 0.6, 1.0];
let currentTransparencyIndex = 3; // Start at 100%

let noteTextarea;
let wordCountEl;
let transparencyBtn;
let overlayVisible = false;
let cheatsheetOverlay;

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

async function exportNoteToApple(note) {
  try {
    const result = await invoke('export_to_apple_notes', {
      note: note,
    });
    console.log(result);
  } catch (error) {
    console.error('Error exporting note:', error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  noteTextarea = document.querySelector("#note-textarea");
  wordCountEl = document.querySelector("#word-count");
  transparencyBtn = document.querySelector("#transparency-btn");
  cheatsheetOverlay = document.querySelector("#cheatsheet-overlay");

  loadNote();
  updateWordCount();
  updateTransparency();

  noteTextarea.addEventListener("input", () => {
    updateWordCount();
    saveNote();
  });

  transparencyBtn.addEventListener("click", () => {
    cycleTransparency();
    saveNote();
  });

  document.querySelector("#question-btn").addEventListener("click", () => {
    // Simple toggle behavior
    if (overlayVisible) {
      hideCheatsheet();
    } else {
      showCheatsheet();
    }
  });

  document.querySelector("#export-btn").addEventListener("click", async () => {
    await exportNote();
  });

  // Close overlay when clicking outside the cheatsheet
  cheatsheetOverlay.addEventListener("click", (e) => {
    if (e.target === cheatsheetOverlay) {
      hideCheatsheet();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey) {
      // Try multiple ways to detect the ? key
      const isQuestionMark = e.key === "?" ||
        (e.code === "Slash" && e.shiftKey) ||
        (e.key === "/" && e.shiftKey);

      if (isQuestionMark) {
        e.preventDefault();

        // Simple toggle - same behavior as button click
        if (overlayVisible) {
          hideCheatsheet();
        } else {
          showCheatsheet();
        }
        return;
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        exportNote();
      }
    }

    // Escape key to close overlay
    if (e.key === "Escape" && overlayVisible) {
      hideCheatsheet();
    }
  });

  // Auto-save on window close
  window.addEventListener("beforeunload", saveNote);

  // Focus the textarea on load
  noteTextarea.focus();
});

function toggleCheatsheet() {
  if (overlayVisible) {
    hideCheatsheet();
  } else {
    showCheatsheet();
  }
}

function showCheatsheet() {
  cheatsheetOverlay.style.display = "flex";
  overlayVisible = true;
}

function hideCheatsheet() {
  cheatsheetOverlay.style.display = "none";
  overlayVisible = false;
}

async function exportNote() {
  const text = noteTextarea.value.trim();
  if (!text) {
    alert('No content to export!');
    return;
  }
  try {
    await exportNoteToApple(text);
    alert('Note exported to Apple Notes successfully!');
  } catch (error) {
    console.error('Error exporting note:', error);
    alert('Failed to export note: ' + error);
  }
}
