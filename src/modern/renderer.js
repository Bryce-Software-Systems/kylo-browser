/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const $ = (id) => document.getElementById(id);
const locationInput = $('location');
const tabs = $('tabs');
const osk = $('osk');
const oskKeys = $('osk-keys');
const OSK_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '.'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '/', ':'],
  [
    { label: 'Space', value: ' ', className: 'wide' },
    { label: '.com', value: '.com', className: 'wide' },
    { label: '⌫', action: 'backspace' },
    { label: 'Go', action: 'go', className: 'wide' },
  ],
];
let currentState = { tabs: [], activeTabId: null };
let oskPosition = { row: 0, col: 0 };
let oskRows = [];

function activeTab() {
  return currentState.tabs.find((tab) => tab.id === currentState.activeTabId);
}

function renderTabs() {
  tabs.textContent = '';
  for (const tab of currentState.tabs) {
    const node = document.createElement('button');
    node.className = `tab${tab.id === currentState.activeTabId ? ' active' : ''}`;
    node.textContent = tab.title || tab.url || 'New Tab';
    node.title = tab.url;
    node.addEventListener('click', () => window.kylo.activateTab(tab.id));
    tabs.appendChild(node);
  }
  const add = document.createElement('button');
  add.className = 'tab';
  add.textContent = '+';
  add.title = 'New tab';
  add.addEventListener('click', () => window.kylo.newTab());
  tabs.appendChild(add);
}

function focusLocation() {
  locationInput.focus();
  locationInput.select();
}

function showOsk() {
  osk.hidden = false;
  window.kylo.setOskVisible(true);
  focusOskKey(oskPosition.row, oskPosition.col);
}

function closeOsk() {
  osk.hidden = true;
  window.kylo.setOskVisible(false);
  focusLocation();
}

function insertAtCursor(value) {
  const start = locationInput.selectionStart ?? locationInput.value.length;
  const end = locationInput.selectionEnd ?? locationInput.value.length;
  locationInput.setRangeText(value, start, end, 'end');
}

function backspaceLocation() {
  const start = locationInput.selectionStart ?? locationInput.value.length;
  const end = locationInput.selectionEnd ?? locationInput.value.length;
  if (start !== end) {
    locationInput.setRangeText('', start, end, 'end');
  } else if (locationInput.value.length === 0) {
    closeOsk();
  } else if (start > 0) {
    locationInput.setRangeText('', start - 1, start, 'end');
  } else {
    locationInput.setRangeText('', 0, 1, 'end');
  }
}

function submitLocation() {
  window.kylo.navigate('go', locationInput.value);
  closeOsk();
}

function pressOskKey(key) {
  if (!key?.classList.contains('osk-key')) return;
  if (key.dataset.action === 'backspace') backspaceLocation();
  else if (key.dataset.action === 'go') submitLocation();
  else insertAtCursor(key.dataset.value || key.textContent);
}

function focusOskKey(row, col) {
  const boundedRow = Math.max(0, Math.min(row, oskRows.length - 1));
  const boundedCol = Math.max(0, Math.min(col, oskRows[boundedRow].length - 1));
  oskPosition = { row: boundedRow, col: boundedCol };
  oskRows[boundedRow][boundedCol].focus();
}

function moveOskFocus(deltaRow, deltaCol) {
  focusOskKey(oskPosition.row + deltaRow, oskPosition.col + deltaCol);
}

function renderOsk() {
  oskKeys.textContent = '';
  oskRows = OSK_LAYOUT.map((row, rowIndex) => {
    const rowNode = document.createElement('div');
    rowNode.className = 'osk-row';
    oskKeys.appendChild(rowNode);
    return row.map((entry, colIndex) => {
      const key = typeof entry === 'string' ? { label: entry, value: entry } : entry;
      const button = document.createElement('button');
      button.className = `osk-key${key.className ? ` ${key.className}` : ''}`;
      button.textContent = key.label;
      button.dataset.value = key.value || '';
      if (key.action) button.dataset.action = key.action;
      button.addEventListener('focus', () => { oskPosition = { row: rowIndex, col: colIndex }; });
      button.addEventListener('click', () => pressOskKey(button));
      rowNode.appendChild(button);
      return button;
    });
  });
}

window.kylo.onState((state) => {
  currentState = state;
  const tab = activeTab();
  if (tab && document.activeElement !== locationInput) locationInput.value = tab.url || '';
  $('back').disabled = !tab?.canGoBack;
  $('forward').disabled = !tab?.canGoForward;
  $('zoom-reset').textContent = `${Math.round((tab?.zoom || 1) * 100)}%`;
  renderTabs();
});

$('go-form').addEventListener('submit', (event) => {
  event.preventDefault();
  window.kylo.navigate('go', locationInput.value);
});
$('back').addEventListener('click', () => window.kylo.navigate('back'));
$('forward').addEventListener('click', () => window.kylo.navigate('forward'));
$('reload').addEventListener('click', () => window.kylo.navigate('reload'));
$('home').addEventListener('click', () => window.kylo.navigate('home'));
$('zoom-out').addEventListener('click', () => window.kylo.zoom(-1));
$('zoom-reset').addEventListener('click', () => window.kylo.zoom('reset'));
$('zoom-in').addEventListener('click', () => window.kylo.zoom(1));
$('fullscreen').addEventListener('click', () => window.kylo.fullscreen());
$('show-osk').addEventListener('click', showOsk);
$('osk-close').addEventListener('click', closeOsk);

osk.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') moveOskFocus(-1, 0);
  else if (event.key === 'ArrowDown') moveOskFocus(1, 0);
  else if (event.key === 'ArrowLeft') moveOskFocus(0, -1);
  else if (event.key === 'ArrowRight') moveOskFocus(0, 1);
  else if (event.key === 'Enter') pressOskKey(document.activeElement);
  else if (event.key === 'Escape') backspaceLocation();
  else return;
  event.preventDefault();
});

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'ArrowLeft') window.kylo.navigate('back');
  if (event.altKey && event.key === 'ArrowRight') window.kylo.navigate('forward');
  if (event.key === 'F11') window.kylo.fullscreen();
  if (event.ctrlKey && event.key.toLowerCase() === 'l') focusLocation();
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'k') focusLocation();
  if (event.ctrlKey && event.key.toLowerCase() === 't') window.kylo.newTab();
  if (event.ctrlKey && event.key.toLowerCase() === 'w') window.kylo.closeTab(currentState.activeTabId);
});

renderOsk();
