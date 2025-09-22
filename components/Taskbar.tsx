/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState, useRef} from 'react';
import {AppDefinition, WindowState, VFSNode} from '../types';
import {APP_DEFINITIONS_CONFIG} from '../constants';

interface TaskbarProps {
  openWindows: WindowState[];
  onFocusWindow: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onToggleStartMenu: () => void;
  onOpenApp: (app: AppDefinition) => void;
  vfs: VFSNode;
}

type SearchResult = {
  type: 'app' | 'file';
  name: string;
  icon: string;
  data: AppDefinition | VFSNode;
  path?: string[];
};

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="text-sm px-3 text-center text-[var(--text-primary)]">
      <div>{time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
      <div className="text-xs opacity-70">{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
    </div>
  );
};

const searchVFS = (node: VFSNode, query: string, path: string[]): SearchResult[] => {
  let results: SearchResult[] = [];
  const nodeNameLower = node.name.toLowerCase();
  const queryLower = query.toLowerCase();

  if (node.type === 'file' && nodeNameLower.includes(queryLower)) {
    results.push({
      type: 'file',
      name: node.name,
      icon: '📄',
      data: node,
      path: [...path, node.name],
    });
  }

  if (node.type === 'folder' && node.children) {
    for (const child of node.children) {
      results = results.concat(searchVFS(child, query, [...path, node.name]));
    }
  }
  return results;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  onFocusWindow,
  onToggleMinimize,
  onToggleStartMenu,
  onOpenApp,
  vfs,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    // Search apps
    const appResults: SearchResult[] = APP_DEFINITIONS_CONFIG
      .filter(app => app.name.toLowerCase().includes(query.toLowerCase()))
      .map(app => ({
        type: 'app',
        name: app.name,
        icon: app.icon,
        data: app,
      }));

    // Search files
    const fileResults = searchVFS(vfs, query, []);

    setResults([...appResults, ...fileResults]);
  }, [query, vfs]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleTaskbarIconClick = (win: WindowState) => {
    if (win.isMinimized) {
      onToggleMinimize(win.id);
    }
    onFocusWindow(win.id);
  };
  
  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'app') {
      onOpenApp(result.data as AppDefinition);
    } else {
      // For files, open the file explorer app
      const fileExplorerApp = APP_DEFINITIONS_CONFIG.find(app => app.id === 'file_explorer_app');
      if (fileExplorerApp) {
        onOpenApp(fileExplorerApp);
      }
    }
    setQuery('');
    setIsSearchActive(false);
  }

  return (
    <div className="absolute bottom-4 left-0 right-0 h-16 flex justify-center items-center pointer-events-none z-50">
      <div className="flex items-center gap-2 h-12 px-3 bg-[var(--taskbar-bg)] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg pointer-events-auto text-white">
        {/* Start Button */}
        <button
          onClick={onToggleStartMenu}
          className="w-10 h-10 flex items-center justify-center text-xl hover:bg-black/10 transition-colors rounded-lg text-[var(--text-primary)]"
          aria-label="Open Start Menu">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16">
            <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v5A1.5 1.5 0 0 0 6.5 8h5A1.5 1.5 0 0 0 13 6.5v-5A1.5 1.5 0 0 0 11.5 0h-5zM1.5 0A1.5 1.5 0 0 0 0 1.5v5A1.5 1.5 0 0 0 1.5 8h2A1.5 1.5 0 0 0 5 6.5v-5A1.5 1.5 0 0 0 3.5 0h-2zM6.5 9.5A1.5 1.5 0 0 0 5 11v3.5A1.5 1.5 0 0 0 6.5 16h5a1.5 1.5 0 0 0 1.5-1.5V11a1.5 1.5 0 0 0-1.5-1.5h-5zM1.5 9.5A1.5 1.5 0 0 0 0 11v3.5A1.5 1.5 0 0 0 1.5 16h2a1.5 1.5 0 0 0 1.5-1.5V11a1.5 1.5 0 0 0-1.5-1.5h-2z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-[var(--divider-color)]"></div>

        {/* App Icons */}
        <div className="flex items-center h-full">
          {openWindows.map((win) => (
            <div
              key={win.id}
              onClick={() => handleTaskbarIconClick(win)}
              className={`relative flex items-center justify-center w-10 h-10 cursor-pointer transition-colors hover:bg-black/5 rounded-md`}
              title={win.app.name}>
              <span className="text-2xl">{win.app.icon}</span>
              <div
                className={`absolute bottom-1 w-4 h-1 rounded-full transition-all ${
                  !win.isMinimized ? 'bg-blue-400' : 'bg-transparent'
                }`}></div>
            </div>
          ))}
        </div>
        
        {openWindows.length > 0 && <div className="w-px h-6 bg-[var(--divider-color)]"></div>}


        {/* Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center bg-gray-900/50 rounded-full h-9 w-72 hover:bg-gray-900/80 transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 mx-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                  type="text"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearchActive(true)}
                  className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full h-full placeholder-[var(--text-placeholder)] text-sm pr-4"
              />
          </div>
          {isSearchActive && query && (
            <div className="absolute bottom-full mb-2 w-full bg-[var(--startmenu-bg)] backdrop-blur-2xl border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.length > 0 ? (
                <ul>
                  {results.map((result, index) => (
                    <li key={index}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center p-2 hover:bg-white/10 cursor-pointer text-[var(--text-primary)]">
                      <span className="text-2xl mr-3">{result.icon}</span>
                      <span>{result.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                 <div className="p-2 text-center text-sm text-[var(--text-tertiary)]">No results found</div>
              )}
            </div>
          )}
        </div>


        <div className="w-px h-6 bg-[var(--divider-color)]"></div>

        {/* Clock */}
        <Clock />
      </div>
    </div>
  );
};
