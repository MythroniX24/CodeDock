'use strict';

const ProjectManager = require('../projects/manager');
const ToolManager = require('../tools/manager');
const { selectPrompt } = require('../ui/components');
const chalk = require('chalk');

async function projects(flags) {
  const projectManager = new ProjectManager();
  const recent = projectManager.getRecentProjects();
  
  if (recent.length === 0) {
    console.log(chalk.yellow('No recent projects found.'));
    return;
  }
  
  // recent contains strings since we add string paths
  const choices = recent.map(p => ({
    name: p,
    value: p
  }));
  
  choices.push(new (require('inquirer')).Separator());
  choices.push({ name: 'Exit', value: 'exit' });
  
  const selected = await selectPrompt('Recent Projects:', choices);
  
  if (selected && selected !== 'exit') {
    console.log(`Selected project: ${selected}`);
    
    // Attempt to open the default tool in this project
    const toolManager = new ToolManager();
    const tools = await toolManager.getAllTools();
    let installedTools = [];
    for (const t of tools) {
      if (await toolManager.isToolInstalled(t.id)) {
        installedTools.push(t);
      }
    }

    if (installedTools.length === 1) {
      const tool = installedTools[0];
      console.log(`Launching ${tool.name}...`);
      await toolManager.launchTool(tool.id, selected);
    } else if (installedTools.length > 1) {
      const toolChoices = installedTools.map(t => ({ name: t.name, value: t.id }));
      toolChoices.push({ name: 'Cancel', value: 'cancel' });
      const chosenTool = await selectPrompt('Select tool to open this project:', toolChoices);
      if (chosenTool !== 'cancel') {
        console.log(`Launching...`);
        await toolManager.launchTool(chosenTool, selected);
      }
    } else {
      console.log(chalk.yellow('No tools installed to open this project.'));
    }
  }
}

module.exports = projects;
