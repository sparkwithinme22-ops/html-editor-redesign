HTML Studio

HTML Studio is a Chrome extension for writing HTML, CSS, and JavaScript, previewing the result, and temporarily applying edits to the current webpage.

## Features

- Separate HTML, CSS, and JavaScript editor tabs
- Live preview while typing
- Ready-made starter templates
- Capture HTML from the current webpage
- Inspect and edit a specific page element
- Temporarily apply edited HTML to a webpage
- Restore the original webpage safely
- Save drafts in Chrome's local extension storage
- Copy or download a complete HTML document

## Install in Chrome

1. Open Chrome and enter `chrome://extensions` in the address bar.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `html-editor-redesign` folder containing `manifest.json`.
5. Pin HTML Studio from Chrome's Extensions menu if you want quick access.

After changing any extension file, return to `chrome://extensions` and click the extension's **Reload** button.

## How to use it

1. Open HTML Studio from the Chrome toolbar.
2. Write code in the **HTML**, **CSS**, and **JavaScript** tabs.
3. Keep **Auto preview** enabled to update the preview while typing, or turn it off and click **Run** manually.
4. Click **Save** to store the current draft.
5. Click **Copy** to copy the complete HTML document, or **Download** to save it as `edited-page.html`.

## Page-editing tools

### Capture page

Loads the current tab's body HTML into the HTML editor. Chrome's protected internal pages, including `chrome://` pages and the Chrome Web Store, cannot be captured.

### Inspect

Enables element selection on the current page. Hover over an element and click it, then reopen the extension to edit the selected element's HTML and styles.

### Apply to page

Temporarily applies the editor content to the current tab. These changes are not saved to the website and may disappear when the page reloads.

### Restore

Reloads the current tab to restore the website's original content, scripts, and interactions safely.

## Other controls

- **Templates:** Loads a basic page or card example.
- **Save:** Saves the current code locally in Chrome.
- **Copy:** Copies a complete document containing the HTML, CSS, and JavaScript.
- **Download:** Downloads the complete document as an HTML file.
- **Clear:** Clears all three editors.

Hover over a control to see a short explanation of what it does.

## Permissions

HTML Studio requests these Chrome permissions:

- `storage` stores editor drafts locally.
- `activeTab` lets the extension work with the active browser tab.
- `scripting` supports page-editing tools.
- `<all_urls>` allows the content script to run on ordinary websites.

The extension does not send editor content to a server.

## Troubleshooting

### Capture, Inspect, or Apply does not work

Refresh the webpage after installing or reloading the extension, then try again. These tools do not work on protected `chrome://` pages.

### Old errors still appear in Chrome

Open `chrome://extensions`, reload HTML Studio, refresh the webpage, and clear the old error list. Errors recorded before an update remain visible until cleared.

### The popup still shows an older design

Confirm that Chrome loaded this `html-editor-redesign` folder rather than the original project folder, then click **Reload** on the extension card.

## Project files

- `manifest.json` — Chrome extension configuration
- `popup.html` — popup interface structure
- `popup.css` — popup styling
- `popup.js` — editor, preview, storage, and toolbar behavior
- `content.js` — capture, inspect, apply, and restore behavior on webpages

## Important note

Use page editing only on webpages you are authorized to modify. Changes made with this extension are local and temporary.

