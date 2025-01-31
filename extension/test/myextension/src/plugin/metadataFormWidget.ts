import { Widget } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';
import { GLOBAL_SAVED_ENVIRONMENTS, refreshAllEnvDropdowns, showTemporaryAlert } from './sharedUtils.ts';

export class MetadataFormWidget extends Widget {
  private dynamicJSON: any;
  private preTemplate: HTMLPreElement;
  private lastEnvName = 'env-name';

  constructor(private tracker: INotebookTracker) {
    super();
    this.id = 'metadata-form-widget';
    this.title.label = 'Metadata Form';
    this.title.closable = true;

    const DEFAULT_JSON_TEMPLATE = {
      editable: true,
      tags: [],
      version: 'v1.0',
      workflow: {
        deployments: {
          'env-name': { config: {}, type: 'docker' },
        },
        interpreter: 'python3',
        target: { deployment: 'env-name' },
        version: 'v1.0',
      },
      trusted: true,
    };
    this.dynamicJSON = JSON.parse(JSON.stringify(DEFAULT_JSON_TEMPLATE));

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'space-between';
    container.style.alignItems = 'flex-start';
    container.style.width = '100%';

    const leftPanel = document.createElement('div');
    leftPanel.style.flex = '1';
    leftPanel.style.padding = '8px';
    leftPanel.style.fontFamily = 'sans-serif';

    const rightPanel = document.createElement('div');
    rightPanel.style.flex = '1';
    rightPanel.style.padding = '8px';
    rightPanel.style.fontFamily = 'monospace';
    rightPanel.style.borderLeft = '1px solid #ccc';
    rightPanel.style.marginLeft = '8px';

    leftPanel.innerHTML = `<h2>Metadata Form</h2>`;
    const labelEnvName = document.createElement('label');
    labelEnvName.textContent = 'Environment Name: ';
    const inputEnvName = document.createElement('input');
    inputEnvName.type = 'text';
    inputEnvName.style.marginRight = '8px';
    leftPanel.appendChild(labelEnvName);
    leftPanel.appendChild(inputEnvName);
    leftPanel.appendChild(document.createElement('br'));
    leftPanel.appendChild(document.createElement('br'));

    inputEnvName.addEventListener('keyup', () => {
      const newName = inputEnvName.value.trim();
      this.renameEnvironmentKey(this.lastEnvName, newName);
    });

    const saveEnvBtn = document.createElement('button');
    saveEnvBtn.textContent = 'Save Environment';
    saveEnvBtn.style.display = 'block';
    saveEnvBtn.style.marginTop = '12px';
    saveEnvBtn.onclick = () => {
      const envJson = JSON.parse(JSON.stringify(this.dynamicJSON));
      GLOBAL_SAVED_ENVIRONMENTS[this.lastEnvName] = envJson;
      showTemporaryAlert(`Saved "${this.lastEnvName}" environment!`, 2000);
      const currentNbPanel = this.tracker.currentWidget;
      if (currentNbPanel) {
        refreshAllEnvDropdowns(currentNbPanel);
      }
    };

    this.preTemplate = document.createElement('pre');
    this.preTemplate.style.backgroundColor = '#f7f7f7';
    this.preTemplate.style.padding = '8px';
    this.preTemplate.style.border = '1px solid #ddd';
    this.preTemplate.style.borderRadius = '4px';
    this.preTemplate.style.whiteSpace = 'pre-wrap';
    this.preTemplate.textContent = JSON.stringify(this.dynamicJSON, null, 2);

    rightPanel.appendChild(this.preTemplate);
    rightPanel.appendChild(saveEnvBtn);

    container.appendChild(leftPanel);
    container.appendChild(rightPanel);
    this.node.appendChild(container);
  }

  private renameEnvironmentKey(oldKey: string, newKey: string): void {
    if (!newKey || oldKey === newKey) return;
    if (!this.dynamicJSON.workflow.deployments[oldKey]) return;
    const oldVal = this.dynamicJSON.workflow.deployments[oldKey];
    delete this.dynamicJSON.workflow.deployments[oldKey];
    this.dynamicJSON.workflow.deployments[newKey] = oldVal;

    if (this.dynamicJSON.workflow.target.deployment === oldKey) {
      this.dynamicJSON.workflow.target.deployment = newKey;
    }
    this.lastEnvName = newKey;
    this.updatePreview();
  }

  private updatePreview(): void {
    this.preTemplate.textContent = JSON.stringify(this.dynamicJSON, null, 2);
  }
}
