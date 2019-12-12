 /**
 * @copyright Copyright (C) 2019 Misha Marinenko
 * @description Student Part for Classroom Management Software.
 * @name @lit79/classroom.server
 * @package @lit79/classroom.server
 */

const { menubar } = require('menubar');
const { BrowserWindow, app } = require('electron');
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
    movable: false
  },
  showDockIcon: false
});

app.on("ready", () => {
  lockWindow = new BrowserWindow({ skipTaskbar: true, frame: true, fullscreen: false, minimizable: false, draggable: false, autoHideMenuBar: true, resizable: false, closable: false, show: false, transparent: true, alwaysOnTop: false, title: ":(", titleBarStyle: "hidden" })
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

mb.on("after-create-window", ()=>{
  // mb.window.openDevTools()
})

api.use('/filemanager', fileManager(userInfo().homedir));
api.listen(7979);
