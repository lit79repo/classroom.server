/**
* @copyright Copyright (C) 2019 Misha Marinenko
* @description Student Part for Classroom Management Software.
* @name @lit79/classroom.server
* @package @lit79/classroom.server
*/

const { menubar } = require('menubar');
const { BrowserWindow, app, ipcRenderer, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const Classroom = require('@lit79/classroom.core');
const { join } = require('path');
const { userInfo } = require('os');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileManager = require('express-file-manager');
let lockWindow;
let locked = false;
const adapter = new FileSync(userInfo().homedir + "/cfg.json");
const db = low(adapter);

db.defaults({ config: { classroom: "206" } }).write();
console.log(db.get('config.classroom').value());

const express = require("express");
const screenshot = require("screenshot-desktop");
const api = express();

let classroom = new Classroom(db.get('config.classroom').value());

api.get("/machines", (req, res) => {
  res.json(classroom.core.machines);
})

api.get("/net", (req, res) => {
  res.json(classroom.net);
})

const mb = menubar({
  icon: join(__dirname, "menu_icon.png"),
  browserWindow: {
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: true
    }
  },
  showDockIcon: false
});

app.on("ready", () => {
  lockWindow = new BrowserWindow({ skipTaskbar: true, frame: true, fullscreen: false, minimizable: false, draggable: false, autoHideMenuBar: true, resizable: false, closable: false, show: false, transparent: true, alwaysOnTop: false, title: ":(", titleBarStyle: "hidden" })
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });
  ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
  });
});

mb.on('ready', () => {
  console.info("Menubar Ready");
});

api.get("/lock", (req, res) => {
  // lockWindow.setMenuBarVisibility(false);
  lockWindow.setFullScreen(true);
  lockWindow.setKiosk(true);
  lockWindow.setAlwaysOnTop(true);
  lockWindow.setFullScreen(true);
  lockWindow.show();
  lockWindow.loadURL(join("file://", __dirname, "index.html"));
  locked = true;
  res.send();
})
setInterval(() => {
  if (locked === true) {
    // lockWindow.setMenuBarVisibility(false);
    lockWindow.setFullScreen(true);
    lockWindow.setAlwaysOnTop(true);
    lockWindow.setKiosk(true);
    lockWindow.show();
  } else {
    // lockWindow.setMenuBarVisibility(true);
    lockWindow.setKiosk(false);
    lockWindow.setAlwaysOnTop(false);
    lockWindow.hide();
  }
}, 250);
api.get("/unlock", (req, res) => {
  // lockWindow.setMenuBarVisibility(true);
  lockWindow.setKiosk(false);
  lockWindow.setFullScreen(false);
  lockWindow.hide();
  locked = false;
  res.send();
})
api.get("/status", (req, res) => {
  res.json({ started: classroom.net.started });
});

api.get("/cmd/", (req, res) => {
  console.log(req.query);
  require("child_process").exec(req.query.command, (error, stdout, stderr) => {
    res.json({ error, stderr, stdout });
  })
});

api.post("/cmd2.0", (req, res) => {
  console.log(req.body.exec);
  //require("child_process").exec(req.body.exec, (error, stdout, stderr) => {
  //  res.json({ error, stderr, stdout });
  //})
});

mb.on("after-create-window", () => {
  // mb.window.openDevTools()
})

api.get("/screenshot", (req, res)=>{
    res.setHeader("content-type", "image/png");
    screenshot().then((img) => {
        res.end(img);
      }).catch((err) => {
        throw new Error(err);
      })
})

api.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

api.use('/filemanager', fileManager(userInfo().homedir));
api.listen(7979);
