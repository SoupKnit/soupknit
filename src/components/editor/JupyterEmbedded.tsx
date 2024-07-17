import React, { forwardRef, useCallback, useRef, useEffect, useState } from "react"

interface JupyterApp {
  commands: {
    execute: (command: string) => Promise<void>;
  };
}

interface JupyterWindow extends Window {
  jupyterapp?: JupyterApp;
}

interface JupyterEmbeddedProps {
  className?: string;
  onLoad?: () => void;
}

const JupyterEmbedded = forwardRef<HTMLIFrameElement, JupyterEmbeddedProps>(
  (props, ref) => {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const resolvedRef = (ref ?? internalRef) as React.RefObject<HTMLIFrameElement>
    const [theme, setTheme] = useState("Default")
    const [isJupyterReady, setIsJupyterReady] = useState(false)

    const sendMessageToIframe = useCallback((message: any) => {
      if (resolvedRef.current?.contentWindow) {
        resolvedRef.current.contentWindow.postMessage(message, '*');
        console.log('Message sent to iframe:', message);
      } else {
        console.error('Iframe or contentWindow not found');
      }
    }, [resolvedRef]);

    const clickDivInIframe = useCallback((divIdentifier: string) => {
      sendMessageToIframe({
        type: 'clickDiv',
        title: divIdentifier
      });
    }, [sendMessageToIframe]);

    const executeJupyterCommand = useCallback(async (command: string) => {
      if (resolvedRef.current?.contentWindow) {
        const jupyterWindow = resolvedRef.current.contentWindow as JupyterWindow;
        if (jupyterWindow.jupyterapp) {
          try {
            await jupyterWindow.jupyterapp.commands.execute(command);
            console.log(`Executed command: ${command}`);
          } catch (error) {
            console.error(`Error executing command ${command}:`, error);
          }
        } else {
          console.error('JupyterLab app not found in iframe');
        }
      }
    }, [resolvedRef])

    const toggleLeftArea = useCallback(() => {
      executeJupyterCommand('application:toggle-left-area');
      executeJupyterCommand('application:toggle-side-tabbar');
      executeJupyterCommand('recentmenu:open-recent');
    }, [executeJupyterCommand])

    const toggleMode = useCallback(() => {
      executeJupyterCommand('application:toggle-mode');
    }, [executeJupyterCommand])

    const toggleSideTabbar = useCallback(() => {
      executeJupyterCommand('application:toggle-side-tabbar');
      executeJupyterCommand('statusbar:toggle');
      executeJupyterCommand('apputils:toggle-header');
    }, [executeJupyterCommand])

    const addCell = useCallback(() => {
      executeJupyterCommand('notebook:insert-cell-below');
    }, [executeJupyterCommand])

    // Effect to check if JupyterLab is ready
    useEffect(() => {
      const checkJupyterReady = () => {
        if (resolvedRef.current?.contentWindow) {
          const jupyterWindow = resolvedRef.current.contentWindow as JupyterWindow;
          if (jupyterWindow.jupyterapp) {
            setIsJupyterReady(true);
            clearInterval(intervalId);
            console.log('JupyterLab is ready');
            // Execute the command to toggle left area when JupyterLab is ready
            toggleLeftArea();
            toggleMode();
            toggleSideTabbar();
            clickDivInIframe("Python (Pyodide)");
          }
        }
      };

      const intervalId = setInterval(checkJupyterReady, 2000);

      return () => clearInterval(intervalId);
    }, [toggleLeftArea, toggleMode, toggleSideTabbar, clickDivInIframe])

    // Add an effect to listen for messages from the iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        console.log('Message received from iframe:', event.data);
        // Handle the message here
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, []);

    return (
      <iframe
        ref={resolvedRef}
        id="jupyter-embedded"
        title="JupyterLab Embedded"
        name="jupyterlab"
        src="/jupy_lite/lab/index.html?kernel=python"
        className={props.className}
        sandbox="allow-scripts allow-same-origin"
        onLoad={props.onLoad}
      />
    )
  }
)

JupyterEmbedded.displayName = "JupyterEmbedded"

export default JupyterEmbedded