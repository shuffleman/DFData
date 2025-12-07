const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let gameWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1600,
    minHeight: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#1a1a1a'
  });

  // 加载游戏页面
  mainWindow.loadFile('game.html');

  // 开发模式下打开开发者工具
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 处理器 - 加载数据文件
ipcMain.handle('load-data-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理器 - 保存数据文件
ipcMain.handle('save-data-file', async (event, filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理器 - 选择文件
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// IPC 处理器 - 选择保存路径
ipcMain.handle('select-save-path', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// IPC 处理器 - 读取目录
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理器 - 获取应用路径
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// IPC 处理器 - 读取本地图片为 base64
ipcMain.handle('load-local-image', async (event, imagePath) => {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    return { success: true, data: `data:${mimeType};base64,${base64}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理器 - 加载游戏数据 JSON
ipcMain.handle('load-game-data', async (event, dataPath) => {
  try {
    // 支持绝对路径或相对路径
    const fullPath = dataPath.startsWith('/')
      ? path.join(__dirname, dataPath)
      : path.join(__dirname, dataPath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error(`[IPC] 加载数据失败: ${dataPath}`, error);
    return { success: false, error: error.message };
  }
});

// 创建游戏窗口
function createGameWindow() {
  if (gameWindow) {
    gameWindow.focus();
    return;
  }

  gameWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  gameWindow.loadFile('game.html');

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    gameWindow.webContents.openDevTools();
  }

  gameWindow.on('closed', () => {
    gameWindow = null;
  });
}

// IPC 处理器 - 打开游戏
ipcMain.on('open-game', () => {
  createGameWindow();
});
