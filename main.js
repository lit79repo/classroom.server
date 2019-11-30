const { menubar } = require('menubar');
const { BrowserWindow, app } = require('electron');
const Classroom = require('@lit79/classroom.core');
const { join } = require('path');
const { userInfo } = require('os');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync(userInfo().homedir + "/.cfg.json");
const db = low(adapter);

db.defaults({ config: { classroom: "all" } }).write();
console.log(db.get('config.classroom').value());
const express = require("express");

const api = express();
let classroom = new Classroom(db.get('config.classroom').value());

api.get("/machines", (req, res) => {
  res.json(classroom.core.machines);
})

app.on("ready", () => {
  let locked = false;
  let lockWindow = new BrowserWindow({ skipTaskbar: true, frame: true, fullscreen: true, minimizable: false, darkTheme: true, draggable: false, autoHideMenuBar: true, resizable: false, closable: false, vibrancy: "dark", show: false, transparent: true, alwaysOnTop: true, title: ":(", titleBarStyle: "hidden" })


  api.get("/lock", (req, res) => {
    lockWindow.setMenuBarVisibility(false);
    lockWindow.setFullScreen(true);
    lockWindow.setKiosk(true);
    lockWindow.show();
    lockWindow.loadURL(join("file://", __dirname, "index.html"));
    locked = true;
    res.send();
  })
  setInterval(() => {
    if (locked) {
      lockWindow.setMenuBarVisibility(false);
      lockWindow.setFullScreen(true);
      lockWindow.setKiosk(true);
      lockWindow.show();
      lockWindow.loadURL(join("file://", __dirname, "index.html"));
    }
  }, 250);
  api.get("/unlock", (req, res) => {
    lockWindow.setMenuBarVisibility(true);
    lockWindow.setKiosk(false);
    lockWindow.hide();
    locked = false;
    res.send();
  })
  api.get("/status", (req, res) => {
    res.json(classroom.net.started);
  })
  const mb = menubar({
    icon: join(__dirname, "menu_icon.png"),
    browserWindow: {
      resizable: false,
      movable: false
    },
    showDockIcon: false
  });

  mb.on('ready', () => {
    api.listen(7979);
  });
});
