const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

const organizeProject = require('./organize-project');
let currentProject = null;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: false,
    maximizable: false,
    center: true,
    fullscreenable: false
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'www/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  const ret = electron.globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (currentProject !== null) {
      organizeProject(currentProject);
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  electron.globalShortcut.unregisterAll();
  app.quit();
});

electron.ipcMain.on('fileDrop', (event, arg) => {
  if (currentProject === null) {
    currentProject = arg;
    organizeProject(arg);
  }
})
