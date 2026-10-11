'use strict';

const inquirer = require('inquirer');
const { selectPrompt, inputPrompt } = require('./components');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

async function selectProject(projectManager, toolName) {
  const currentDir = process.cwd();
  const recent = projectManager.getRecentProjects().filter(p => p !== currentDir && fs.existsSync(p));
  
  const choices = [];
  // Quick choice: Current directory
  choices.push({ name: `📍 Current directory (${currentDir})`, value: currentDir });

  if (recent.length > 0) {
    choices.push(new inquirer.Separator('--- Recent Projects ---'));
    recent.forEach(p => {
      choices.push({ name: `📁 ${path.basename(p)} (${p})`, value: p });
    });
  }
  
  choices.push(new inquirer.Separator('--- Options ---'));
  choices.push({ name: '🔍 Enter custom path or folder name', value: 'custom_path' });
  choices.push({ name: '✨ Create new project', value: 'new_project' });
  choices.push({ name: '❌ Cancel', value: 'cancel' });
  
  const selection = await selectPrompt(`Open project in ${toolName}:`, choices);
  
  if (selection === 'cancel') return null;
  
  if (selection === 'custom_path') {
    const rawInput = await inputPrompt('Enter project path or folder name:');
    if (!rawInput || !rawInput.trim()) return null;

    let resolved = projectManager.resolveProjectPath(rawInput);

    if (!fs.existsSync(resolved)) {
      const { confirmPrompt } = require('./components');
      const shouldCreate = await confirmPrompt(`Directory '${resolved}' does not exist. Create it?`);
      if (shouldCreate) {
        try {
          fs.mkdirSync(resolved, { recursive: true });
          console.log(chalk.green(`Created directory at ${resolved}`));
        } catch (err) {
          console.log(chalk.red(`Failed to create directory: ${err.message}`));
          return null;
        }
      } else {
        return null;
      }
    }

    projectManager.addProject(resolved);
    return resolved;
  }
  
  if (selection === 'new_project') {
    const name = await inputPrompt('Project Name:');
    if (!name || !name.trim()) return null;

    const defaultParent = projectManager.getDefaultDir();
    const parentDir = await inputPrompt('Parent Directory:', defaultParent);
    
    try {
      const newPath = projectManager.createProject(parentDir, name);
      console.log(chalk.green(`Created new project at ${newPath}`));
      return newPath;
    } catch (e) {
      console.log(chalk.red(`Error creating project: ${e.message}`));
      return null;
    }
  }
  
  // Selection was current directory or a recent project string
  projectManager.addProject(selection);
  return selection;
}

module.exports = { selectProject };
