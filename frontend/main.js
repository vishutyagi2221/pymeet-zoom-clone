import { app, BrowserWindow, systemPreferences } from 'electron';
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

  win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    import('electron').then(({ desktopCapturer }) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        // Grant access to the first screen found
        callback({ video: sources[0], audio: 'loopback' });
      }).catch((err) => {
        console.error('Error getting sources:', err);
        callback(null);
      });
    });
  });

  requestPermissions().then(() => {
    if (isDev) {
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools();
    } else {
      // Load the live deployed web app so the desktop app is always up to date!
      win.loadURL('https://pymeet-zoom-clone.vercel.app');
    }
  });

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'camera', 'microphone', 'display-capture'];
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
