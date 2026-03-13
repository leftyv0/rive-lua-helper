// Monaco Editor setup, tabs, dirty tracking, Luau language support

let editor = null;
let openTabs = []; // { type, name, model, viewState, dirty, savedContent, lastModified }
let activeTab = null;
let changeCheckInterval = null;

function initEditor() {
  return new Promise((resolve) => {
    require.config({
      paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
    });

    require(['vs/editor/editor.main'], function () {
      // Register Luau as a custom language
      monaco.languages.register({ id: 'luau' });

      monaco.languages.setMonarchTokensProvider('luau', {
        defaultToken: '',
        tokenPostfix: '.luau',

        keywords: [
          'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
          'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
          'return', 'then', 'true', 'until', 'while', 'continue', 'export',
          'type', 'typeof'
        ],

        builtinTypes: [
          'number', 'string', 'boolean', 'any', 'nil', 'never', 'unknown',
          'Path', 'Paint', 'Color', 'Vector', 'Renderer', 'Context',
          'Artboard', 'Node', 'Layout', 'Converter', 'PathEffect',
          'TransitionCondition', 'ListenerAction', 'ViewModel', 'Trigger',
          'Input', 'List', 'Tester', 'PointerEvent', 'Mat2D', 'AABB',
          'Image', 'Audio', 'LayoutMeasureMode', 'PaintStyle', 'StrokeJoin',
          'StrokeCap', 'BlendMode', 'Fit', 'Alignment', 'PathMeasure'
        ],

        builtinFunctions: [
          'print', 'error', 'warn', 'assert', 'require', 'pcall', 'xpcall',
          'tonumber', 'tostring', 'type', 'typeof', 'select', 'unpack',
          'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
          'ipairs', 'pairs', 'next', 'late'
        ],

        operators: [
          '+', '-', '*', '/', '%', '^', '#',
          '==', '~=', '<', '>', '<=', '>=',
          '=', '.', ':', '..', '...', '->'
        ],

        symbols: /[=><!~?:&|+\-*\/\^%#]+/,

        tokenizer: {
          root: [
            // Comments
            [/--\[([=]*)\[/, 'comment', '@blockComment.$1'],
            [/--.*$/, 'comment'],

            // Strings
            [/\[([=]*)\[/, 'string', '@blockString.$1'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/'([^'\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@doubleString'],
            [/'/, 'string', '@singleString'],

            // Numbers
            [/0[xX][0-9a-fA-F_]+/, 'number.hex'],
            [/0[bB][01_]+/, 'number.binary'],
            [/\d+[eE][\-+]?\d+/, 'number.float'],
            [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
            [/\d+/, 'number'],

            // Type annotations after colon
            [/:\s*/, { token: 'delimiter', next: '@typeAnnotation' }],

            // Identifiers and keywords
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@builtinTypes': 'type',
                '@builtinFunctions': 'support.function',
                '@default': 'identifier'
              }
            }],

            // Operators and delimiters
            [/[{}()\[\]]/, 'delimiter.bracket'],
            [/[,;]/, 'delimiter'],
            [/@symbols/, {
              cases: {
                '@operators': 'operator',
                '@default': ''
              }
            }],
          ],

          typeAnnotation: [
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@builtinTypes': 'type',
                '@default': 'type'
              }
            }],
            [/</, 'type', '@typeGeneric'],
            [/\?/, 'type'],
            [/[,|&()]/, 'type'],
            [/\s+/, ''],
            [/./, { token: '', next: '@pop' }],
          ],

          typeGeneric: [
            [/[a-zA-Z_]\w*/, 'type'],
            [/</, 'type', '@push'],
            [/>/, 'type', '@pop'],
            [/[,|&()?\s]/, 'type'],
          ],

          blockComment: [
            [/[^\]]+/, 'comment'],
            [/\]([=]*)\]/, {
              cases: {
                '$1==$S2': { token: 'comment', next: '@pop' },
                '@default': 'comment'
              }
            }],
            [/./, 'comment']
          ],

          blockString: [
            [/[^\]]+/, 'string'],
            [/\]([=]*)\]/, {
              cases: {
                '$1==$S2': { token: 'string', next: '@pop' },
                '@default': 'string'
              }
            }],
            [/./, 'string']
          ],

          doubleString: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop']
          ],

          singleString: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop']
          ]
        }
      });

      // Define Rive Luau theme
      monaco.editor.defineTheme('rive-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c792ea' },
          { token: 'string', foreground: 'c3e88d' },
          { token: 'string.escape', foreground: '89ddff' },
          { token: 'number', foreground: 'f78c6c' },
          { token: 'number.hex', foreground: 'f78c6c' },
          { token: 'number.float', foreground: 'f78c6c' },
          { token: 'number.binary', foreground: 'f78c6c' },
          { token: 'type', foreground: 'ffcb6b' },
          { token: 'support.function', foreground: '82aaff' },
          { token: 'operator', foreground: '89ddff' },
          { token: 'delimiter', foreground: 'e0e0e0' },
          { token: 'delimiter.bracket', foreground: 'e0e0e0' },
          { token: 'identifier', foreground: 'e0e0e0' },
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
        language: 'luau',
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

      // Ctrl/Cmd+Shift+R to refresh active tab from disk
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyR, () => {
        if (activeTab) refreshTab(activeTab);
      });

      // Start polling for external file changes
      startChangePolling();

      resolve();
    });
  });
}

