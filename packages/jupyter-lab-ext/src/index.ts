import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';

declare global {
  interface Window {
    pyodide: any;
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-iframe-bridge-example:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    notebooks: INotebookTracker) => {
    console.log('JupyterLab iframe-bridge is active');

    // Listen for messages from the parent window
    window.addEventListener('message', async (event) => {
      console.log('Message received in JupyterLab iframe:', event.data);
      
      switch (event.data.type) {
        case 'clickDiv':
          try {
            const divToClick = Array.from(document.querySelectorAll('*')).find(
              (el): el is HTMLElement => {
                if ('title' in el) {
                  return (el as HTMLElement).title.toLowerCase() === event.data.title.toLowerCase();
                }
                return false;
              }
            );
            
            if (divToClick) {
              console.log('Div found:', divToClick);
              console.log('Attempting to click div...');
              divToClick.click();
              console.log('Click attempt completed');
            } else {
              console.error('Div not found with title:', event.data.title);
            }
          } catch (error) {
            console.error('Error clicking div:', error);
          }
          break;

        case 'add_cell':
          const current = notebooks.currentWidget;
          if (!current || !current.content) {
            return;
          }
          const notebook = current?.content;
          NotebookActions.insertBelow(notebook);
          const activeCell = notebook.activeCell;
          activeCell &&
            event.data.content &&
            activeCell.model.sharedModel.setSource(event.data.content);
      }
    });

    // Notify parent that JupyterLab is ready
    window.parent.postMessage({ type: "jupyter-ready" }, "*");
    console.log('Message sent to host: jupyter-ready');

    // Toggle left area (sidebar)
    try {
      await app.commands.execute('application:toggle-left-area');
    } catch (error) {
      console.error('Error toggling left area:', error);
    }

    // Delay widget initialization
    setTimeout(() => {
      // Initialize your widgets here
      console.log('Initializing widgets');
      // ... widget initialization code ...
    }, 2000); // 2 second delay
  }
};

export default plugin;