const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_MODE = process.argv.includes('--screenshot');
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0e1016',
    title: 'Mockcraft',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());

  if (SCREENSHOT_MODE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage();
          const out = path.join(__dirname, 'docs', 'screenshot.png');
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, image.toPNG());
          console.log('Screenshot written to ' + out);
        } catch (e) {
          console.error('Screenshot failed:', e.message);
        }
        app.quit();
      }, 3500);
    });
  }
}

// ---- IPC: file dialogs + saving (all local, no network) ----
ipcMain.handle('open-image', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Choose your design',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const p = res.filePaths[0];
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return { name: path.basename(p), dataUrl: `data:image/${mime};base64,${buf.toString('base64')}` };
});

ipcMain.handle('save-png', async (_e, suggestedName, base64) => {
  const res = await dialog.showSaveDialog(win, {
    title: 'Export mockup',
    defaultPath: suggestedName,
    filters: [{ name: 'PNG image', extensions: ['png'] }],
  });
  if (res.canceled || !res.filePath) return null;
  fs.writeFileSync(res.filePath, Buffer.from(base64, 'base64'));
  return res.filePath;
});

ipcMain.handle('save-batch', async (_e, files) => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Choose export folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const dir = res.filePaths[0];
  const written = [];
  for (const f of files) {
    const out = path.join(dir, f.name);
    fs.writeFileSync(out, Buffer.from(f.base64, 'base64'));
    written.push(out);
  }
  return { dir, count: written.length };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
