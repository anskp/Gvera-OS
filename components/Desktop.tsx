/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {APP_DEFINITIONS_CONFIG} from '../constants';
import {AppDefinition} from '../types';
import {Icon} from './Icon';

interface DesktopProps {
  children: React.ReactNode;
  onOpenApp: (app: AppDefinition) => void;
}

export const Desktop: React.FC<DesktopProps> = ({children, onOpenApp}) => {
  return (
    <div className="flex-grow w-full h-full relative">
      {/* Desktop Icons */}
      <div className="absolute top-0 left-0 p-4 flex flex-col flex-wrap h-full content-start">
        {APP_DEFINITIONS_CONFIG.map((app) => (
          <Icon key={app.id} app={app} onInteract={() => onOpenApp(app)} />
        ))}
      </div>

      {/* Open Windows */}
      {children}
    </div>
  );
};
