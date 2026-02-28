const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');

let mainWindow;
let ollamaProcess = null;

// Check if Ollama is already running
function checkOllama() {
  return new Promise((resolve) => {
    http.get('http://localhost:11434/api/tags', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// Wait for Ollama to be ready
function waitForOllama(maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const ready = await checkOllama();
      if (ready) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Ollama did not start in time'));
      }
    }, 1000);
  });
}

// Try to start Ollama if not running
async function ensureOllama() {
  const running = await checkOllama();
  if (running) {
    console.log('Ollama already running');
    return true;
  }

  console.log('Starting Ollama...');
  // Try common Windows install paths
  const ollamaPaths = [
    'ollama',
    'C:\\Users\\' + (process.env.USERNAME || 'user') + '\\AppData\\Local\\Programs\\Ollama\\ollama.exe',
    'C:\\Program Files\\Ollama\\ollama.exe',
  ];

  for (const ollamaPath of ollamaPaths) {
    try {
      ollamaProcess = spawn(ollamaPath, ['serve'], {
        detached: false,
        stdio: 'ignore',
        windowsHide: true,
      });
      ollamaProcess.on('error', () => {}); // suppress errors silently
      break;
    } catch (e) {
      continue;
    }
  }

  try {
    await waitForOllama(15);
    return true;
  } catch (e) {
    return false; // Ollama not installed, app will show instructions
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#050508',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC handlers for window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// IPC: check ollama status
ipcMain.handle('check-ollama', async () => {
  return await checkOllama();
});

// IPC: get available models
ipcMain.handle('get-models', async () => {
  return new Promise((resolve) => {
    http.get('http://localhost:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.models?.map(m => m.name) || []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
});

app.whenReady().then(async () => {
  await ensureOllama();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});
