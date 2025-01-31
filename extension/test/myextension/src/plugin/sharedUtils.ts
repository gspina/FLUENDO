import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';

export const GLOBAL_SAVED_ENVIRONMENTS: { [envName: string]: any } = {};

/**
 * Displays a temporary alert message on the screen.
 */
export function showTemporaryAlert(message: string, duration = 1000, color = '#4A9340'): void {
  const alertDiv = document.createElement('div');
  alertDiv.textContent = message;
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '10px';
  alertDiv.style.right = '10px';
  alertDiv.style.backgroundColor = color;
  alertDiv.style.color = '#F0F0F0';
  alertDiv.style.padding = '10px 20px';
  alertDiv.style.borderRadius = '4px';
  document.body.appendChild(alertDiv);
  setTimeout(() => {
    document.body.removeChild(alertDiv);
  }, duration);
}

/**
 * Updates the environment dropdown in a cell to reflect the current state
 * of the `GLOBAL_SAVED_ENVIRONMENTS`.
 */
export function updateEnvDropdown(cell: Cell): void {
  const container = cell.node.querySelector('.env-dropdown-container');
  if (!container) return;

  const select = container.querySelector('select');
  if (!select) return;

  // Clear existing options
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  // Add placeholder
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '--- Envs ---';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  // Populate dropdown with keys from GLOBAL_SAVED_ENVIRONMENTS
  Object.keys(GLOBAL_SAVED_ENVIRONMENTS).forEach(envName => {
    const opt = document.createElement('option');
    opt.value = envName;
    opt.textContent = envName;
    select.appendChild(opt);
  });
}

/**
 * Refreshes all environment dropdowns in the cells of a given notebook panel.
 */
export function refreshAllEnvDropdowns(notebookPanel: NotebookPanel): void {
  notebookPanel.content.widgets.forEach(cell => {
    updateEnvDropdown(cell);
  });
}
