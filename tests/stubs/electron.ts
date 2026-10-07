export const app = { getPath: () => process.cwd() };
export class BrowserWindow {}
export const ipcMain = {
  handle: () => {},
  on: () => {},
};
export const shell = { openExternal: () => {} };
export type IpcMainEvent = any;
export type IpcMainInvokeEvent = any;
export type IpcRendererEvent = any;
export type Event = any;
export default { app, BrowserWindow, ipcMain, shell };
