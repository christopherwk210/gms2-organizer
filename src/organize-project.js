// Imports
const path = require('path');
const fs = require('fs');
const util = require('util');

// Promisification
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const readDir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

/**
 * Organize a GMS 2 project resources alphabetically
 * @param {string} yypPath Absolute path to project file
 */
async function organizeProject(yypPath) {

  // Folder containing project
  let projectLocation = path.dirname(yypPath);

  // Read YYP
  let projectFile = await readFile(yypPath, { encoding: 'utf8' });
  projectFile = JSON.parse(projectFile);

  // Get directory listing of YYP containing folder
  let directoryListing = await readDir(projectLocation);

  // Make sure views folder exists
  if (!~directoryListing.indexOf('views')) {
    throw new Error('Could not find views folder!');
  }

  // Get view folder path
  let viewFolder = path.join(projectLocation, 'views');

  // Read all files in the views folder
  let viewFolderListing = await readDir(viewFolder);

  let viewFiles = [];

  // Loop through each item
  for (let item of viewFolderListing) {
    let itemPath = path.join(viewFolder, item);

    // Get item properties
    let itemStats = await stat(itemPath);
    
    // Make sure it's a .yy file
    if (!itemStats.isFile() || path.extname(itemPath) !== '.yy') continue;

    // Parse the item
    let parsedItem = await readFile(itemPath, { encoding: 'utf8' });
    parsedItem = JSON.parse(parsedItem);

    // Skip certain view types that don't need to be organized
    switch (parsedItem.filterType) {
      case 'root':
      case 'GMNotes':
      case 'GMOptions':
      case 'GMConfig':
        continue;
    }

    // Cache
    viewFiles.push({
      path: itemPath,
      parsedContents: parsedItem
    });
  }

  // Loop through each view
  for (let view of viewFiles) {

    // Record the original order of children
    let originalChildren = Array.from(view.parsedContents.children);

    let childObjects = [];

    // Loop through project resources
    for (let resource of projectFile.resources) {
      if (~originalChildren.indexOf(resource.Key)) {
        childObjects.push(resource);
      }
    }

    // Sort children
    childObjects.sort((a, b) => {

      // Folders go up!
      if (a.Value.resourceType === 'GMFolder' && b.Value.resourceType !== 'GMFolder') return -1;
      if (b.Value.resourceType === 'GMFolder' && a.Value.resourceType !== 'GMFolder') return 1;

      // Get resource names
      let aName = a.Value.resourcePath.split('/');
      aName = aName[aName.length - 1].replace('.yy', '');
      let bName = b.Value.resourcePath.split('/');
      bName = bName[bName.length - 1].replace('.yy', '');

      // Two folders, sort by folder name
      if (a.Value.resourceType === 'GMFolder' && b.Value.resourceType === 'GMFolder') {
        let aGroupName, bGroupName;
        viewFiles.forEach(_view => {
          if (_view.parsedContents.id === aName) {
            aGroupName = _view.parsedContents.folderName;
          } else if (_view.parsedContents.id === bName) {
            bGroupName = _view.parsedContents.folderName;
          }
        });

        if (aGroupName < bGroupName) {
          return -1;
        } else if (aGroupName > bGroupName) {
          return 1;
        } else {
          return 0;
        }
      }

      // Organize!
      if (aName < bName) {
        return -1;
      } else if (bName < aName) {
        return 1;
      }

      return 0;
    });

    // Extract ID's from sorted children
    let sortedArray = [];
    childObjects.forEach(child => {
      sortedArray.push(child.Key);
    });

    // Reassign sort to view
    view.parsedContents.children = sortedArray;

    // Save view to file
    await writeFile(view.path, JSON.stringify(view.parsedContents, null, 2));
  }
}

module.exports = organizeProject;
