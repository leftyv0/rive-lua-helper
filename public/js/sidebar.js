// Sidebar — collapsible protocol groups, script list, context menus

let scriptsData = {};

async function initSidebar() {
  await refreshSidebar();
}

async function refreshSidebar() {
  try {
    scriptsData = await ApiClient.listScripts();
    renderSidebar();
  } catch (e) {
    showToast('Failed to load scripts: ' + e.message, 'error');
  }
}

function renderSidebar() {
  const tree = document.getElementById('script-tree');
  tree.innerHTML = '';

  const types = [
    'node', 'layout', 'converter', 'path-effect',
    'transition-condition', 'listener-action', 'util', 'test'
  ];

  for (const type of types) {
    const scripts = scriptsData[type] || [];
    const group = document.createElement('div');
    group.className = 'sidebar-group';

    const header = document.createElement('div');
    header.className = 'sidebar-group-header';
    header.innerHTML = `<span class="sidebar-chevron">&#9656;</span> ${PROTOCOL_LABELS[type]} <span class="sidebar-count">${scripts.length}</span>`;
    header.addEventListener('click', () => {
      group.classList.toggle('expanded');
    });

    const items = document.createElement('div');
    items.className = 'sidebar-group-items';

    for (const script of scripts) {
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.textContent = script.name.replace('.luau', '');
      item.title = script.description || script.name;

      item.addEventListener('click', () => openScript(type, script.name));
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showScriptContextMenu(e, type, script.name);
      });

      items.appendChild(item);
    }

    group.appendChild(header);
    group.appendChild(items);

    // Auto-expand groups with scripts
    if (scripts.length > 0) {
      group.classList.add('expanded');
    }

    tree.appendChild(group);
  }
}

async function openScript(type, name) {
  // Check if already open
  const existing = openTabs.find(t => t.type === type && t.name === name);
  if (existing) {
    switchToTab(existing);
    return;
  }

  try {
    const data = await ApiClient.getScript(type, name);
    openTab(type, name, data.content, data.modified);
  } catch (e) {
    showToast('Failed to open script: ' + e.message, 'error');
  }
}

function showScriptContextMenu(e, type, name) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';

  const items = [
    { label: 'Open', action: () => openScript(type, name) },
    { label: 'Rename...', action: () => renameScript(type, name) },
    { label: 'Delete', action: () => deleteScript(type, name) },
  ];

  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'context-menu-item' + (item.label === 'Delete' ? ' danger' : '');
    el.textContent = item.label;
    el.addEventListener('click', () => { removeContextMenu(); item.action(); });
    menu.appendChild(el);
  }

  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', removeContextMenu, { once: true }), 0);
}

async function renameScript(type, oldName) {
  const baseName = oldName.replace('.luau', '');
  const newBase = prompt('Rename script:', baseName);
  if (!newBase || newBase === baseName) return;

  const newName = newBase + '.luau';
  try {
    await ApiClient.renameScript(type, oldName, newName);
    updateTabAfterRename(type, oldName, newName);
    await refreshSidebar();
    showToast('Renamed');
  } catch (e) {
    showToast('Rename failed: ' + e.message, 'error');
  }
}

async function deleteScript(type, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    await ApiClient.deleteScript(type, name);

    // Close tab if open
    const tab = openTabs.find(t => t.type === type && t.name === name);
    if (tab) closeTab(tab, true);

    await refreshSidebar();
    showToast('Deleted');
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  }
}

// New script modal
function showNewScriptModal() {
  const modal = document.getElementById('new-script-modal');
  const typeSelect = document.getElementById('new-script-type');
  const nameInput = document.getElementById('new-script-name');

  nameInput.value = '';
  modal.classList.add('visible');
  nameInput.focus();
}

function hideNewScriptModal() {
  document.getElementById('new-script-modal').classList.remove('visible');
}

async function createNewScript() {
  const type = document.getElementById('new-script-type').value;
  const baseName = document.getElementById('new-script-name').value.trim();

  if (!baseName) {
    showToast('Please enter a script name', 'error');
    return;
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(baseName)) {
    showToast('Name can only contain letters, numbers, hyphens, and underscores', 'error');
    return;
  }

  const name = baseName + '.luau';
  const content = TEMPLATES[type] || '';

  try {
    await ApiClient.createScript(type, name, content);
    hideNewScriptModal();
    await refreshSidebar();
    openTab(type, name, content);
    showToast('Created');
  } catch (e) {
    showToast('Create failed: ' + e.message, 'error');
  }
}
