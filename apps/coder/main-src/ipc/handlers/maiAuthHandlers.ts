import { ipcMain } from "electron";
import {
  maiLogin,
  maiLogout,
  maiRegister,
  maiResendCode,
  maiVerifyLogin,
  maiVerifyRegister,
  syncMaiAccountWithToken,
} from "../../maiAccountStore.js";
import { getSettings } from "../../settingsStore.js";

export function registerMaiAuthHandlers(): void {
  ipcMain.handle("mai:getAccount", () => getSettings().maiAccount ?? {});

  ipcMain.handle(
    "mai:login",
    async (_e, payload: { identifier: string; password: string }) =>
      await maiLogin(payload.identifier, payload.password)
  );

  ipcMain.handle(
    "mai:verifyLogin",
    async (_e, payload: { email: string; code: string }) =>
      await maiVerifyLogin(payload.email, payload.code)
  );

  ipcMain.handle(
    "mai:register",
    async (
      _e,
      payload: { email: string; username: string; password: string }
    ) => await maiRegister(payload.email, payload.username, payload.password)
  );

  ipcMain.handle(
    "mai:verifyRegister",
    async (
      _e,
      payload: {
        email: string;
        username: string;
        password: string;
        code: string;
      }
    ) =>
      await maiVerifyRegister(
        payload.email,
        payload.username,
        payload.password,
        payload.code
      )
  );

  ipcMain.handle(
    "mai:resendCode",
    async (_e, payload: { email: string; action: "login" | "register" }) =>
      await maiResendCode(payload.email, payload.action)
  );

  ipcMain.handle("mai:refreshUsage", async () => {
    const account = getSettings().maiAccount;
    if (!account?.jwtToken) {
      return { message: "Non authentifié.", ok: false };
    }
    const updated = await syncMaiAccountWithToken(account.jwtToken);
    return { account: updated, ok: true };
  });

  ipcMain.handle("mai:logout", () => maiLogout());
}
