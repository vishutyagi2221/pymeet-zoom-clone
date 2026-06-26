import { app, BrowserWindow, systemPreferences, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

async function requestPermissions() {
  if (process.platform !== 'darwin') return true;
  
  try {
    const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera');
    if (cameraPrivilege !== 'granted') {
      await systemPreferences.askForMediaAccess('camera');
    }
    
    const micPrivilege = systemPreferences.getMediaAccessStatus('microphone');
    if (micPrivilege !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "PyMeet",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  win.setMenuBarVisibility(false);

  let stopBarWindow = null;

  win.webContents.session.setDisplayMediaRequestHandler(async (request, callback) => {
    const { desktopCapturer } = await import('electron');

    const pickerWindow = new BrowserWindow({
      parent: win,
      modal: true,
      width: 800,
      height: 600,
      title: "Choose what to share",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'picker_preload.js'),
        contextIsolation: true
      }
    });
    pickerWindow.loadFile(path.join(__dirname, 'picker.html'));

    let sourceSelected = false;
    let fetchedSources = [];

    const cleanupListeners = () => {
      ipcMain.removeAllListeners('SOURCE_SELECTED');
      ipcMain.removeAllListeners('SOURCE_CANCELLED');
    };

    ipcMain.once('SOURCE_SELECTED', (event, sourceId) => {
      sourceSelected = true;
      const selected = fetchedSources.find(s => s.id === sourceId);
      callback({ video: selected });
      pickerWindow.close();
      cleanupListeners();

      // Open Stop Bar
      if (stopBarWindow) stopBarWindow.close();
      stopBarWindow = new BrowserWindow({
        width: 360, height: 60, alwaysOnTop: true, frame: false, resizable: false, transparent: true,
        webPreferences: { preload: path.join(__dirname, 'stop_bar_preload.js'), contextIsolation: true }
      });
      const display = screen.getPrimaryDisplay();
      stopBarWindow.setPosition(Math.floor((display.workAreaSize.width - 360) / 2), display.workAreaSize.height - 150);
      stopBarWindow.loadFile(path.join(__dirname, 'stop_bar.html'));
    });

    ipcMain.once('SOURCE_CANCELLED', () => {
      sourceSelected = true;
      callback(null);
      pickerWindow.close();
      cleanupListeners();
    });

    pickerWindow.on('closed', () => {
      if (!sourceSelected) {
        callback(null);
        cleanupListeners();
      }
    });

    try {
      fetchedSources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 150, height: 150 }, fetchWindowIcons: false });
      const serialized = fetchedSources.map(s => ({
        id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL()
      }));
      // send to pickerWindow if not destroyed
      if (!pickerWindow.isDestroyed()) {
        pickerWindow.webContents.send('SET_SOURCES', serialized);
      }
    } catch (err) {
      console.error('Error:', err);
      if (!sourceSelected) {
        callback(null);
        cleanupListeners();
        if (!pickerWindow.isDestroyed()) pickerWindow.close();
      }
    }
  });

  ipcMain.on('STOP_SHARING', () => {
    if (stopBarWindow) { stopBarWindow.close(); stopBarWindow = null; }
    win.webContents.executeJavaScript(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const shareBtn = buttons.find(b => b.title === 'Share Screen' || b.innerHTML.includes('lucide-monitor-up'));
      if (shareBtn) shareBtn.click();
    `).catch(err => console.log(err));
  });

  requestPermissions().then(() => {
    if (isDev) {
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools();
    } else {
      // Clear cache so chunk load errors don't happen after Vercel deployments!
      win.webContents.session.clearCache().then(() => {
        win.loadURL('https://pymeet-zoom-clone.vercel.app');
      });
    }
  });

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'camera', 'microphone', 'display-capture', 'clipboard-read', 'clipboard-write', 'clipboard-sanitized-write'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
