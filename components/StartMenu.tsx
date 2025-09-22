/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef} from 'react';
import {AppDefinition} from '../types';

interface StartMenuProps {
  apps: AppDefinition[];
  onOpenApp: (app: AppDefinition) => void;
  onClose: () => void;
}

const AppIcon: React.FC<{
  app: AppDefinition;
  onInteract: () => void;
}> = ({app, onInteract}) => {
  return (
    <div
      className="w-24 h-28 flex flex-col items-center justify-start text-center p-2 cursor-pointer select-none rounded-lg transition-colors hover:bg-white/20 text-[var(--text-primary)]"
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}>
      <div className="text-5xl mb-2 drop-shadow-lg">{app.icon}</div>
      <div className="text-xs font-medium break-words max-w-full leading-tight">
        {app.name}
      </div>
    </div>
  );
};

export const StartMenu: React.FC<StartMenuProps> = ({
  apps,
  onOpenApp,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        const startButton = (event.target as HTMLElement).closest(
          '[aria-label="Open Start Menu"]',
        );
        if (!startButton) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[550px] h-[600px] bg-[var(--startmenu-bg)] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg z-40 flex flex-col p-4 animate-fade-in-up"
      style={
        {
          '--animate-duration': '200ms',
        } as React.CSSProperties
      }>
      {/* Search Bar */}
      <div className="flex-shrink-0 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for apps, files, and settings"
            className="w-full h-10 pl-10 pr-4 bg-white/10 text-[var(--text-primary)] rounded-lg border-none focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Pinned Apps */}
      <div className="flex-grow overflow-y-auto">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] px-2 mb-2">
          All Apps
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {apps.map((app) => (
            <AppIcon key={app.id} app={app} onInteract={() => onOpenApp(app)} />
          ))}
        </div>
      </div>
    </div>
  );
};
