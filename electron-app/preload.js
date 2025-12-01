const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据文件操作
  loadDataFile: (filePath) => ipcRenderer.invoke('load-data-file', filePath),
  saveDataFile: (filePath, data) => ipcRenderer.invoke('save-data-file', filePath, data),

  // 文件对话框
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  selectSavePath: (options) => ipcRenderer.invoke('select-save-path', options),

  // 目录操作
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),

  // 应用信息
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // 图片加载
  loadLocalImage: (imagePath) => ipcRenderer.invoke('load-local-image', imagePath)
});
