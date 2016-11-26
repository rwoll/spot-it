import electron, { app, BrowserWindow, globalShortcut, ipcMain, Menu } from 'electron';
import path from 'path';
import url from 'url';
import config from './config'
import { execFile } from 'child_process';

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: config.WINDOW_WIDTH,
    height: config.WINDOW_HEIGHT,
    alwaysOnTop: true,
    frame: false,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    show: false
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
  });

  mainWindow.on('blur', function() {
    Menu.sendActionToFirstResponder('hide:');
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  const ret = globalShortcut.register(config.QUICK_CMD, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  })

  if (!ret) {
    console.log('registration failed')
  }

  ipcMain.on('asynchronous-message', (event, arg) => {
    if (arg.type === 'search-results') {
      mainWindow.setSize(
        config.WINDOW_WIDTH,
        config.WINDOW_HEIGHT + config.WINDOW_HEIGHT * arg.qty
      );
    } else if (arg.type === 'search-selected') {
      execFile(path.join(__dirname, 'play.AppleScript'), [arg.id], (err, stdout, stderr) => {});
      event.sender.send('asynchronous-reply', {type: 'search-reset'});
      Menu.sendActionToFirstResponder('hide:');
    } else if (arg.type === 'search-abort') {
      event.sender.send('asynchronous-reply', {type: 'search-reset'});
      Menu.sendActionToFirstResponder('hide:');
    }
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
