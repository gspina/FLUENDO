
/*
import {
  Widget
} from '@lumino/widgets';*/

import { Cell } from '@jupyterlab/cells';

import {
  NotebookPanel,
} from '@jupyterlab/notebook';

import { GLOBAL_SAVED_ENVIRONMENTS } from "./index"
/**
 * A simple toast function
 */
export function showTemporaryAlert(
    message: string,
    duration: number = 1000,
    color: string = '#4A9340'
  ): void {
    console.log(message);
    const alertDiv = document.createElement('div');
    alertDiv.textContent = message;
    alertDiv.style.whiteSpace = 'pre-line';
    alertDiv.style.position = 'fixed';
    alertDiv.style.bottom = '10px';
    alertDiv.style.right = '10px';
    alertDiv.style.backgroundColor = color;
    alertDiv.style.color = '#F0F0F0';
    alertDiv.style.padding = '10px 20px';
    alertDiv.style.border = '1px solid #ccc';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    alertDiv.style.zIndex = '1000';
    alertDiv.style.fontFamily = 'Arial, sans-serif';
    alertDiv.style.fontSize = '14px';
  
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      document.body.removeChild(alertDiv);
    }, duration);
  }


/**
 * Refresh all environment dropdowns in a given notebook panel,
 * so newly saved environment names appear immediately.
 */
export function refreshAllEnvDropdowns(notebookPanel: NotebookPanel) {
  const { content } = notebookPanel;
  content.widgets.forEach(cell => {
    updateEnvDropdown(cell);
  });
}
/**
 * Re-populate the environment dropdown in a single cell,
 * reflecting the keys in GLOBAL_SAVED_ENVIRONMENTS.
 */
function updateEnvDropdown(cell: Cell) {
  const container = cell.node.querySelector('.env-dropdown-container');
  if (!container) return;
  const select = container.querySelector('select');
  if (!select) return;

  // Clear existing options
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  // Re-add the placeholder
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '--- Envs ---';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  // Now re-populate from GLOBAL_SAVED_ENVIRONMENTS
  Object.keys(GLOBAL_SAVED_ENVIRONMENTS).forEach(envName => {
    const opt = document.createElement('option');
    opt.value = envName;
    opt.textContent = envName;
    select.appendChild(opt);
  });
}


/**
 * Adds the standard cell metadata editor WITH "Upload JSON" AND "Download JSON" buttons.
 */
