/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const $ = (id) => document.getElementById(id);
const locationInput = $('location');
const tabs = $('tabs');
let currentState = { tabs: [], activeTabId: null };

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

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'ArrowLeft') window.kylo.navigate('back');
  if (event.altKey && event.key === 'ArrowRight') window.kylo.navigate('forward');
  if (event.key === 'F11') window.kylo.fullscreen();
  if (event.ctrlKey && event.key === 'l') locationInput.select();
  if (event.ctrlKey && event.key === 't') window.kylo.newTab();
  if (event.ctrlKey && event.key === 'w') window.kylo.closeTab(currentState.activeTabId);
});
