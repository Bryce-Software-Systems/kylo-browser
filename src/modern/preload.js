/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kylo', {
  newTab: (url) => ipcRenderer.invoke('kylo:new-tab', url),
  closeTab: (id) => ipcRenderer.invoke('kylo:close-tab', id),
  activateTab: (id) => ipcRenderer.invoke('kylo:activate-tab', id),
  navigate: (action, value) => ipcRenderer.invoke('kylo:navigate', action, value),
  zoom: (direction) => ipcRenderer.invoke('kylo:zoom', direction),
  fullscreen: () => ipcRenderer.invoke('kylo:fullscreen'),
  onState: (callback) => ipcRenderer.on('kylo:state', (_event, state) => callback(state)),
});
