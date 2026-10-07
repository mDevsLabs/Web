export const app = { getPath: () => process.cwd() };
export class BrowserWindow {}
export const ipcMain = {
  handle: () => {},
  on: () => {},
};
export const shell = { openExternal: () => {} };
export default { app, BrowserWindow, ipcMain, shell };
