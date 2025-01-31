import {
  INotebookTracker,
  NotebookPanel,
} from '@jupyterlab/notebook';

import { Widget } from '@lumino/widgets';

import { GLOBAL_SAVED_ENVIRONMENTS } from "./index";
import { GLOBAL_SAVED_TEMPLATE } from "./index";

import { refreshAllEnvDropdowns } from "./utils";
import { showTemporaryAlert } from "./utils";

/**
 * Recursively checks if any string value in `jsonObj` contains '%data'.
 */
function hasDataReference(jsonObj: any): boolean {
  if (typeof jsonObj === 'string') {
    return jsonObj.includes('%data');
  } else if (Array.isArray(jsonObj)) {
    return jsonObj.some(item => hasDataReference(item));
  } else if (jsonObj && typeof jsonObj === 'object') {
    return Object.values(jsonObj).some(value => hasDataReference(value));
  }
  return false;
}

export class MetadataFormWidget extends Widget {
  private dynamicJSON: any;                // The in-memory JSON
  private preTemplate: HTMLPreElement;     // JSON preview element
  private lastEnvName = 'env-name';        // Key in .workflow.deployments

  // Dropdown references
  private envDropdown: HTMLSelectElement;
  private templateDropdown: HTMLSelectElement;
  
  // Form references
  private inputEnvName: HTMLInputElement;
  private selectConnector: HTMLSelectElement;

  // Docker / K8s / SSH containers & inputs
  private dockerContainer: HTMLDivElement;
  private dockerInput: HTMLInputElement;

  private k8sContainer: HTMLDivElement;
  private k8sInput: HTMLInputElement;

  private sshContainer: HTMLDivElement;
  private sshHostInput: HTMLInputElement;
  private sshKeyInput: HTMLTextAreaElement;

