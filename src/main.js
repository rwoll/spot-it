import { app, globalShortcut, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import url from 'url';
import config from './config'
import { execFile } from 'child_process';
import Menubar from 'menubar';

if (process.platform !== 'darwin') {
  dialog.showErrorBox(
    'Incompatible OS',
    [`Your operating system (${process.platform}) is not supported at this time.`,
     'This application will now quit.',
     'Have a nice day!'].join('\n\n')
  );
  app.quit();
} else {
  let mb = new Menubar({
    index: url.format({
      pathname: path.join(__dirname, 'ui', 'index.html'),
      protocol: 'file:',
      slashes: true
    }),
    preloadWindow: true,
    width: config.WINDOW_WIDTH,
    height: config.WINDOW_HEIGHT,
    windowPosition: 'center'
  });

  mb.on('ready', () => {
    let menu = Menu.buildFromTemplate([{
      label: 'SpotIt',
      submenu: [{
        label: 'Quit Application',
        accelerator: 'Command+Q',
        selector: 'terminate:'
      }]
    }]);

    Menu.setApplicationMenu(menu)

    const ret = globalShortcut.register(config.QUICK_CMD, () => {
      mb.window.isVisible() ? mb.window.hide() : mb.window.show();
    });

    if (!ret) {
      console.log('registration failed')
    }

    ipcMain.on('asynchronous-message', (event, arg) => {
      switch (arg.type) {
        case 'search-results':
          mb.window.setSize(
            config.WINDOW_WIDTH,
            config.WINDOW_HEIGHT + config.WINDOW_HEIGHT * arg.qty
          );
          break;
        case 'search-selected':
          execFile(path.join(__dirname, 'play.AppleScript'), [arg.id], (err, stdout, stderr) => {});
          event.sender.send('asynchronous-reply', {type: 'search-reset'});
          mb.window.hide();
          break;
        case 'search-abort':
          event.sender.send('asynchronous-reply', {type: 'search-reset'});
          mb.window.hide();
          break;
        default:
          console.warn(`Unknown asynchronous-message received: ${arg.type}`);
          event.sender.send('asynchronous-reply', {type: 'search-reset'});
          mb.window.hide();

      }
    });

    mb.window.once('ready-to-show', () => {
      mb.window.show();
    });

    app.on('will-quit', () => {
      globalShortcut.unregister(config.QUICK_CMD);
      globalShortcut.unregisterAll();
    });
  });
}
