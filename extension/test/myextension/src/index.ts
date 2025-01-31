/************************************************
 * index.ts
 ************************************************/
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  INotebookTracker,
  NotebookActions,
} from '@jupyterlab/notebook';
/*
import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  DisposableDelegate
} from '@lumino/disposable';
/*
import {
  Widget
} from '@lumino/widgets';*/

/*import { Cell } from '@jupyterlab/cells';*/

import { addEnvDropdownToCell, addMetadataSection } from './utils';
import { NotebookButtonExtension } from './NotebookButtonExtension';
/**
 * A global dictionary that stores envName -> JSON.
 * Both the form and the cell dropdowns will use this.
 */
export const GLOBAL_SAVED_ENVIRONMENTS: { [envName: string]: any } = {};
export const GLOBAL_SAVED_TEMPLATE: { [templName: string]: any } = {};

/**
 * Our main plugin that:
 * 1) Adds a "Metadata Form" button to each notebook's toolbar.
 * 2) For each notebook, attaches the cell metadata editor and environment dropdown to each cell.
 * 3) Passes the INotebookTracker to our form widget so we can refresh cell dropdowns after saving.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cell-metadata-editor-dropdown',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => { // INotebookTracker tracks the notebook widgets
    console.log('Cell Metadata Editor + Env Dropdown Plugin activated! jup 3');

    // 1) Add a toolbar button to open our form
    app.docRegistry.addWidgetExtension('Notebook', new NotebookButtonExtension(app, tracker));

    // 2) Add our cell-level features whenever a new notebook is opened
    tracker.widgetAdded.connect((_, notebookPanel) => {
      notebookPanel.context.ready.then(() => {
        const { content } = notebookPanel;

        // Add features to all existing cells
        content.widgets.forEach(cell => {
          addMetadataSection(cell);
          addEnvDropdownToCell(cell);
        });

        // Also watch for changes to the active cell
        content.activeCellChanged.connect(() => {
          const cell = content.activeCell;
          if (cell) {
            addMetadataSection(cell);
            addEnvDropdownToCell(cell);
          }
        });

        // Auto-trigger "Update Metadata" after cell execution
        NotebookActions.executed.connect((_, args) => {
          const { cell } = args;
          if (cell) {
            console.log('Cell executed, simulating metadata update.');
            const metadataSection = cell.node.querySelector('.metadata-section');
            if (metadataSection) {
              const button = metadataSection.querySelector('button');
              if (button) {
                button.click();
              }
            }
          }
        });
      });
    });
  }
};

/**
 * A notebook toolbar button that opens our "MetadataFormWidget" in a new tab.
 * We store the INotebookTracker so the form can reference the current notebook.
 *//*
class NotebookButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(private app: JupyterFrontEnd, private tracker: INotebookTracker) {}

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>) {
    const button = new ToolbarButton({
      label: 'Metadata Form',
      onClick: () => {
        // Pass the INotebookTracker to the form widget's constructor
        const formWidget = new MetadataFormWidget(this.tracker);
        this.app.shell.add(formWidget, 'main');
        this.app.shell.activateById(formWidget.id);
      },
      tooltip: 'Open a metadata form in a new tab'
    });

    // Insert the button into the notebook's toolbar
    panel.toolbar.insertItem(0, 'openMetadataForm', button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

/**
 * The form widget that builds a full form (radio, docker/ssh/k8s fields) on the left,
 * and a JSON preview + "Save Environment" on the right, saving results into GLOBAL_SAVED_ENVIRONMENTS.
 * 
 * After saving an environment, we immediately refresh the environment dropdown in the active notebook.
 */