  constructor(private tracker: INotebookTracker) {
    super();
    this.id = 'metadata-form-widget';
    this.title.label = 'Metadata Form';
    this.title.closable = true;

    // 1) Upload JSON Button
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
      if (!fileInput.files?.length) return;
      const file = fileInput.files[0];
      try {
        const fileContent = await file.text();
        //const jsonData = JSON.parse(fileContent); TODO STO PROVANDO QUESTO APPROCCIO
        //const jsonData = JSON.parse(JSON.stringify(fileContent));
        const jsonData = JSON.parse(fileContent);
        console.log("jsondata:\n",jsonData)
        const filename = file.name;

        // Decide environment vs. template
        if (hasDataReference(jsonData)) {
          GLOBAL_SAVED_TEMPLATE[filename] = jsonData;
          showTemporaryAlert(`Saved "${filename}" as a template!`, 2000);
          this.populateDropdown(this.templateDropdown, GLOBAL_SAVED_TEMPLATE);
        } else {
          GLOBAL_SAVED_ENVIRONMENTS[filename] = jsonData;
          showTemporaryAlert(`Saved "${filename}" environment!`, 2000);
          this.populateDropdown(this.envDropdown, GLOBAL_SAVED_ENVIRONMENTS);

          // Refresh cell dropdowns (environment only)
          const currentNbPanel = this.tracker.currentWidget;
          if (currentNbPanel && currentNbPanel instanceof NotebookPanel) {
            refreshAllEnvDropdowns(currentNbPanel);
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
        showTemporaryAlert('Invalid JSON format or upload failed!', 2000, '#A82E2E');
      }
    });

    // 2) Default JSON Template
    const DEFAULT_JSON_TEMPLATE = {
      "editable": true,
      "tags": [],
      "version": "v1.0",
      "workflow": {
        "deployments": {
          "env-name": {
            "config": {},
            "type": "docker"  // default "docker"
          }
        },
        "interpreter": "python3",
        "target": { "deployment": "env-name" },
        "version": "v1.0"
      },
      "trusted": true
    };
    this.dynamicJSON = JSON.parse(JSON.stringify(DEFAULT_JSON_TEMPLATE));
    console.log(this.dynamicJSON)
    // 3) Main Container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'space-between';
    container.style.alignItems = 'flex-start';
    container.style.width = '100%';

    // Left Panel
    const leftPanel = document.createElement('div');
    leftPanel.style.flex = '1';
    leftPanel.style.padding = '8px';
    leftPanel.style.fontFamily = 'sans-serif';
    leftPanel.innerHTML = `<h2>Metadata Form</h2>`;

    // Right Panel
    const rightPanel = document.createElement('div');
    rightPanel.style.flex = '1';
    rightPanel.style.padding = '8px';
    rightPanel.style.fontFamily = 'monospace';
    rightPanel.style.borderLeft = '1px solid #ccc';
    rightPanel.style.marginLeft = '8px';

    // 4) ENV & TEMPLATE DROPDOWNS
    // ENV
    const envLabel = document.createElement('label');
    envLabel.textContent = 'Select Environment: ';
    this.envDropdown = document.createElement('select');
    this.envDropdown.style.marginTop = '8px';
    this.envDropdown.style.marginBottom = '8px';
    this.populateDropdown(this.envDropdown, GLOBAL_SAVED_ENVIRONMENTS);

    this.envDropdown.onchange = () => {
      const selectedEnv = this.envDropdown.value;
      if (selectedEnv && GLOBAL_SAVED_ENVIRONMENTS[selectedEnv]) {
        // Load that environment
        this.dynamicJSON = JSON.parse(JSON.stringify(GLOBAL_SAVED_ENVIRONMENTS[selectedEnv]));
        this.determineLastEnvName();
        this.loadFormFromJSON();
        this.updatePreview();
      }
    };
    leftPanel.appendChild(envLabel);
    leftPanel.appendChild(this.envDropdown);
    leftPanel.appendChild(document.createElement('br'));

    // TEMPLATE
    const templateLabel = document.createElement('label');
    templateLabel.textContent = 'Select Template: ';
    this.templateDropdown = document.createElement('select');
    this.populateDropdown(this.templateDropdown, GLOBAL_SAVED_TEMPLATE);

    this.templateDropdown.onchange = () => {
      const selectedTempl = this.templateDropdown.value;
      if (selectedTempl && GLOBAL_SAVED_TEMPLATE[selectedTempl]) {
        // Load that template
        this.dynamicJSON = JSON.parse(JSON.stringify(GLOBAL_SAVED_TEMPLATE[selectedTempl]));
        this.determineLastEnvName();
        this.loadFormFromJSON();
        this.updatePreview();
      }
    };
    leftPanel.appendChild(templateLabel);
    leftPanel.appendChild(this.templateDropdown);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // 5) ENV NAME
    const labelEnvName = document.createElement('label');
    labelEnvName.textContent = 'Environment Name: ';
    this.inputEnvName = document.createElement('input');
    this.inputEnvName.type = 'text';
    this.inputEnvName.style.marginRight = '8px';

    // On rename => rename in memory
    this.inputEnvName.addEventListener('keyup', () => {
      const newName = this.inputEnvName.value.trim();
      this.renameEnvironmentKey(this.lastEnvName, newName);
    });

    leftPanel.appendChild(labelEnvName);
    leftPanel.appendChild(this.inputEnvName);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // 6) SELECT CONNECTOR
    const labelConnector = document.createElement('label');
    labelConnector.textContent = 'Select Connector: ';
    labelConnector.style.display = 'inline-block';
    labelConnector.style.marginRight = '8px';

    this.selectConnector = document.createElement('select');
    this.selectConnector.style.marginRight = '8px';

    const optPlaceholder = document.createElement('option');
    optPlaceholder.value = '';
    optPlaceholder.text = '--- Select an option ---';
    optPlaceholder.disabled = true;
    optPlaceholder.selected = true;
    this.selectConnector.add(optPlaceholder);

    const optDocker = document.createElement('option');
    optDocker.value = 'docker';
    optDocker.text = 'docker';
    this.selectConnector.add(optDocker);

    const optK8s = document.createElement('option');
    optK8s.value = 'kubernetes';
    optK8s.text = 'kubernetes';
    this.selectConnector.add(optK8s);

    const optSSH = document.createElement('option');
    optSSH.value = 'ssh';
    optSSH.text = 'ssh';
    this.selectConnector.add(optSSH);

    // If the user picks a connector
    this.selectConnector.addEventListener('change', () => {
      console.log("dentro connector")
      const dep = this.getCurrentDeployment();
      console.log("dentro connector " +dep)

      if (dep) {
        console.log("dentro if connector")
        dep.type = this.selectConnector.value;
        this.showConnectorSection(this.selectConnector.value);
        this.updatePreview();
      }
    });

    leftPanel.appendChild(labelConnector);
    leftPanel.appendChild(this.selectConnector);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    // 7) DOCKER / K8S / SSH CONTAINERS
    // Docker
    this.dockerContainer = document.createElement('div');
    this.dockerContainer.style.display = 'none';
    const dockerLabel = document.createElement('label');
    dockerLabel.textContent = 'Docker Image Name: ';
    this.dockerInput = document.createElement('input');
    this.dockerInput.type = 'text';
    this.dockerInput.style.marginRight = '8px';
    this.dockerContainer.appendChild(dockerLabel);
    this.dockerContainer.appendChild(this.dockerInput);
    this.dockerContainer.appendChild(document.createElement('br'));
    this.dockerContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(this.dockerContainer);

    this.dockerInput.addEventListener('keyup', () => {
      const dep = this.getCurrentDeployment();
      if (dep?.type === 'docker') {
        dep.config = { image: this.dockerInput.value.trim() };
        this.updatePreview();
      }
    });

    // K8s
    this.k8sContainer = document.createElement('div');
    this.k8sContainer.style.display = 'none';
    const k8sLabel = document.createElement('label');
    k8sLabel.textContent = 'Kubernetes Files Name: ';
    this.k8sInput = document.createElement('input');
    this.k8sInput.type = 'text';
    this.k8sInput.style.marginRight = '8px';
    this.k8sContainer.appendChild(k8sLabel);
    this.k8sContainer.appendChild(this.k8sInput);
    this.k8sContainer.appendChild(document.createElement('br'));
    this.k8sContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(this.k8sContainer);

    this.k8sInput.addEventListener('keyup', () => {
      const dep = this.getCurrentDeployment();
      if (dep?.type === 'kubernetes') {
        const rawVal = this.k8sInput.value.trim();
        const filesArray = rawVal.split(',').map(s => s.trim()).filter(Boolean);
        dep.config = { files: filesArray };
        this.updatePreview();
      }
    });

    // SSH
    this.sshContainer = document.createElement('div');
    this.sshContainer.style.display = 'none';
    const sshHostLabel = document.createElement('label');
    sshHostLabel.textContent = 'SSH Hostname: ';
    this.sshHostInput = document.createElement('input');
    this.sshHostInput.type = 'text';
    this.sshHostInput.style.marginRight = '8px';
    this.sshContainer.appendChild(sshHostLabel);
    this.sshContainer.appendChild(this.sshHostInput);
    this.sshContainer.appendChild(document.createElement('br'));
    this.sshContainer.appendChild(document.createElement('br'));

    const sshKeyLabel = document.createElement('label');
    sshKeyLabel.textContent = 'SSH Key: ';
    this.sshKeyInput = document.createElement('textarea');
    this.sshKeyInput.style.width = '80%';
    this.sshKeyInput.style.height = '60px';
    this.sshKeyInput.style.marginTop = '8px';
    this.sshKeyInput.style.fontFamily = 'monospace';
    this.sshKeyInput.style.border = '1px solid #ccc';
    this.sshKeyInput.style.borderRadius = '4px';
    this.sshContainer.appendChild(sshKeyLabel);
    this.sshContainer.appendChild(document.createElement('br'));
    this.sshContainer.appendChild(this.sshKeyInput);
    this.sshContainer.appendChild(document.createElement('br'));
    this.sshContainer.appendChild(document.createElement('br'));
    leftPanel.appendChild(this.sshContainer);

    const handleSSHUpdate = () => {
      const dep = this.getCurrentDeployment();
      if (dep?.type === 'ssh') {
        dep.config = {
          hostname: this.sshHostInput.value.trim(),
          sshKey: this.sshKeyInput.value.trim()
        };
        this.updatePreview();
      }
    };
    this.sshHostInput.addEventListener('keyup', handleSSHUpdate);
    this.sshKeyInput.addEventListener('keyup', handleSSHUpdate);

    // 8) RIGHT PANEL PREVIEW + SAVE
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
      const envJson = JSON.parse(JSON.stringify(this.dynamicJSON));
      console.log("envjson",envJson)
      // Decide environment or template
      if (hasDataReference(envJson)) {
        GLOBAL_SAVED_TEMPLATE[this.lastEnvName] = envJson;
        showTemporaryAlert(`Saved "${this.lastEnvName}" as a template!`, 2000);
        this.populateDropdown(this.templateDropdown, GLOBAL_SAVED_TEMPLATE);
      } else {
        GLOBAL_SAVED_ENVIRONMENTS[this.lastEnvName] = envJson;
        showTemporaryAlert(`Saved "${this.lastEnvName}" environment!`, 2000);
        this.populateDropdown(this.envDropdown, GLOBAL_SAVED_ENVIRONMENTS);

        // Refresh cell dropdowns if environment
        const currentNbPanel = this.tracker.currentWidget;
        if (currentNbPanel && currentNbPanel instanceof NotebookPanel) {
          refreshAllEnvDropdowns(currentNbPanel);
        }
      }
    };

