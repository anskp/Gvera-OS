/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {VFSNode} from './types';

export const initialVFS: VFSNode = {
  id: 'root',
  name: 'root',
  type: 'folder',
  children: [
    {
      id: 'docs',
      name: 'Documents',
      type: 'folder',
      children: [
        {
          id: 'file1',
          name: 'welcome.txt',
          type: 'file',
          content: 'Welcome to your new Gemini-powered OS!',
        },
        {
          id: 'file2',
          name: 'project_notes.txt',
          type: 'file',
          content: 'Initial project brainstorming notes...',
        },
      ],
    },
    {
      id: 'pics',
      name: 'Pictures',
      type: 'folder',
      children: [],
    },
    {
      id: 'desktop_folder',
      name: 'Desktop',
      type: 'folder',
      children: [],
    },
  ],
};

// Finds a node in the VFS tree by path
export const findNode = (
  root: VFSNode,
  path: string[],
): VFSNode | null => {
  let currentNode = root;
  for (const part of path) {
    if (part === 'root') continue;
    if (currentNode.type === 'folder' && currentNode.children) {
      const found = currentNode.children.find((child) => child.name === part);
      if (found) {
        currentNode = found;
      } else {
        return null; // Path not found
      }
    } else {
      return null; // Invalid path
    }
  }
  return currentNode;
};

// Updates a node in the VFS tree immutably
export const updateVFSNode = (
  root: VFSNode,
  path: string[],
  action: 'add',
  newNode: VFSNode,
): VFSNode => {
  // Create a deep clone to ensure immutability
  const newRoot = JSON.parse(JSON.stringify(root));

  const parentPath = path.slice(0, -1);
  const targetName = path[path.length - 1];

  let current: VFSNode | undefined = newRoot;
  for (const part of path) {
    if (part === 'root') continue;
    current = current?.children?.find((child) => child.name === part);
    if (!current) {
      console.error('Path not found during update');
      return root; // Return original on error
    }
  }

  if (action === 'add') {
    if (current.type === 'folder') {
      if (!current.children) {
        current.children = [];
      }
      // Check for duplicates
      if (!current.children.find((child) => child.name === newNode.name)) {
        current.children.push(newNode);
      }
    }
  }

  // To apply the change, we need to traverse again but this time modifying the clone
  let parent = newRoot;
  for (let i = 0; i < path.length; i++) {
    const part = path[i];
    if (part === 'root') continue;
    const next = parent.children?.find((child) => child.name === part);
    if (i === path.length - 1) {
      // We are at the target directory
      if (action === 'add' && parent.type === 'folder') {
        if (!parent.children) parent.children = [];
        if (!parent.children.find(c => c.name === newNode.name)) {
           parent.children.push(newNode);
        }
      }
      break;
    }
    if (next) {
      parent = next;
    } else {
      return root;
    }
  }

  return newRoot;
};