// Poll for external file changes every 3 seconds
function startChangePolling() {
  changeCheckInterval = setInterval(async () => {
    for (const tab of openTabs) {
      try {
        const res = await fetch(`/api/scripts/${encodeURIComponent(tab.type)}/${encodeURIComponent(tab.name)}/modified`);
        if (!res.ok) continue;
        const data = await res.json();
        const diskModified = new Date(data.modified).getTime();
        const tabModified = tab.lastModified ? new Date(tab.lastModified).getTime() : 0;

        if (diskModified > tabModified && !tab.showingChangeBanner) {
          tab.showingChangeBanner = true;
          showChangeBanner(tab);
        }
      } catch {
        // Ignore network errors
      }
    }
  }, 3000);
}

function showChangeBanner(tab) {
  // Only show banner for active tab
  if (tab !== activeTab) return;

  // Remove existing banner if any
  removeChangeBanner();

  const banner = document.createElement('div');
  banner.className = 'change-banner';
  banner.id = 'change-banner';
  banner.innerHTML = `
    <span>File changed on disk</span>
    <button id="banner-reload">Reload</button>
    <button id="banner-dismiss">Dismiss</button>
  `;

  const editorContainer = document.getElementById('editor-container');
  editorContainer.parentNode.insertBefore(banner, editorContainer);

  document.getElementById('banner-reload').addEventListener('click', () => {
    refreshTab(tab);
    tab.showingChangeBanner = false;
    removeChangeBanner();
  });

  document.getElementById('banner-dismiss').addEventListener('click', () => {
    tab.showingChangeBanner = false;
    removeChangeBanner();
  });
}

function removeChangeBanner() {
  const banner = document.getElementById('change-banner');
  if (banner) banner.remove();
}

function openTab(type, name, content, modified) {
  // Check if already open
  const existing = openTabs.find(t => t.type === type && t.name === name);
  if (existing) {
    switchToTab(existing);
    return;
  }

  const model = monaco.editor.createModel(content, 'luau');
  const tab = {
    type, name, model, viewState: null,
    dirty: false, savedContent: content,
    lastModified: modified || new Date().toISOString(),
    showingChangeBanner: false,
  };

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
  removeChangeBanner();

  // Show banner if tab has pending external change
  if (tab.showingChangeBanner) {
    showChangeBanner(tab);
  }
}

function closeTab(tab, force = false) {
  if (tab.dirty && !force) {
    if (!confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
  }

  const idx = openTabs.indexOf(tab);
  openTabs.splice(idx, 1);
  tab.model.dispose();

  if (activeTab === tab) {
    removeChangeBanner();
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
    activeTab.lastModified = new Date().toISOString();
    activeTab.showingChangeBanner = false;
    removeChangeBanner();
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
    refresh.title = 'Reload from disk (Cmd+Shift+R)';
    refresh.addEventListener('click', (e) => {
      e.stopPropagation();
      refreshTab(tab);
    });

    const copy = document.createElement('span');
    copy.className = 'tab-copy';
    copy.textContent = '⧉';
    copy.title = 'Copy to clipboard';
    copy.addEventListener('click', (e) => {
      e.stopPropagation();
      copyTabContent(tab);
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
    el.appendChild(copy);
    el.appendChild(close);
    tabBar.appendChild(el);
  }
}

function copyTabContent(tab) {
  const content = tab.model.getValue();
  navigator.clipboard.writeText(content).then(() => {
    showToast('Copied to clipboard');
  }).catch(() => {
    showToast('Copy failed', 'error');
  });
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
    { label: 'Copy to Clipboard', action: () => copyTabContent(tab) },
    { label: 'Reload from Disk', action: () => refreshTab(tab) },
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