    rightPanel.appendChild(headingRight);
    rightPanel.appendChild(this.preTemplate);
    rightPanel.appendChild(saveEnvBtn);
    rightPanel.appendChild(uploadButton);

    container.appendChild(leftPanel);
    container.appendChild(rightPanel);
    this.node.appendChild(container);

    // Initially load the default JSON
    this.loadFormFromJSON();
  }

  /**
   * If the uploaded (or selected) environment/template has 0 or multiple keys,
   * decide which one to use or create a default.
   */
  private determineLastEnvName() {
    const deployments = this.dynamicJSON?.workflow?.deployments || {};
    const keys = Object.keys(deployments);
    if (keys.length === 1) {
      this.lastEnvName = keys[0];
    } else if (keys.length === 0) {
      // Create a default
      deployments['env-name'] = { config: {}, type: '' };
      this.lastEnvName = 'env-name';
    } else {
      // If multiple, you might pick the first or show a dropdown
      this.lastEnvName = keys[0];
    }
  }

  /**
   * Returns the deployment object for `this.lastEnvName`.
   */
  private getCurrentDeployment(): any {
    console.log("obj")
    console.log(Object.keys(this.dynamicJSON))
    
    //console.log(Object.keys(this.dynamicJSON?.workflow?.deployments))
    console.log("dentro funzione "+this.dynamicJSON?.workflow?.deployments?.[0])    
    return this.dynamicJSON?.workflow?.deployments?.[this.lastEnvName];

    //console.log("dentro funzione "+this.dynamicJSON.workflow.deployments.["custom2"])
    return this.dynamicJSON?.workflow?.deployments?.["custom2"];
  }

  /**
   * Show/hide Docker/K8s/SSH sections based on connector type.
   */
  private showConnectorSection(connector: string) {
    this.dockerContainer.style.display = 'none';
    this.k8sContainer.style.display = 'none';
    this.sshContainer.style.display = 'none';

    if (connector === 'docker' || connector == "Docker") {
      this.dockerContainer.style.display = 'block';
    } else if (connector === 'kubernetes'|| connector == "k8s") {
      this.k8sContainer.style.display = 'block';
    } else if (connector === 'ssh' ) {
      this.sshContainer.style.display = 'block';
    }
  }

  /**
   * Loads in-memory JSON into the left form fields.
   * If there's no recognized `type`, we leave the connector as '' and let the user pick.
   */
  private loadFormFromJSON() {
    this.determineLastEnvName();

    const deployments = this.dynamicJSON?.workflow?.deployments || {};
    const dep = deployments[this.lastEnvName];

    // Fill environment name
    this.inputEnvName.value = this.lastEnvName;

    if (!dep) {
      // Nothing? Clear everything
      this.selectConnector.value = '';
      this.showConnectorSection('');
      this.dockerInput.value = '';
      this.k8sInput.value = '';
      this.sshHostInput.value = '';
      this.sshKeyInput.value = '';
      return;
    }

    // If there's no recognized `dep.type`, set it to empty so user sees the placeholder
    if (!dep.type || 
        (dep.type !== 'docker' && dep.type !== 'kubernetes' && dep.type !== 'ssh')) {
      dep.type = ''; // so user can pick from the dropdown
    }

    this.selectConnector.value = dep.type;
    this.showConnectorSection(dep.type);

    // Docker
    if (dep.type === 'docker' && dep.config?.image) {
      this.dockerInput.value = dep.config.image;
    } else {
      this.dockerInput.value = '';
    }

    // K8s
    if (dep.type === 'kubernetes' && Array.isArray(dep.config?.files)) {
      this.k8sInput.value = dep.config.files.join(', ');
    } else {
      this.k8sInput.value = '';
    }

    // SSH
    if (dep.type === 'ssh') {
      this.sshHostInput.value = dep.config?.hostname || '';
      this.sshKeyInput.value = dep.config?.sshKey || '';
    } else {
      this.sshHostInput.value = '';
      this.sshKeyInput.value = '';
    }
  }

  /**
   * Renames the environment key in memory.
   */
  private renameEnvironmentKey(oldKey: string, newKey: string) {
    if (!newKey || oldKey === newKey) return;
    const deployments = this.dynamicJSON.workflow?.deployments;
    if (!deployments || !deployments[oldKey]) return;

    deployments[newKey] = deployments[oldKey];
    delete deployments[oldKey];

    if (this.dynamicJSON.workflow.target?.deployment === oldKey) {
      this.dynamicJSON.workflow.target.deployment = newKey;
    }
    this.lastEnvName = newKey;
    this.inputEnvName.value = newKey;
    this.updatePreview();
  }

  /**
   * Updates the JSON preview in the right panel.
   */
  private updatePreview() {
    this.preTemplate.textContent = JSON.stringify(this.dynamicJSON, null, 2);
  }

  /**
   * Populates a dropdown menu with keys from a data dictionary, plus a placeholder.
   */
  private populateDropdown(dropdown: HTMLSelectElement, data: { [key: string]: any }) {
    while (dropdown.firstChild) {
      dropdown.removeChild(dropdown.firstChild);
    }
    const placeholder = document.createElement('option');
    placeholder.text = '--- Select an option ---';
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    dropdown.appendChild(placeholder);

    Object.keys(data).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      dropdown.appendChild(option);
    });
  }
}
