import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { updateEnvDropdown } from './sharedUtils.ts';

export function addMetadataSection(cell: Cell): void {
  if (cell.node.querySelector('.metadata-section')) return;

  const metadataSection = document.createElement('div');
  metadataSection.className = 'metadata-section';
  metadataSection.style.border = '1px solid #ddd';
  metadataSection.style.padding = '4px';
  metadataSection.style.marginBottom = '8px';

  const metadataDisplay = document.createElement('pre');
  metadataDisplay.style.backgroundColor = '#f7f7f7';
  metadataSection.appendChild(metadataDisplay);

  cell.node.insertBefore(metadataSection, cell.node.firstChild);
}

export function addEnvDropdownToCell(cell: Cell): void {
  if (cell.node.querySelector('.env-dropdown-container')) return;

  const container = document.createElement('div');
  container.className = 'env-dropdown-container';

  const select = document.createElement('select');
  container.appendChild(select);
  cell.node.insertBefore(container, cell.node.firstChild);
}

export function refreshAllEnvDropdowns(notebookPanel: NotebookPanel): void {
  notebookPanel.content.widgets.forEach(cell => {
    updateEnvDropdown(cell);
  });
}
