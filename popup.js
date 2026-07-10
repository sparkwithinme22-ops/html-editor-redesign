const htmlEditor = document.getElementById("htmlEditor");
const cssEditor = document.getElementById("cssEditor");
const jsEditor = document.getElementById("jsEditor");
const preview = document.getElementById("preview");

const runBtn = document.getElementById("runBtn");
const captureBtn = document.getElementById("captureBtn");
const applyBtn = document.getElementById("applyBtn");
const restoreBtn = document.getElementById("restoreBtn");
const inspectBtn = document.getElementById("inspectBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const templateSelect = document.getElementById("templateSelect");
const autoPreview = document.getElementById("autoPreview");
const editorStatus = document.getElementById("editorStatus");
const lineCount = document.getElementById("lineCount");
const previewStatus = document.getElementById("previewStatus");
const toast = document.getElementById("toast");
const editorNames = { html: "HTML", css: "CSS", js: "JavaScript" };
let activeEditor = "html";
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function updateEditorMeta() {
  const editor = { html: htmlEditor, css: cssEditor, js: jsEditor }[activeEditor];
  const lines = editor.value ? editor.value.split("\n").length : 1;
  editorStatus.textContent = `${editorNames[activeEditor]} editor`;
  lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeEditor = tab.dataset.editor;
    document.querySelectorAll(".tab").forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", selected);
    });
    document.querySelectorAll(".editor-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === activeEditor);
    });
    updateEditorMeta();
  });
});

function getFullHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
${cssEditor.value}
  </style>
</head>
<body>
${htmlEditor.value}

<script>
${jsEditor.value}
<\/script>
</body>
</html>
  `;
}

function updatePreview() {
  previewStatus.textContent = "Updating…";
  preview.srcdoc = getFullHTML();
  setTimeout(() => { previewStatus.textContent = "Up to date"; }, 180);
}

function saveDraft() {
  chrome.storage.local.set({
    html: htmlEditor.value,
    css: cssEditor.value,
    js: jsEditor.value
  });
}

function loadDraft() {
  chrome.storage.local.get(["html", "css", "js", "selectedElementData"], (data) => {
    if (data.selectedElementData) {
      htmlEditor.value = data.selectedElementData.html || "";
      cssEditor.value = data.selectedElementData.css || "";
      jsEditor.value = data.selectedElementData.js || "";
    } else {
      htmlEditor.value = data.html || "";
      cssEditor.value = data.css || "";
      jsEditor.value = data.js || "";
    }

    updatePreview();
  });
}

function downloadHTML() {
  const blob = new Blob([getFullHTML()], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "edited-page.html";
  a.click();

  URL.revokeObjectURL(url);
}

function copyFullHTML() {
  navigator.clipboard.writeText(getFullHTML());
}

function clearEditors() {
  htmlEditor.value = "";
  cssEditor.value = "";
  jsEditor.value = "";

  chrome.storage.local.remove("selectedElementData");

  updatePreview();
  saveDraft();
}

function loadTemplate(type) {
  chrome.storage.local.remove("selectedElementData");

  if (type === "basic") {
    htmlEditor.value = `
<h1>Hello World</h1>
<p>This is a basic HTML template.</p>
    `.trim();

    cssEditor.value = `
body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

h1 {
  color: royalblue;
}
    `.trim();

    jsEditor.value = `
console.log("Basic template loaded");
    `.trim();
  }

  if (type === "card") {
    htmlEditor.value = `
<div class="card">
  <h2>Card Title</h2>
  <p>This is a simple card layout.</p>
  <button>Click Me</button>
</div>
    `.trim();

    cssEditor.value = `
body {
  font-family: Arial, sans-serif;
  padding: 30px;
}

.card {
  padding: 20px;
  border-radius: 10px;
  background: #f2f2f2;
  width: 250px;
}

button {
  padding: 8px 12px;
}
    `.trim();

    jsEditor.value = `
