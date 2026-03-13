// Monaco Editor setup, tabs, dirty tracking

let editor = null;
let openTabs = []; // { type, name, model, viewState, dirty }
let activeTab = null;

function initEditor() {
  return new Promise((resolve) => {
    require.config({
      paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
    });

    require(['vs/editor/editor.main'], function () {
      // Define Rive Luau theme
      monaco.editor.defineTheme('rive-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c792ea' },
          { token: 'string', foreground: 'c3e88d' },
          { token: 'number', foreground: 'f78c6c' },
          { token: 'type', foreground: 'ffcb6b' },
        ],
        colors: {
          'editor.background': '#1a1a2e',
          'editor.foreground': '#e0e0e0',
          'editorCursor.foreground': '#82aaff',
          'editor.lineHighlightBackground': '#1f1f3a',
          'editor.selectionBackground': '#3a3a5c',
          'editorLineNumber.foreground': '#4a4a6a',
          'editorLineNumber.activeForeground': '#82aaff',
        }
      });

      editor = monaco.editor.create(document.getElementById('editor-container'), {
        language: 'lua',
        theme: 'rive-dark',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        padding: { top: 12 },
        suggest: { showKeywords: true },
        bracketPairColorization: { enabled: true },
      });

      // Ctrl/Cmd+S to save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveActiveTab();
      });



      resolve();
    });
  });
}

function openTab(type, name, content) {
  // Check if already open
  const existing = openTabs.find(t => t.type === type && t.name === name);
  if (existing) {
    switchToTab(existing);
    return;
  }

  const model = monaco.editor.createModel(content, 'lua');
  const tab = { type, name, model, viewState: null, dirty: false, savedContent: content };

  model.onDidChangeContent(() => {
    const currentContent = model.getValue();
    tab.dirty = currentContent !== tab.savedContent;
    renderTabs();
    updateTitle();
  });

  openTabs.push(tab);
  switchToTab(tab);
  renderTabs();
  hideWelcome();
}

function switchToTab(tab) {
  // Save current view state
  if (activeTab) {
    activeTab.viewState = editor.saveViewState();
  }

  activeTab = tab;
  editor.setModel(tab.model);

  if (tab.viewState) {
    editor.restoreViewState(tab.viewState);
  }

  editor.focus();
  renderTabs();
  updateTitle();
}

function closeTab(tab, force = false) {
  if (tab.dirty && !force) {
    if (!confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
  }

  const idx = openTabs.indexOf(tab);
  openTabs.splice(idx, 1);
  tab.model.dispose();

  if (activeTab === tab) {
    if (openTabs.length > 0) {
      const nextIdx = Math.min(idx, openTabs.length - 1);
      switchToTab(openTabs[nextIdx]);
    } else {
      activeTab = null;
      editor.setModel(null);
      showWelcome();
    }
  }

  renderTabs();
  updateTitle();
}

function closeOtherTabs(keepTab) {
  const tabsToClose = openTabs.filter(t => t !== keepTab);
  for (const t of tabsToClose) {
    if (t.dirty && !confirm(`"${t.name}" has unsaved changes. Close anyway?`)) continue;
    const idx = openTabs.indexOf(t);
    openTabs.splice(idx, 1);
    t.model.dispose();
  }
  if (activeTab && !openTabs.includes(activeTab)) {
    switchToTab(keepTab);
  }
  renderTabs();
}

async function saveActiveTab() {
  if (!activeTab) return;

  const content = activeTab.model.getValue();
  try {
    await ApiClient.updateScript(activeTab.type, activeTab.name, content);
    activeTab.savedContent = content;
    activeTab.dirty = false;
    renderTabs();
    updateTitle();
    showToast('Saved');
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error');
  }
}

function renderTabs() {
  const tabBar = document.getElementById('tab-bar');
  tabBar.innerHTML = '';

  for (const tab of openTabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (tab === activeTab ? ' active' : '');

    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = (tab.dirty ? '● ' : '') + tab.name;
    label.title = `${PROTOCOL_LABELS[tab.type]} / ${tab.name}`;
    label.addEventListener('click', () => switchToTab(tab));

    const refresh = document.createElement('span');
    refresh.className = 'tab-refresh';
    refresh.textContent = '↻';
    refresh.title = 'Reload from disk';
    refresh.addEventListener('click', (e) => {
      e.stopPropagation();
      refreshTab(tab);
    });

    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '×';
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab);
    });

    // Context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showTabContextMenu(e, tab);
    });

    el.appendChild(label);
    el.appendChild(refresh);
    el.appendChild(close);
    tabBar.appendChild(el);
  }
}

function showTabContextMenu(e, tab) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';

  const items = [
    { label: 'Close', action: () => closeTab(tab) },
    { label: 'Close Others', action: () => closeOtherTabs(tab) },
    { label: 'Close All', action: () => { while (openTabs.length) closeTab(openTabs[0], false); } },
  ];

  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'context-menu-item';
    el.textContent = item.label;
    el.addEventListener('click', () => { removeContextMenu(); item.action(); });
    menu.appendChild(el);
  }

  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', removeContextMenu, { once: true }), 0);
}

function updateTitle() {
  const base = 'Rive Scripts';
  if (activeTab) {
    document.title = (activeTab.dirty ? '● ' : '') + activeTab.name + ' — ' + base;
  } else {
    document.title = base;
  }
}

function hasUnsavedChanges() {
  return openTabs.some(t => t.dirty);
}

function updateTabAfterRename(type, oldName, newName) {
  const tab = openTabs.find(t => t.type === type && t.name === oldName);
  if (tab) {
    tab.name = newName;
    renderTabs();
    updateTitle();
  }
}

function showWelcome() {
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('editor-container').style.display = 'none';
}

function hideWelcome() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('editor-container').style.display = 'block';
}
