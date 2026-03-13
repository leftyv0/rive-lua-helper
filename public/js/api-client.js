// Fetch wrapper for /api/* calls

const ApiClient = {
  async listScripts() {
    const res = await fetch('/api/scripts');
    if (!res.ok) throw new Error('Failed to list scripts');
    return res.json();
  },

  async getScript(type, name) {
    const res = await fetch(`/api/scripts/${encodeURIComponent(type)}/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Failed to read script');
    return res.json();
  },

  async createScript(type, name, content = '', description = '') {
    const res = await fetch(`/api/scripts/${encodeURIComponent(type)}/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, description })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create script');
    }
    return res.json();
  },

  async updateScript(type, name, content, description) {
    const body = {};
    if (content !== undefined) body.content = content;
    if (description !== undefined) body.description = description;

    const res = await fetch(`/api/scripts/${encodeURIComponent(type)}/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to update script');
    return res.json();
  },

  async renameScript(type, name, newName) {
    const res = await fetch(`/api/scripts/${encodeURIComponent(type)}/${encodeURIComponent(name)}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to rename script');
    }
    return res.json();
  },

  async deleteScript(type, name) {
    const res = await fetch(`/api/scripts/${encodeURIComponent(type)}/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete script');
    return res.json();
  }
};
