let originalHTML = null;
let inspectMode = false;
let lastHoveredElement = null;
let selectedElementId = null;

const usefulCSSProperties = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "background",
  "background-color",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "text-align",
  "border",
  "border-radius",
  "box-shadow",
  "opacity",
  "z-index",
  "cursor",
  "overflow",
  "transform"
];

function enableInspectMode() {
  inspectMode = true;

  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);
  document.addEventListener("click", handleElementClick, true);

  alert("Inspect Mode enabled. Hover and click any element on the page.");
}

function disableInspectMode() {
  inspectMode = false;

  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
  document.removeEventListener("click", handleElementClick, true);

  if (lastHoveredElement) {
    lastHoveredElement.style.outline = "";
    lastHoveredElement = null;
  }
}

function handleMouseOver(event) {
  if (!inspectMode) {
    return;
  }

  event.stopPropagation();

  if (lastHoveredElement) {
    lastHoveredElement.style.outline = "";
  }

  lastHoveredElement = event.target;
  lastHoveredElement.style.outline = "2px solid red";
}

function handleMouseOut(event) {
  if (!inspectMode) {
    return;
  }

  event.stopPropagation();

  if (event.target) {
    event.target.style.outline = "";
  }
}

function getComputedCSS(element) {
  const computedStyle = window.getComputedStyle(element);
  let cssText = "";

  usefulCSSProperties.forEach((property) => {
    const value = computedStyle.getPropertyValue(property);

    if (value) {
      cssText += `${property}: ${value};\n`;
    }
  });

  return cssText.trim();
}

function getInlineJavaScript(element) {
  let jsText = "";

  for (const attribute of element.attributes) {
    if (attribute.name.startsWith("on")) {
      jsText += `${attribute.name}="${attribute.value}"\n`;
    }
  }

  return jsText.trim();
}

function applyInlineJavaScript(element, jsText) {
  const lines = jsText.split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    const match = trimmedLine.match(/^(on\w+)="([\s\S]*)"$/);

    if (match) {
      const eventName = match[1];
      const eventValue = match[2];

      element.setAttribute(eventName, eventValue);
    }
  });
}

function handleElementClick(event) {
  if (!inspectMode) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const selectedElement = event.target;

  if (lastHoveredElement) {
    lastHoveredElement.style.outline = "";
  }

  selectedElementId = "html-editor-selected-" + Date.now();
  selectedElement.setAttribute("data-html-editor-id", selectedElementId);
  selectedElement.style.outline = "2px solid blue";

  const selectedData = {
    id: selectedElementId,
    html: selectedElement.outerHTML,
    css: getComputedCSS(selectedElement),
    js: getInlineJavaScript(selectedElement),
    time: Date.now()
  };

  chrome.storage.local.set({
    selectedElementData: selectedData
  }, () => {
    alert("Element selected. Open the extension popup again to edit it.");
  });

  disableInspectMode();
}

function applySelectedElementChanges(html, css, js, elementId) {
  const selectedElement = document.querySelector(`[data-html-editor-id="${elementId}"]`);

  if (!selectedElement) {
    return false;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();

  const newElement = wrapper.firstElementChild;

  if (!newElement) {
    return false;
  }

  newElement.setAttribute("data-html-editor-id", elementId);

  if (css && css.trim()) {
    newElement.style.cssText += css;
  }

  if (js && js.trim()) {
    applyInlineJavaScript(newElement, js);
  }

  selectedElement.replaceWith(newElement);

  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_PAGE_HTML") {
    if (originalHTML === null) {
      originalHTML = document.body.innerHTML;
    }

    sendResponse({
      html: document.body.innerHTML
    });
  }

  if (message.action === "APPLY_PAGE_HTML") {
    if (originalHTML === null) {
      originalHTML = document.body.innerHTML;
    }

    document.body.innerHTML = message.html;

    sendResponse({
      success: true
    });
  }

  if (message.action === "APPLY_SELECTED_ELEMENT") {
    const success = applySelectedElementChanges(
      message.html,
      message.css,
      message.js,
      message.elementId
    );

    sendResponse({
      success: success
    });
  }

  if (message.action === "RESTORE_PAGE_HTML") {
    chrome.storage.local.remove("selectedElementData");

    sendResponse({
      success: true
    });

    // Re-parsing a captured page with innerHTML can reinsert protected scripts
    // and speculation rules (notably on Google), producing CSP errors and
    // leaving the page without its original event listeners. A reload restores
    // the real document safely and completely.
    setTimeout(() => window.location.reload(), 50);
  }

  if (message.action === "TOGGLE_INSPECT_MODE") {
    if (inspectMode) {
      disableInspectMode();
    } else {
      enableInspectMode();
    }

    sendResponse({
      success: true,
      inspectMode: inspectMode
    });
  }
});
