/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const { app, BrowserWindow, ipcMain, WebContentsView } = require('electron');
const path = require('node:path');

const DEFAULT_HOME = 'https://www.google.com/search?igu=1';
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

let mainWindow;
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function normalizeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return DEFAULT_HOME;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value)) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function sendState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('kylo:state', {
    activeTabId,
    tabs: tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      canGoBack: tab.view.webContents.canGoBack(),
      canGoForward: tab.view.webContents.canGoForward(),
      zoom: tab.zoom,
    })),
  });
}

function layoutActiveView() {
  const tab = getActiveTab();
  if (!mainWindow || !tab) return;
  const bounds = mainWindow.getContentBounds();
  const toolbarHeight = 116;
  tab.view.setBounds({
    x: 0,
    y: toolbarHeight,
    width: bounds.width,
    height: Math.max(bounds.height - toolbarHeight, 0),
  });
  tab.view.setAutoResize({ width: true, height: true });
}

function attachActiveView() {
  const tab = getActiveTab();
  if (!mainWindow || !tab) return;
  for (const existing of tabs) {
    if (existing.id !== tab.id) mainWindow.contentView.removeChildView(existing.view);
  }
  mainWindow.contentView.addChildView(tab.view);
  layoutActiveView();
  sendState();
}

function createTab(rawUrl = DEFAULT_HOME) {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  const tab = {
    id: nextTabId++,
    view,
    url: normalizeUrl(rawUrl),
    title: 'New Tab',
    zoom: 1,
  };
  tabs.push(tab);
  activeTabId = tab.id;

  view.webContents.setWindowOpenHandler(({ url }) => {
    createTab(url);
    return { action: 'deny' };
  });
  view.webContents.on('page-title-updated', (_event, title) => {
    tab.title = title || tab.url;
    sendState();
  });
  view.webContents.on('did-navigate', (_event, url) => {
    tab.url = url;
    sendState();
  });
  view.webContents.on('did-navigate-in-page', (_event, url) => {
    tab.url = url;
    sendState();
  });
  view.webContents.on('did-finish-load', sendState);
  view.webContents.loadURL(tab.url);
  attachActiveView();
  return tab;
}

function closeTab(id = activeTabId) {
  if (tabs.length <= 1) {
    getActiveTab()?.view.webContents.loadURL(DEFAULT_HOME);
    return;
  }
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return;
  const [removed] = tabs.splice(index, 1);
  mainWindow.contentView.removeChildView(removed.view);
  removed.view.webContents.destroy();
  activeTabId = tabs[Math.max(0, index - 1)].id;
  attachActiveView();
}

function navigateActive(action, value) {
  const tab = getActiveTab();
  if (!tab) return;
  const contents = tab.view.webContents;
  if (action === 'go' && value) contents.loadURL(normalizeUrl(value));
  if (action === 'back' && contents.canGoBack()) contents.goBack();
  if (action === 'forward' && contents.canGoForward()) contents.goForward();
  if (action === 'reload') contents.reload();
  if (action === 'home') contents.loadURL(DEFAULT_HOME);
}

function zoomActive(direction) {
  const tab = getActiveTab();
  if (!tab) return;
  if (direction === 'reset') tab.zoom = 1;
  else tab.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, tab.zoom + direction * ZOOM_STEP));
  tab.view.webContents.setZoomFactor(Number(tab.zoom.toFixed(2)));
  sendState();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#070b12',
    title: 'Kylo Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'shell.html'));
  mainWindow.on('resize', layoutActiveView);
  mainWindow.on('enter-full-screen', sendState);
  mainWindow.on('leave-full-screen', sendState);
  mainWindow.webContents.once('did-finish-load', () => createTab(process.argv[2] || DEFAULT_HOME));
}

ipcMain.handle('kylo:new-tab', (_event, url) => createTab(url).id);
ipcMain.handle('kylo:close-tab', (_event, id) => closeTab(id));
ipcMain.handle('kylo:activate-tab', (_event, id) => { activeTabId = id; attachActiveView(); });
ipcMain.handle('kylo:navigate', (_event, action, value) => navigateActive(action, value));
ipcMain.handle('kylo:zoom', (_event, direction) => zoomActive(direction));
ipcMain.handle('kylo:fullscreen', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
