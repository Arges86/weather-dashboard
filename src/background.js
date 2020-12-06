// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import {app, Menu, BrowserWindow, shell, powerSaveBlocker} from 'electron';
import {devMenuTemplate} from './menu/dev_menu_template';
import {session} from 'electron';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env';

const setApplicationMenu = () => {
  const menus = [];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

let id = null;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  mainWindow.setMenu(null);
  mainWindow.setFullScreen(true);

  mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true,
      }),
  );

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'DashboardAPI';
    delete details.requestHeaders['Sec-Fetch-Site'];
    callback({cancel: false, requestHeaders: details.requestHeaders});
  });

  mainWindow.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  if (env.name === 'development') {
    mainWindow.openDevTools();
    mainWindow.setFullScreen(false);
  }
  id = powerSaveBlocker.start('prevent-display-sleep');
});

app.on('window-all-closed', () => {
  powerSaveBlocker.stop(id);
  app.quit();
});
