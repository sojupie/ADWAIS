import {useState} from 'react';

export function useMobileMenu(pathname: string) {
  const [menuState, setMenuState] = useState({isOpen: false, pathname});
  const isOpen = menuState.isOpen && menuState.pathname === pathname;

  return {
    isOpen,
    close: () => setMenuState({isOpen: false, pathname}),
    toggle: () => setMenuState((current) => ({
      isOpen: current.pathname === pathname ? !current.isOpen : true,
      pathname,
    })),
  };
}
