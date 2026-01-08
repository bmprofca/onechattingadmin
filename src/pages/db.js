// Dummy local database helper used by the sidebar for unread counts.
// This stub keeps the template working without requiring IndexedDB setup.

export const dbHelper = {
  // Initialize "database" for a given project
  async init(projectId) {
    // No-op in this dummy implementation
    return Promise.resolve(projectId);
  },

  // Return an empty list of chats
  async getChats() {
    return [];
  },

  // Register a no-op change listener and return an unsubscribe function
  setOnDataChange(callback) {
    // Immediately invoke once with empty data to avoid unused warnings (optional)
    if (typeof callback === 'function') {
      callback('chats', 'init', []);
    }
    return () => {};
  }
};


