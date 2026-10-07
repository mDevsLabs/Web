import { useCallback, useReducer } from "react";

export type MenubarMenuId =
  | "file"
  | "edit"
  | "view"
  | "window"
  | "terminal"
  | "help";

export type MenubarMenuState = Record<MenubarMenuId, boolean>;

const ALL_CLOSED: MenubarMenuState = {
  edit: false,
  file: false,
  help: false,
  terminal: false,
  view: false,
  window: false,
};

type Action =
  | { type: "toggleExclusive"; id: MenubarMenuId }
  | { type: "set"; id: MenubarMenuId; open: boolean };

function reducer(state: MenubarMenuState, action: Action): MenubarMenuState {
  switch (action.type) {
    case "toggleExclusive": {
      if (state[action.id]) {
        return ALL_CLOSED;
      }
      return { ...ALL_CLOSED, [action.id]: true };
    }
    case "set": {
      if (!action.open) {
        return state[action.id] ? { ...state, [action.id]: false } : state;
      }
      return { ...ALL_CLOSED, [action.id]: true };
    }
    default:
      return state;
  }
}

export function useMenubarMenuReducer() {
  const [menus, dispatch] = useReducer(reducer, ALL_CLOSED);

  const toggleMenubarMenu = useCallback((id: MenubarMenuId) => {
    dispatch({ id, type: "toggleExclusive" });
  }, []);

  const setMenubarMenu = useCallback((id: MenubarMenuId, open: boolean) => {
    dispatch({ id, open, type: "set" });
  }, []);

  const setTerminalMenuOpen = useCallback((open: boolean) => {
    dispatch({ id: "terminal", open, type: "set" });
  }, []);

  return {
    editMenuOpen: menus.edit,
    fileMenuOpen: menus.file,
    helpMenuOpen: menus.help,
    menus,
    setMenubarMenu,
    setTerminalMenuOpen,
    terminalMenuOpen: menus.terminal,
    toggleMenubarMenu,
    viewMenuOpen: menus.view,
    windowMenuOpen: menus.window,
  };
}
