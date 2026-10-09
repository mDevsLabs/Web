import { useI18n } from "./i18n";

export type MenubarWindowMenuProps = {
  onClose: () => void;
  isDesktopShell: boolean;
  windowMaximized: boolean;
  onNewWindow: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onCloseWindow: () => void;
};

export function MenubarWindowMenu({
  onClose,
  isDesktopShell,
  windowMaximized,
  onNewWindow,
  onMinimize,
  onToggleMaximize,
  onCloseWindow,
}: MenubarWindowMenuProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t("app.windowMenu.aria")}
      className="ref-menu-dropdown"
      role="menu"
    >
      <button
        className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
        disabled={!isDesktopShell}
        onClick={() => {
          onNewWindow();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>{t("app.fileMenu.newWindow")}</span>
      </button>
      <div className="ref-menu-dropdown-sep" role="separator" />
      <button
        className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
        disabled={!isDesktopShell}
        onClick={() => {
          onMinimize();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>{t("app.window.minimize")}</span>
      </button>
      <button
        className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
        disabled={!isDesktopShell}
        onClick={() => {
          onToggleMaximize();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>
          {windowMaximized ? t("app.window.restore") : t("app.window.maximize")}
        </span>
      </button>
      <div className="ref-menu-dropdown-sep" role="separator" />
      <button
        className="ref-menu-dropdown-item ref-menu-dropdown-item--row"
        disabled={!isDesktopShell}
        onClick={() => {
          onCloseWindow();
          onClose();
        }}
        role="menuitem"
        type="button"
      >
        <span>{t("app.window.close")}</span>
      </button>
    </div>
  );
}
