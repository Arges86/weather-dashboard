import path from 'path';
import url from 'url';
import { app, Menu, BrowserWindow, shell, powerSaveBlocker, ipcMain } from 'electron';
import settings from 'electron-settings';

import { devMenuTemplate } from './menu/dev_menu_template';
import { session } from 'electron';

import env from 'env';

const setApplicationMenu = () => {
  const menus = [];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

let id = null;
/** @type BrowserWindow */
let mainWindow = null;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  setApplicationMenu();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
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
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.on('new-window', function (event, url) {
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

const newEvent = require('./express.js');
const userEmitter = newEvent.emitter;

// emites from http server when settings are saved
userEmitter.on('save-data', (data) => {
  if (data) {
    mainWindow.reload();
  }
});

ipcMain.handle("get-settings", async () => {
  const allSettings = await settings.get();
  return allSettings;
});

ipcMain.handle("set-settings", async (event, data) => {
  settings.setSync(data);
});

ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: 'Close Program',
      click: () => {
        mainWindow.close();
      },
    },
    { type: 'separator' },
    {
      label: 'Update Settings',
      click: () => {
        event.sender.send('context-menu-command', 'menu-item-1')
      },
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup(BrowserWindow.fromWebContents(event.sender))
});

ipcMain.handle('reload-window', () => {
  mainWindow.reload();
})