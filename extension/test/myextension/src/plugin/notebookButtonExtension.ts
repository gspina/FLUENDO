import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DisposableDelegate } from '@lumino/disposable';
import { MetadataFormWidget } from './metadataFormWidget.ts';

export class NotebookButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(private app: JupyterFrontEnd, private tracker: INotebookTracker) {}

  createNew(panel: NotebookPanel): DisposableDelegate {
    const button = new ToolbarButton({
      label: 'Metadata Form',
      onClick: () => {
        const formWidget = new MetadataFormWidget(this.tracker);
        this.app.shell.add(formWidget, 'main');
        this.app.shell.activateById(formWidget.id);
      },
      tooltip: 'Open a metadata form in a new tab',
    });

    panel.toolbar.insertItem(0, 'openMetadataForm', button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
