// Ce pont ne charge que dans la fenêtre locale du terminal.
import { contextBridge, ipcRenderer } from "electron";
import type { CliState, CliTerminalBridge } from "./cli-protocol";
const bridge: CliTerminalBridge = {
  start: () => ipcRenderer.invoke("cli:start"),
  install: () => ipcRenderer.invoke("cli:install"),
  write: (data) => ipcRenderer.send("cli:write", data),
  resize: (cols, rows) => ipcRenderer.send("cli:resize", cols, rows),
  openHelp: () => ipcRenderer.invoke("cli:help"),
  onData: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, data: string) => listener(data);
    ipcRenderer.on("cli:data", handler);
    return () => { ipcRenderer.removeListener("cli:data", handler); };
  },
  onState: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, state: CliState) => listener(state);
    ipcRenderer.on("cli:state", handler);
    return () => { ipcRenderer.removeListener("cli:state", handler); };
  },
};
contextBridge.exposeInMainWorld("maiTerminal", bridge);
