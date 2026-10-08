/**
 * @file src/tools/registry.js
 * Tool discovery and registry.
 */
const fs = require('fs');
const path = require('path');
const { loadManifest, validateManifest } = require('./manifest');

const TOOLS_DIR = path.join(__dirname, '..', '..', 'tools');

class Registry {
  constructor() {
    this.tools = new Map();
  }

  discoverTools() {
    this.tools.clear();
    if (!fs.existsSync(TOOLS_DIR)) {
      return [];
    }
    const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const toolDir = path.join(TOOLS_DIR, entry.name);
          const manifest = loadManifest(toolDir);
          if (validateManifest(manifest)) {
            this.tools.set(manifest.id, manifest);
          }
        } catch (err) {
          // Ignore invalid tools
        }
      }
    }
    return Array.from(this.tools.values());
  }

  getToolIds() {
    return Array.from(this.tools.keys());
  }

  getToolById(id) {
    return this.tools.get(id) || null;
  }

  getToolByAlias(alias) {
    for (const tool of this.tools.values()) {
      if (tool.command === alias || (tool.aliases && tool.aliases.includes(alias))) {
        return tool;
      }
    }
    return null;
  }
}

module.exports = new Registry();
