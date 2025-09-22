/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {Desktop} from './components/Desktop';
import {ParametersPanel} from './components/ParametersPanel';
import {StartMenu} from './components/StartMenu';
import {Taskbar} from './components/Taskbar';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {
  AppDefinition,
  InteractionData,
  VFSNode,
  WindowState,
} from './types';
import {findNode, initialVFS, updateVFSNode} from './vfs';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10); // Starting z-index for windows
  const [virtualFileSystem, setVirtualFileSystem] =
    useState<VFSNode>(initialVFS);

  // State for parameters that affect all apps
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] =
    useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] =
    useState<boolean>(false);
  const [appContentCache, setAppContentCache] = useState<
    Record<string, string>
  >({});

  const updateWindowState = useCallback(
    (id: string, updates: Partial<WindowState>) => {
      setWindows((prev) =>
        prev.map((win) => (win.id === id ? {...win, ...updates} : win)),
      );
    },
    [],
  );

  const internalHandleLlmRequest = useCallback(
    async (
      windowId: string,
      historyForLlm: InteractionData[],
      maxHistoryLength: number,
    ) => {
      if (historyForLlm.length === 0) {
        updateWindowState(windowId, {
          error: 'No interaction data to process.',
        });
        return;
      }

      updateWindowState(windowId, {isLoading: true, error: null});

      let accumulatedContent = '';
      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength);
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setWindows((prev) =>
            prev.map((win) =>
              win.id === windowId
                ? {...win, content: win.content + chunk}
                : win,
            ),
          );
        }
      } catch (e: any) {
        const errorMsg = 'Failed to stream content from the API.';
        updateWindowState(windowId, {
          error: errorMsg,
          content: `<div class="p-4 text-red-600 bg-red-100 rounded-md">${errorMsg}</div>`,
        });
        console.error(e);
      } finally {
        updateWindowState(windowId, {isLoading: false});
      }
    },
    [updateWindowState],
  );

  useEffect(() => {
    windows.forEach((win) => {
      if (
        !win.isLoading &&
        win.appPath.length > 0 &&
        isStatefulnessEnabled &&
        win.content
      ) {
        const cacheKey = win.appPath.join('__');
        if (appContentCache[cacheKey] !== win.content) {
          setAppContentCache((prevCache) => ({
            ...prevCache,
            [cacheKey]: win.content,
          }));
        }
      }
    });
  }, [windows, isStatefulnessEnabled, appContentCache]);

  const handleFocusWindow = (id: string) => {
    if (id !== focusedWindowId) {
      setFocusedWindowId(id);
      setNextZIndex((prev) => prev + 1);
      updateWindowState(id, {zIndex: nextZIndex});
    }
    if (isStartMenuOpen) {
      setIsStartMenuOpen(false);
    }
  };

  const handleOpenApp = (app: AppDefinition) => {
    setIsStartMenuOpen(false); // Close start menu when opening an app

    const existingWindow = windows.find((win) => win.app.id === app.id);
    if (existingWindow) {
      if (existingWindow.isMinimized) {
        updateWindowState(existingWindow.id, {isMinimized: false});
      }
      handleFocusWindow(existingWindow.id);
      return;
    }

    const windowId = `${app.id}-${Date.now()}`;
    const initialInteraction: InteractionData = {
      id: app.id,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };
    if (app.id === 'file_explorer_app') {
      const rootNode = findNode(virtualFileSystem, ['root']);
      initialInteraction.context = {vfs: rootNode};
    }

    const newHistory = [initialInteraction];
    const newPath = [app.id];
    const cacheKey = newPath.join('__');

    const newWindow: WindowState = {
      id: windowId,
      app,
      x: 50 + windows.length * 20,
      y: 50 + windows.length * 20,
      width: 800,
      height: 600,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      content: app.id === 'settings_app' ? ' ' : '', // prevent loading for settings
      isLoading: app.id !== 'settings_app',
      error: null,
      interactionHistory: newHistory,
      appPath: newPath,
      vfsPath: app.id === 'file_explorer_app' ? ['root'] : undefined,
    };

    setWindows((prev) => [...prev, newWindow]);
    setFocusedWindowId(windowId);
    setNextZIndex((prev) => prev + 1);

    if (app.id === 'settings_app') return;

    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      updateWindowState(windowId, {
        content: appContentCache[cacheKey],
        isLoading: false,
      });
    } else {
      internalHandleLlmRequest(windowId, newHistory, currentMaxHistoryLength);
    }
  };

  const handleCloseWindow = (id: string) => {
    setWindows((prev) => prev.filter((win) => win.id !== id));
    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  };

  const handleToggleMinimize = (id: string) => {
    const window = windows.find((win) => win.id === id);
    if (window) {
      updateWindowState(id, {isMinimized: !window.isMinimized});
      if (!window.isMinimized) {
        setFocusedWindowId(null);
      } else {
        handleFocusWindow(id);
      }
    }
  };

  const handleInteraction = useCallback(
    async (windowId: string, interactionData: InteractionData) => {
      const window = windows.find((win) => win.id === windowId);
      if (!window) return;

      let newVfsPath = window.vfsPath;

      // Handle File Explorer specific interactions
      if (window.app.id === 'file_explorer_app' && window.vfsPath) {
        const interactionId = interactionData.id;
        if (interactionId.startsWith('navigate_folder_')) {
          const folderName = interactionId.replace('navigate_folder_', '');
          newVfsPath = [...window.vfsPath, folderName];
        } else if (interactionId === 'navigate_up') {
          if (window.vfsPath.length > 1) {
            newVfsPath = window.vfsPath.slice(0, -1);
          }
        } else if (
          interactionId === 'create_folder_confirm' &&
          interactionData.value
        ) {
          const newFolderName = interactionData.value.trim();
          if (newFolderName) {
            const newNode: VFSNode = {
              id: `folder_${newFolderName.toLowerCase().replace(' ', '_')}_${Date.now()}`,
              name: newFolderName,
              type: 'folder',
              children: [],
            };
            const updatedVFS = updateVFSNode(
              virtualFileSystem,
              window.vfsPath,
              'add',
              newNode,
            );
            setVirtualFileSystem(updatedVFS);
          }
        }
        // Add context for the LLM
        interactionData.context = {vfs: findNode(virtualFileSystem, newVfsPath!)};
      }

      const newHistory = [
        interactionData,
        ...window.interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      const newPath = [...window.appPath, interactionData.id];
      const cacheKey = newPath.join('__');

      updateWindowState(windowId, {
        interactionHistory: newHistory,
        appPath: newPath,
        content: '',
        error: null,
        vfsPath: newVfsPath, // Update vfsPath in state
      });

      if (isStatefulnessEnabled && appContentCache[cacheKey]) {
        updateWindowState(windowId, {
          content: appContentCache[cacheKey],
          isLoading: false,
        });
      } else {
        internalHandleLlmRequest(windowId, newHistory, currentMaxHistoryLength);
      }
    },
    [
      windows,
      updateWindowState,
      internalHandleLlmRequest,
      currentMaxHistoryLength,
      isStatefulnessEnabled,
      appContentCache,
      virtualFileSystem,
    ],
  );

  const handleUpdateHistoryLength = (newLength: number) => {
    setCurrentMaxHistoryLength(newLength);
    // Trim history for all open windows
    setWindows((prev) =>
      prev.map((win) => ({
        ...win,
        interactionHistory: win.interactionHistory.slice(0, newLength),
      })),
    );
  };

  const handleSetStatefulness = (enabled: boolean) => {
    setIsStatefulnessEnabled(enabled);
    if (!enabled) {
      setAppContentCache({});
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Desktop onOpenApp={handleOpenApp}>
        {windows.map((win) => {
          if (win.app.id === 'settings_app') {
            return (
              <Window
                key={win.id}
                state={win}
                isFocused={focusedWindowId === win.id}
                onClose={() => handleCloseWindow(win.id)}
                onFocus={() => handleFocusWindow(win.id)}
                onMinimize={() => handleToggleMinimize(win.id)}
                onUpdate={(updates) => updateWindowState(win.id, updates)}
                isResizable={false}>
                <ParametersPanel
                  currentLength={currentMaxHistoryLength}
                  onUpdateHistoryLength={handleUpdateHistoryLength}
                  onClosePanel={() => handleCloseWindow(win.id)}
                  isStatefulnessEnabled={isStatefulnessEnabled}
                  onSetStatefulness={handleSetStatefulness}
                />
              </Window>
            );
          }
          return (
            <Window
              key={win.id}
              state={win}
              isFocused={focusedWindowId === win.id}
              onClose={() => handleCloseWindow(win.id)}
              onFocus={() => handleFocusWindow(win.id)}
              onMinimize={() => handleToggleMinimize(win.id)}
              onUpdate={(updates) => updateWindowState(win.id, updates)}
              onInteract={(data) => handleInteraction(win.id, data)}
            />
          );
        })}
      </Desktop>
      {isStartMenuOpen && (
        <StartMenu
          apps={APP_DEFINITIONS_CONFIG}
          onOpenApp={handleOpenApp}
          onClose={() => setIsStartMenuOpen(false)}
        />
      )}
      <Taskbar
        openWindows={windows}
        onFocusWindow={handleFocusWindow}
        onToggleMinimize={handleToggleMinimize}
        onToggleStartMenu={() => setIsStartMenuOpen((p) => !p)}
      />
    </div>
  );
};

export default App;