export function addMetadataSection(cell: Cell): void {
  // If already added, skip
  if (cell.node.querySelector('.metadata-section')) return;
  const sharedModel = cell.model.sharedModel;
  if (!sharedModel) return;

  const metadataSection = document.createElement('div');
  metadataSection.className = 'metadata-section';
  metadataSection.style.border = '1px solid #ddd';
  metadataSection.style.padding = '4px';
  metadataSection.style.marginBottom = '8px';

  // Show current metadata
  const metadataDisplay = document.createElement('pre');
  metadataDisplay.textContent = JSON.stringify(sharedModel.metadata, null, 2);
  metadataDisplay.style.backgroundColor = '#f7f7f7';
  metadataDisplay.style.padding = '4px';
  metadataDisplay.style.borderRadius = '4px';
  metadataDisplay.style.overflowX = 'auto';
  metadataSection.appendChild(metadataDisplay);

  // Textarea to edit
  const input = document.createElement('textarea');
  input.value = JSON.stringify(sharedModel.metadata, null, 2);
  input.style.width = '100%';
  input.style.height = '80px';
  input.style.marginTop = '8px';
  input.style.fontFamily = 'monospace';
  input.style.border = '1px solid #ccc';
  input.style.borderRadius = '4px';
  // Let enter do a newline
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  });
  metadataSection.appendChild(input);

  // Update metadata button
  const updateBtn = document.createElement('button');
  updateBtn.textContent = 'Update Metadata';
  updateBtn.style.marginTop = '8px';
  updateBtn.onclick = () => {
    try {
      const newMeta = JSON.parse(input.value);
      // Overwrite everything in cell metadata
      Object.keys(newMeta).forEach(k => {
        sharedModel.setMetadata(k, newMeta[k]);
      });
      metadataDisplay.textContent = JSON.stringify(sharedModel.metadata, null, 2);
      showTemporaryAlert('Metadata updated!', 2000);
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      showTemporaryAlert('Invalid JSON format!', 2000, '#A82E2E');
    }
  };
  metadataSection.appendChild(updateBtn);

  // "Upload JSON" button
  const uploadButton = document.createElement('button');
  uploadButton.textContent = 'Upload JSON';
  uploadButton.style.marginTop = '8px';
  uploadButton.style.marginLeft = '8px';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  uploadButton.onclick = () => fileInput.click();
  fileInput.addEventListener('change', async () => {
    if (fileInput.files?.length) {
      const file = fileInput.files[0];
      try {
        const fileContent = await file.text();
        console.log('File Content:', fileContent);
        const jsonData = JSON.parse(fileContent);
        console.log('Parsed JSON Data:', jsonData);

        // Overwrite the metadata with the uploaded JSON
        Object.keys(jsonData).forEach(k => {
          sharedModel.setMetadata(k, jsonData[k]);
        });
        metadataDisplay.textContent = JSON.stringify(sharedModel.metadata, null, 2);
        input.value = JSON.stringify(sharedModel.metadata, null, 2);

        showTemporaryAlert('JSON uploaded successfully!', 2000);
      } catch (error) {
        console.error('Error processing file:', error);
        showTemporaryAlert('Invalid JSON format or upload failed!', 2000, '#A82E2E');
      }
    }
  });

  metadataSection.appendChild(uploadButton);
  metadataSection.appendChild(fileInput);

  // "Download JSON" button
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download JSON';
  downloadButton.style.marginTop = '8px';
  downloadButton.style.marginLeft = '8px';

  downloadButton.onclick = () => {
    try {
      const metadata = sharedModel.metadata;
      const jsonStr = JSON.stringify(metadata, null, 2);

      // Create a data URL
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create a temporary <a> to trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'cell_metadata.json';  // Filename

      // Append, click, remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the object URL
      URL.revokeObjectURL(url);

      showTemporaryAlert('Cell metadata downloaded!', 2000);
    } catch (err) {
      console.error('Error downloading JSON:', err);
      showTemporaryAlert('Failed to download JSON!', 2000, '#A82E2E');
    }
  };

  metadataSection.appendChild(downloadButton);

  // Finally, insert this section above the cell
  cell.node.insertBefore(metadataSection, cell.node.firstChild);
}

/**
 * Adds a dropdown to each cell, referencing GLOBAL_SAVED_ENVIRONMENTS.
 */
export function addEnvDropdownToCell(cell: Cell): void {
  // If already added, skip
  if (cell.node.querySelector('.env-dropdown-container')) return;

  const container = document.createElement('div');
  container.className = 'env-dropdown-container';
  container.style.marginBottom = '6px';

  const label = document.createElement('label');
  label.textContent = 'Select Env for this cell: ';
  container.appendChild(label);

  const select = document.createElement('select');
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '--- Envs ---';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  // Fill with keys from GLOBAL_SAVED_ENVIRONMENTS
  Object.keys(GLOBAL_SAVED_ENVIRONMENTS).forEach(envName => {
    const opt = document.createElement('option');
    opt.value = envName;
    opt.textContent = envName;
    select.appendChild(opt);
  });

  select.onchange = () => {
    const chosenEnv = select.value;
    const envObj = GLOBAL_SAVED_ENVIRONMENTS[chosenEnv];
    if (!envObj) {
      console.warn(`No such env "${chosenEnv}" in dictionary.`);
      return;
    }
    const sharedModel = cell.model.sharedModel;
    if (!sharedModel) return;

    // For demo, store the entire environment object under "envData" in the metadata
    try {
      sharedModel.setMetadata('envData', envObj);
      showTemporaryAlert(`Cell metadata updated with env "${chosenEnv}"`, 2000);
      console.log('Cell metadata is now', sharedModel.metadata);
    } catch (err) {
      console.error('Failed to set metadata:', err);
      showTemporaryAlert('Failed to set environment!', 2000, '#A82E2E');
    }
  };

  container.appendChild(select);
  // Insert container on top of the cell
  cell.node.insertBefore(container, cell.node.firstChild);
}