/*
class MetadataFormWidget extends Widget {
  private dynamicJSON: any;
  private preTemplate: HTMLPreElement;
  private lastEnvName = 'env-name';

  constructor(private tracker: INotebookTracker) {
    super();
    this.id = 'metadata-form-widget';
    this.title.label = 'Metadata Form';
    this.title.closable = true;

    // Default JSON template 
    const DEFAULT_JSON_TEMPLATE = {
      "editable": true,
      "tags": [],
      "version": "v1.0",
      "workflow": {
        "deployments": {
          "env-name": {
            "config": {}, 
            "type": "docker"
          }
        },
        "interpreter": "python3",
        "target": { "deployment": "env-name" },
        "version": "v1.0"
      },
      "trusted": true
    };
    this.dynamicJSON = JSON.parse(JSON.stringify(DEFAULT_JSON_TEMPLATE));

    // Main container with flex layout
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'space-between';
    container.style.alignItems = 'flex-start';
    container.style.width = '100%';

    // Left panel (the full form)
    const leftPanel = document.createElement('div');
    leftPanel.style.flex = '1';
    leftPanel.style.padding = '8px';
    leftPanel.style.fontFamily = 'sans-serif';

    // Right panel (the JSON preview + "Save Env" button)
    const rightPanel = document.createElement('div');
    rightPanel.style.flex = '1';
    rightPanel.style.padding = '8px';
    rightPanel.style.fontFamily = 'monospace';
    rightPanel.style.borderLeft = '1px solid #ccc';
    rightPanel.style.marginLeft = '8px';

    //
    // 1) Build the left form
    //
    leftPanel.innerHTML = `<h2>Metadata Form</h2>`;

    // (A) ENV NAME
    const labelEnvName = document.createElement('label');
    labelEnvName.textContent = 'Environment Name: ';
    const inputEnvName = document.createElement('input');
    inputEnvName.type = 'text';
    inputEnvName.style.marginRight = '8px';
    leftPanel.appendChild(labelEnvName);
    leftPanel.appendChild(inputEnvName);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // Rename env in JSON
    inputEnvName.addEventListener('keyup', () => {
      const newName = inputEnvName.value.trim();
      this.renameEnvironmentKey(this.lastEnvName, newName);
    });

    // (B) RADIO for Decorator
    const labelRadio = document.createElement('p');
    labelRadio.textContent = 'Enable Decorator?';
    const radioYes = document.createElement('input');
    radioYes.type = 'radio';
    radioYes.name = 'enableDecorator';
    radioYes.value = 'yes';
    const radioLabelYes = document.createElement('label');
    radioLabelYes.textContent = 'Yes';

    const radioNo = document.createElement('input');
    radioNo.type = 'radio';
    radioNo.name = 'enableDecorator';
    radioNo.value = 'no';
    const radioLabelNo = document.createElement('label');
    radioLabelNo.textContent = 'No';

    leftPanel.appendChild(labelRadio);
    leftPanel.appendChild(radioYes);
    leftPanel.appendChild(radioLabelYes);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(radioNo);
    leftPanel.appendChild(radioLabelNo);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // (C) "Select Connector" dropdown
    const labelDropdown = document.createElement('label');
    labelDropdown.textContent = 'Select Connector: ';
    labelDropdown.style.display = 'inline-block';
    labelDropdown.style.marginRight = '8px';

    const selectEnv = document.createElement('select');
    selectEnv.style.marginRight = '8px';
    const optPlaceholder = document.createElement('option');
    optPlaceholder.value = '';
    optPlaceholder.text = '--- Select an option ---';
    optPlaceholder.disabled = true;
    optPlaceholder.selected = true;
    selectEnv.add(optPlaceholder);

    const optDocker = document.createElement('option');
    optDocker.value = 'docker';
    optDocker.text = 'docker';
    selectEnv.add(optDocker);

    const optK8s = document.createElement('option');
    optK8s.value = 'kubernetes';
    optK8s.text = 'kubernetes';
    selectEnv.add(optK8s);

    const optSSH = document.createElement('option');
    optSSH.value = 'ssh';
    optSSH.text = 'ssh';
    selectEnv.add(optSSH);

    leftPanel.appendChild(labelDropdown);
    leftPanel.appendChild(selectEnv);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // Docker Container
    const dockerContainer = document.createElement('div');
    dockerContainer.style.display = 'none';
    const dockerLabel = document.createElement('label');
    dockerLabel.textContent = 'Docker Image Name: ';
    const dockerInput = document.createElement('input');
    dockerInput.type = 'text';
    dockerInput.style.marginRight = '8px';
    dockerContainer.appendChild(dockerLabel);
    dockerContainer.appendChild(dockerInput);
    dockerContainer.appendChild(document.createElement('br'));
    dockerContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(dockerContainer);

    // K8s Container
    const k8sContainer = document.createElement('div');
    k8sContainer.style.display = 'none';
    const k8sLabel = document.createElement('label');
    k8sLabel.textContent = 'Kubernetes Files Name: ';
    const k8sInput = document.createElement('input');
    k8sInput.type = 'text';
    k8sInput.style.marginRight = '8px';
    k8sContainer.appendChild(k8sLabel);
    k8sContainer.appendChild(k8sInput);
    k8sContainer.appendChild(document.createElement('br'));
    k8sContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(k8sContainer);

    // SSH Container
    const sshContainer = document.createElement('div');
    sshContainer.style.display = 'none';
    const sshHostLabel = document.createElement('label');
    sshHostLabel.textContent = 'SSH Hostname: ';
    const sshHostInput = document.createElement('input');
    sshHostInput.type = 'text';
    sshHostInput.style.marginRight = '8px';
    sshContainer.appendChild(sshHostLabel);
    sshContainer.appendChild(sshHostInput);
    sshContainer.appendChild(document.createElement('br'));
    sshContainer.appendChild(document.createElement('br'));

    const sshKeyLabel = document.createElement('label');
    sshKeyLabel.textContent = 'SSH Key: ';
    const sshKeyInput = document.createElement('textarea');
    sshKeyInput.style.width = '80%';
    sshKeyInput.style.height = '60px';
    sshKeyInput.style.marginTop = '8px';
    sshKeyInput.style.fontFamily = 'monospace';
    sshKeyInput.style.border = '1px solid #ccc';
    sshKeyInput.style.borderRadius = '4px';
    sshContainer.appendChild(sshKeyLabel);
    sshContainer.appendChild(document.createElement('br'));
    sshContainer.appendChild(sshKeyInput);
    sshContainer.appendChild(document.createElement('br'));
    sshContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(sshContainer);

    // On dropdown change
    selectEnv.addEventListener('change', () => {
      dockerContainer.style.display = 'none';
      k8sContainer.style.display = 'none';
      sshContainer.style.display = 'none';

      const val = selectEnv.value;
      if (val === 'docker') dockerContainer.style.display = 'block';
      if (val === 'kubernetes') k8sContainer.style.display = 'block';
      if (val === 'ssh') sshContainer.style.display = 'block';

      // Update type in JSON
      const deployment = this.dynamicJSON.workflow.deployments[this.lastEnvName];
      if (deployment) {
        deployment.type = val;
      }
      this.updatePreview();
    });

    // Docker real-time updates
    dockerInput.addEventListener('keyup', () => {
      const dep = this.dynamicJSON.workflow.deployments[this.lastEnvName];
      if (!dep) return;
      if (dep.type === 'docker') {
        dep.config = { image: dockerInput.value.trim() };
        this.updatePreview();
      }
    });

    // K8s real-time updates
    k8sInput.addEventListener('keyup', () => {
      const dep = this.dynamicJSON.workflow.deployments[this.lastEnvName];
      if (!dep) return;
      if (dep.type === 'kubernetes') {
        const rawVal = k8sInput.value.trim();
        const filesArray = rawVal.split(',').map(s => s.trim()).filter(s => s.length > 0);
        dep.config = { files: filesArray };
        this.updatePreview();
      }
    });

    // SSH real-time updates
    const handleSSHUpdate = () => {
      const dep = this.dynamicJSON.workflow.deployments[this.lastEnvName];
      if (!dep) return;
      if (dep.type === 'ssh') {
        dep.config = {
          hostname: sshHostInput.value.trim(),
          sshKey: sshKeyInput.value.trim()
        };
        this.updatePreview();
      }
    };
    sshHostInput.addEventListener('keyup', handleSSHUpdate);
    sshKeyInput.addEventListener('keyup', handleSSHUpdate);

    //
    // 2) Build the right panel
    //
    const headingRight = document.createElement('h2');
    headingRight.textContent = 'JSON Template';

    this.preTemplate = document.createElement('pre');
    this.preTemplate.style.backgroundColor = '#f7f7f7';
    this.preTemplate.style.padding = '8px';
    this.preTemplate.style.border = '1px solid #ddd';
    this.preTemplate.style.borderRadius = '4px';
    this.preTemplate.style.whiteSpace = 'pre-wrap';
    this.preTemplate.textContent = JSON.stringify(this.dynamicJSON, null, 2);

    const saveEnvBtn = document.createElement('button');
    saveEnvBtn.textContent = 'Save Environment';
    saveEnvBtn.style.display = 'block';
    saveEnvBtn.style.marginTop = '12px';
    saveEnvBtn.onclick = () => {
      // 1) Save in the global dictionary
      const envJson = JSON.parse(JSON.stringify(this.dynamicJSON));
      GLOBAL_SAVED_ENVIRONMENTS[this.lastEnvName] = envJson;
      showTemporaryAlert(`Saved "${this.lastEnvName}" environment!`, 2000);
      console.log('Saved Environments:', GLOBAL_SAVED_ENVIRONMENTS);

      // 2) Immediately refresh the cell dropdowns in the active notebook
      const currentNbPanel = this.tracker.currentWidget;
      if (currentNbPanel && currentNbPanel instanceof NotebookPanel) {
        refreshAllEnvDropdowns(currentNbPanel);
      }
    };

    rightPanel.appendChild(headingRight);
    rightPanel.appendChild(this.preTemplate);
    rightPanel.appendChild(saveEnvBtn);

    // Put panels in the container
    container.appendChild(leftPanel);
    container.appendChild(rightPanel);
    this.node.appendChild(container);
  }

  private renameEnvironmentKey(oldKey: string, newKey: string) {
    if (!newKey || oldKey === newKey) return;
    if (!this.dynamicJSON.workflow.deployments[oldKey]) return;
    const oldVal = this.dynamicJSON.workflow.deployments[oldKey];
    delete this.dynamicJSON.workflow.deployments[oldKey];
    this.dynamicJSON.workflow.deployments[newKey] = oldVal;

    // Also fix target if needed
    if (this.dynamicJSON.workflow.target.deployment === oldKey) {
      this.dynamicJSON.workflow.target.deployment = newKey;
    }
    this.lastEnvName = newKey;
    this.updatePreview();
  }

  private updatePreview() {
    this.preTemplate.textContent = JSON.stringify(this.dynamicJSON, null, 2);
  }
}

/**
 * Refresh all environment dropdowns in a given notebook panel,
 * so newly saved environment names appear immediately.
 */
/*export function refreshAllEnvDropdowns(notebookPanel: NotebookPanel) {
  const { content } = notebookPanel;
  content.widgets.forEach(cell => {
    updateEnvDropdown(cell);
  });
}

/**
 * Re-populate the environment dropdown in a single cell,
 * reflecting the keys in GLOBAL_SAVED_ENVIRONMENTS.
 *//*
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
 *//*
function addMetadataSection(cell: Cell): void {
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
 *//*
function addEnvDropdownToCell(cell: Cell): void {
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

/**
 * A simple toast function
 *//*
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
*/
export default plugin;
