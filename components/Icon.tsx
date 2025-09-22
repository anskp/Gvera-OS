/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {AppDefinition} from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
}

export const Icon: React.FC<IconProps> = ({app, onInteract}) => {
  return (
    <div
      className="w-28 h-32 flex flex-col items-center justify-start text-center m-2 p-2 cursor-pointer select-none rounded-lg transition-colors hover:bg-[var(--icon-hover-bg)] focus:bg-[var(--icon-hover-bg)] focus:outline-none focus:ring-2 focus:ring-blue-400"
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}>
      <div className="text-6xl mb-2 drop-shadow-lg">{app.icon}</div>{' '}
      <div
        className="text-sm font-medium break-words max-w-full leading-tight text-[var(--text-primary)]"
        style={{textShadow: 'var(--icon-text-shadow)'}}>
        {app.name}
      </div>
    </div>
  );
};
