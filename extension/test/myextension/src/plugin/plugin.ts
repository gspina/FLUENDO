import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookButtonExtension } from './notebookButtonExtension.ts';
import { addMetadataSection, addEnvDropdownToCell, refreshAllEnvDropdowns } from './cellUtils.ts';

export function activatePlugin(app: JupyterFrontEnd, tracker: INotebookTracker): void {
  console.log('Cell Metadata Editor + Env Dropdown Plugin activated! ww');
  app.docRegistry.addWidgetExtension('Notebook', new NotebookButtonExtension(app, tracker));

  tracker.widgetAdded.connect((_, notebookPanel) => {
    notebookPanel.context.ready.then(() => {
      const { content } = notebookPanel;

      content.widgets.forEach(cell => {
        addMetadataSection(cell);
        addEnvDropdownToCell(cell);
      });

      content.activeCellChanged.connect(() => {
        const cell = content.activeCell;
        if (cell) {
          addMetadataSection(cell);
          addEnvDropdownToCell(cell);
        }
      });
    });
  });
}
