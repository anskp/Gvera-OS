/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState} from 'react';
import {WindowState} from '../types';

interface TaskbarProps {
  openWindows: WindowState[];
  onFocusWindow: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onToggleStartMenu: () => void;
}

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="text-sm px-3 text-center text-white">
      <div>{time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
      <div className="text-xs opacity-70">{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
    </div>
  );
};

export const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  onFocusWindow,
  onToggleMinimize,
  onToggleStartMenu,
}) => {
  const handleTaskbarIconClick = (win: WindowState) => {
    if (win.isMinimized) {
      onToggleMinimize(win.id);
    }
    onFocusWindow(win.id);
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 h-16 flex justify-center items-center pointer-events-none z-50">
      <div className="flex items-center gap-2 h-12 px-3 bg-gray-800/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg pointer-events-auto text-white">
        {/* Start Button */}
        <button
          onClick={onToggleStartMenu}
          className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/20 transition-colors rounded-lg"
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

        <div className="w-px h-6 bg-white/20"></div>

        {/* App Icons */}
        <div className="flex items-center h-full">
          {openWindows.map((win) => (
            <div
              key={win.id}
              onClick={() => handleTaskbarIconClick(win)}
              className={`relative flex items-center justify-center w-10 h-10 cursor-pointer transition-colors hover:bg-white/10 rounded-md`}
              title={win.app.name}>
              <span className="text-2xl">{win.app.icon}</span>
              <div
                className={`absolute bottom-1 w-4 h-1 rounded-full transition-all ${
                  !win.isMinimized ? 'bg-blue-400' : 'bg-transparent'
                }`}></div>
            </div>
          ))}
        </div>
        
        {openWindows.length > 0 && <div className="w-px h-6 bg-white/20"></div>}


        {/* Search Bar */}
        <div className="flex items-center bg-gray-900/50 rounded-full h-9 w-72 hover:bg-gray-900/80 transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 mx-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none text-white w-full h-full placeholder-gray-400 text-sm pr-4"
            />
        </div>

        <div className="w-px h-6 bg-white/20"></div>

        {/* Clock */}
        <Clock />
      </div>
    </div>
  );
};