document.querySelector("button").addEventListener("click", () => {
  alert("Button clicked");
});
    `.trim();
  }

  updatePreview();
  saveDraft();
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

async function captureCurrentPageHTML() {
  const tab = await getActiveTab();

  if (!tab || !tab.id) {
    alert("No active tab found.");
    return;
  }

  chrome.storage.local.remove("selectedElementData");

  chrome.tabs.sendMessage(
    tab.id,
    { action: "GET_PAGE_HTML" },
    (response) => {
      if (chrome.runtime.lastError) {
        alert("Could not capture this page. Try refreshing the page and opening the extension again.");
        return;
      }

      if (!response || !response.html) {
        alert("No HTML received from the page.");
        return;
      }

      htmlEditor.value = response.html;
      cssEditor.value = "";
      jsEditor.value = "";

      updatePreview();
      saveDraft();
    }
  );
}

async function applyEditedHTMLToPage() {
  const tab = await getActiveTab();

  if (!tab || !tab.id) {
    alert("No active tab found.");
    return;
  }

  chrome.storage.local.get(["selectedElementData"], (data) => {
    if (data.selectedElementData && data.selectedElementData.id) {
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "APPLY_SELECTED_ELEMENT",
          elementId: data.selectedElementData.id,
          html: htmlEditor.value,
          css: cssEditor.value,
          js: jsEditor.value
        },
        (response) => {
          if (chrome.runtime.lastError) {
            alert("Could not apply selected element changes. Try refreshing the page.");
            return;
          }

          if (response && response.success) {
            alert("Selected element updated on the page.");
          } else {
            alert("Could not find the selected element. Select it again using Inspect Mode.");
          }
        }
      );

      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "APPLY_PAGE_HTML",
        html: htmlEditor.value
      },
      (response) => {
        if (chrome.runtime.lastError) {
          alert("Could not apply changes. Try refreshing the page and opening the extension again.");
          return;
        }

        if (response && response.success) {
          alert("Changes applied to the page.");
        } else {
          alert("Could not apply changes.");
        }
      }
    );
  });
}

async function restoreOriginalPage() {
  const tab = await getActiveTab();

  if (!tab || !tab.id) {
    alert("No active tab found.");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "RESTORE_PAGE_HTML"
    },
    (response) => {
      if (chrome.runtime.lastError) {
        alert("Could not restore page. Try refreshing the page and opening the extension again.");
        return;
      }

      if (response && response.success) {
        chrome.storage.local.remove("selectedElementData");
        alert("Original page restored.");
      } else {
        alert("Could not restore page.");
      }
    }
  );
}

async function toggleInspectMode() {
  const tab = await getActiveTab();

  if (!tab || !tab.id) {
    alert("No active tab found.");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "TOGGLE_INSPECT_MODE"
    },
    (response) => {
      if (chrome.runtime.lastError) {
        alert("Could not enable inspect mode. Try refreshing the page and opening the extension again.");
        return;
      }

      if (response && response.success) {
        inspectBtn.textContent = response.inspectMode ? "Stop Inspect" : "Inspect Mode";
      } else {
        alert("Could not toggle inspect mode.");
      }
    }
  );
}

runBtn.addEventListener("click", () => { updatePreview(); showToast("Preview updated"); });
captureBtn.addEventListener("click", captureCurrentPageHTML);
applyBtn.addEventListener("click", applyEditedHTMLToPage);
restoreBtn.addEventListener("click", restoreOriginalPage);
inspectBtn.addEventListener("click", toggleInspectMode);
saveBtn.addEventListener("click", () => { saveDraft(); showToast("Draft saved"); });
downloadBtn.addEventListener("click", downloadHTML);
copyBtn.addEventListener("click", () => { copyFullHTML(); showToast("Full HTML copied"); });
clearBtn.addEventListener("click", clearEditors);

templateSelect.addEventListener("change", () => {
  loadTemplate(templateSelect.value);
  templateSelect.value = "";
});

[htmlEditor, cssEditor, jsEditor].forEach((editor) => {
  editor.addEventListener("input", () => {
    saveDraft();
    updateEditorMeta();

    if (autoPreview.checked) {
      updatePreview();
    }
  });
});

loadDraft();
updateEditorMeta();
