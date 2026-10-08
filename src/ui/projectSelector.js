'use strict';

const { selectPrompt, inputPrompt } = require('./components');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function selectProject(projectManager, toolName) {
  const recent = projectManager.getRecentProjects();
  
  const choices = [];
  if (recent.length > 0) {
    choices.push(new (require('inquirer')).Separator('--- Recent Projects ---'));
    recent.forEach(p => {
      choices.push({ name: `${path.basename(p)} (${p})`, value: p });
    });
  }
  
  choices.push(new (require('inquirer')).Separator('--- Options ---'));
  choices.push({ name: '📁 Enter custom path', value: 'custom_path' });
  choices.push({ name: '✨ Create new project', value: 'new_project' });
  choices.push({ name: '❌ Cancel', value: 'cancel' });
  
  const selection = await selectPrompt(`Open project in ${toolName}:`, choices);
  
  if (selection === 'cancel') return null;
  
  if (selection === 'custom_path') {
    const customPath = await inputPrompt('Enter absolute path to project:');
    if (!fs.existsSync(customPath)) {
      console.log(chalk.red('Path does not exist!'));
      return null;
    }
    projectManager.addProject(customPath);
    return customPath;
  }
  
  if (selection === 'new_project') {
    const name = await inputPrompt('Project Name:');
    const parentDir = await inputPrompt('Parent Directory (default: ~/Projects):', path.join(os.homedir(), 'Projects'));
    
    try {
      const newPath = projectManager.createProject(parentDir, name);
      console.log(chalk.green(`Created new project at ${newPath}`));
      return newPath;
    } catch (e) {
      console.log(chalk.red(`Error creating project: ${e.message}`));
      return null;
    }
  }
  
  // Selection was a recent project string
  return selection;
}

module.exports = { selectProject };
