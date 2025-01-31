import {
    JupyterFrontEnd,
  } from '@jupyterlab/application';
  
  import {
    INotebookTracker,
    NotebookPanel,
    INotebookModel
  } from '@jupyterlab/notebook';
  
  import {
    DocumentRegistry
  } from '@jupyterlab/docregistry';
  
  import {
    ToolbarButton
  } from '@jupyterlab/apputils';
  
  import {
    DisposableDelegate
  } from '@lumino/disposable';

  import {MetadataFormWidget} from "./MetadataFormWidget"

/**
 * A notebook toolbar button that opens our "MetadataFormWidget" in a new tab.
 * We store the INotebookTracker so the form can reference the current notebook.
 */
export class NotebookButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
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