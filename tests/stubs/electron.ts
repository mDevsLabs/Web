export const app = {
  getPath: (_name?: string) => process.cwd(),
  getVersion: () => "0.9.2",
  isPackaged: false,
};
export class BrowserWindow {}
export const ipcMain = {
  handle: () => {},
  on: () => {},
};
export const shell = {
  openExternal: (_url: string) => Promise.resolve(),
  openPath: (_path: string) => Promise.resolve(""),
};
export type IpcMainEvent = any;
export type IpcMainInvokeEvent = any;
export type IpcRendererEvent = any;
export type Event = any;
export default { app, BrowserWindow, ipcMain, shell };
