import { app, BrowserWindow, nativeImage, shell } from "electron";
import * as path from "node:path";
import { registerIPCHandlers } from "./ipc/handlers";

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function getIconPath(): string {
  if (isDev) {
    return path.join(process.cwd(), "public/common/icon.png");
  }
  return path.join(process.resourcesPath, "public/common/icon.png");
}

function createWindow() {
  const icon = nativeImage.createFromPath(getIconPath());

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 14 },
    show: false,
  });

  // macOS Dock 图标
  if (process.platform === "darwin" && !icon.isEmpty()) {
    app.dock.setIcon(icon);
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 拦截所有新窗口打开请求，改为使用系统默认浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // 拦截所有导航请求（非原点导航），改为使用系统默认浏览器打开
  mainWindow.webContents.on("will-navigate", (event, url) => {
    // 允许 dev 模式下的 localhost 导航和 file 协议导航
    const isDevLocalhost = isDev && url.startsWith("http://localhost");
    const isFileProtocol = url.startsWith("file:");
    
    if (!isDevLocalhost && !isFileProtocol && (url.startsWith("http:") || url.startsWith("https:"))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

app.whenReady().then(() => {
  registerIPCHandlers(getMainWindow);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
