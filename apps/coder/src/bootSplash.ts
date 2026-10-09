/**
 * 与 IPC 首屏就绪对齐后再隐藏启动页，避免界面已显示但主线程仍长时间卡顿的错觉。
 */
export function hideBootSplash(): void {
  const el = document.getElementById("boot-splash");
  if (!el || el.dataset.dismissed === "1") {
    return;
  }
  el.dataset.dismissed = "1";
  el.classList.add("is-hidden");
  window.setTimeout(() => el.remove(), 320);
}
