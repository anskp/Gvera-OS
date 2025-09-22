/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {Rnd} from 'react-rnd';
import {InteractionData, WindowState} from '../types';
import {GeneratedContent} from './GeneratedContent';

interface WindowProps {
  state: WindowState;
  isFocused: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onUpdate: (updates: Partial<WindowState>) => void;
  onInteract?: (data: InteractionData) => void;
  isResizable?: boolean;
  children?: React.ReactNode;
}

const TitleBar: React.FC<{
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}> = ({title, onClose, onMinimize, onMaximize, isMaximized}) => (
  <div className="h-8 bg-[var(--titlebar-bg)] backdrop-blur-md text-[var(--titlebar-text)] flex items-center justify-between px-2 select-none rounded-t-lg border-b border-white/10 cursor-move title-bar-handle">
    <span className="text-sm font-medium truncate pl-1">{title}</span>
    <div className="flex items-center space-x-1">
      <button
        onClick={onMinimize}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
        aria-label="Minimize">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button
        onClick={onMaximize}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
        aria-label={isMaximized ? 'Restore' : 'Maximize'}>
        {isMaximized ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        )}
      </button>
      <button
        onClick={onClose}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500 transition-colors"
        aria-label="Close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
);

export const Window: React.FC<WindowProps> = ({
  state,
  isFocused,
  onClose,
  onFocus,
  onMinimize,
  onUpdate,
  onInteract,
  isResizable = true,
  children,
}) => {
  const {x, y, width, height, isMaximized, isMinimized, zIndex, app} = state;

  const handleMaximize = () => {
    onUpdate({isMaximized: !isMaximized});
  };

  if (isMinimized) {
    return null;
  }

  return (
    <Rnd
      size={
        isMaximized
          ? {width: '100%', height: 'calc(100% - 80px)'}
          : {width, height}
      }
      position={isMaximized ? {x: 0, y: 0} : {x, y}}
      onDragStart={onFocus}
      onDragStop={(e, d) => onUpdate({x: d.x, y: d.y})}
      onResizeStart={onFocus}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          ...position,
        });
      }}
      minWidth={300}
      minHeight={200}
      style={{zIndex}}
      className={`flex flex-col rounded-lg shadow-2xl transition-all duration-100 ring-1 ${
        isFocused ? 'ring-[var(--window-border-focused)] ring-2' : 'ring-[var(--window-border)]'
      }`}
      dragHandleClassName="title-bar-handle"
      disableDragging={isMaximized}
      enableResizing={isResizable && !isMaximized}>
      <TitleBar
        title={app.name}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={handleMaximize}
        isMaximized={isMaximized}
      />
      <div
        className="flex-grow bg-[var(--window-bg)] backdrop-blur-lg overflow-hidden rounded-b-lg"
        onClick={onFocus}>
        {children ? (
          children
        ) : (
          <>
            {state.isLoading && state.content.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {state.error && (
              <div className="p-4 text-red-600 bg-red-100 rounded-md">
                {state.error}
              </div>
            )}
            <GeneratedContent
              htmlContent={state.content}
              onInteract={onInteract!}
              appContext={app.id}
              isLoading={state.isLoading}
            />
          </>
        )}
      </div>
    </Rnd>
  );
};
