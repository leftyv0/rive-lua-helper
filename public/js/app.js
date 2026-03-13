// App init, keyboard shortcuts, state, utility functions

function removeContextMenu() {
  const existing = document.querySelector('.context-menu');
  if (existing) existing.remove();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Warn on unsaved changes before leaving
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape — close modal/context menu
  if (e.key === 'Escape') {
    hideNewScriptModal();
    removeContextMenu();
    return;
  }

  // Cmd/Ctrl+N — new script (works everywhere)
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    showNewScriptModal();
    return;
  }
});

// Reload an open tab's content from disk
async function refreshTab(tab) {
  try {
    const data = await ApiClient.getScript(tab.type, tab.name);
    tab.savedContent = data.content;
    tab.model.setValue(data.content);
    tab.dirty = false;
    renderTabs();
    updateTitle();
    showToast('Refreshed');
  } catch (e) {
    showToast('Refresh failed: ' + e.message, 'error');
  }
}

// Init everything
async function init() {
  await initEditor();
  await initSidebar();
  initApiPanel();
  showWelcome();

  // New script button
  document.getElementById('new-script-btn').addEventListener('click', showNewScriptModal);

  // Modal buttons
  document.getElementById('modal-create-btn').addEventListener('click', createNewScript);
  document.getElementById('modal-cancel-btn').addEventListener('click', hideNewScriptModal);

  // Enter key in modal name input
  document.getElementById('new-script-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createNewScript();
  });

  // Click outside modal to close
  document.getElementById('new-script-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) hideNewScriptModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
