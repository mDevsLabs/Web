/// <reference types="vite/client" />
import type * as React from "react";

export interface MaiShellAPI {
  getPathForFile?(file: File): string | null;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  setUnreadBadgeCount?(count: number): Promise<unknown>;
  subscribeAutoUpdateStatus?(
    callback: (payload: { state: string } & Record<string, unknown>) => void
  ): () => void;
  subscribeBrowserControl?(callback: (payload: unknown) => void): () => void;
  subscribeBrowserNewWindow?(
    callback: (payload: { url: string; disposition?: string }) => void
  ): () => void;
  subscribeCaptureAnalysisDispatch?(
    callback: (payload: {
      prompt?: string;
      mode?: string;
      sourceUrl?: string;
      scope?: string;
    }) => void
  ): () => void;
  subscribeChat(callback: (payload: unknown) => void): () => void;
  subscribeComposerAppendDraft?(
    callback: (payload: { text?: string } | string) => void
  ): () => void;
  subscribeGoogleLoginExternal?(
    callback: (payload: { url: string; error?: string | null }) => void
  ): () => void;
  subscribeLayout?(callback: () => void): () => void;
  subscribeMaiAccount?(callback: (payload: any) => void): () => void;
  subscribeOpenSettingsNav?(callback: (nav: string) => void): () => void;
  subscribePluginsChanged?(callback: () => void): () => void;
  subscribeTerminalSessionAuthPrompt?(
    callback: (
      id: string,
      prompt: {
        prompt: string;
        kind: "password" | "passphrase";
        seq: number;
      } | null
    ) => void
  ): () => void;
  subscribeTerminalSessionData?(
    callback: (id: string, data: string, seq: number) => void
  ): () => void;
  subscribeTerminalSessionExit?(
    callback: (id: string, code: unknown) => void
  ): () => void;
  subscribeTerminalSessionListChanged?(callback: () => void): () => void;
  subscribeThemeMode?(callback: (payload: unknown) => void): () => void;
  subscribeTrayCommand?(
    callback: (payload: { command?: string }) => void
  ): () => void;
  subscribeWorkspaceFileIndexReady?(
    callback: (workspaceRootNorm: string) => void
  ): () => void;
  subscribeWorkspaceFsTouched?(callback: () => void): () => void;
}
// Alias rétro-compatibilité
export type AsyncShellAPI = MaiShellAPI;

declare global {
  interface MaiShellWebviewElement extends HTMLElement {
    canGoBack(): boolean;
    canGoForward(): boolean;
    capturePage(): Promise<{
      toDataURL(): string;
      getSize(): { width: number; height: number };
    }>;
    executeJavaScript<T = unknown>(
      code: string,
      userGesture?: boolean
    ): Promise<T>;
    getURL(): string;
    getUserAgent(): string;
    getWebContentsId(): number;
    goBack(): void;
    goForward(): void;
    loadURL(url: string, options?: Record<string, unknown>): Promise<void>;
    reload(): void;
    setUserAgent(userAgent: string): void;
    stop(): void;
  }
  interface AsyncShellWebviewElement extends HTMLElement {
    canGoBack(): boolean;
    canGoForward(): boolean;
    capturePage(): Promise<{
      toDataURL(): string;
      getSize(): { width: number; height: number };
    }>;
    executeJavaScript<T = unknown>(
      code: string,
      userGesture?: boolean
    ): Promise<T>;
    getURL(): string;
    getUserAgent(): string;
    getWebContentsId(): number;
    goBack(): void;
    goForward(): void;
    loadURL(url: string, options?: Record<string, unknown>): Promise<void>;
    reload(): void;
    setUserAgent(userAgent: string): void;
    stop(): void;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.WebViewHTMLAttributes<MaiShellWebviewElement>,
        MaiShellWebviewElement
      >;
    }
  }

  interface Window {
    __voidShellTabCloseLog?: Array<{
      iso: string;
      tag: string;
      detail: Record<string, unknown>;
    }>;
    asyncShell?: MaiShellAPI;
    maiShell?: MaiShellAPI;
  }
}
