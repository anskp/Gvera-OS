/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: VFSNode[]; // For folders
  content?: string; // For files
}

export interface InteractionData {
  id: string;
  type: string;
  value?: string;
  elementType: string;
  elementText: string;
  appContext: string | null;
  context?: {
    vfs?: VFSNode | null; // Virtual File System context
  };
}

export interface WindowState {
  id: string; // Unique ID for the window instance
  app: AppDefinition;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  content: string;
  isLoading: boolean;
  error: string | null;
  interactionHistory: InteractionData[];
  appPath: string[]; // For statefulness/caching
  vfsPath?: string[]; // Current path in the virtual file system
}
