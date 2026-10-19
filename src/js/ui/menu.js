/**
 * @typedef {{
 *   id: string, label: string, shortcut?: string, checked?: boolean,
 *   disabled?: boolean, action?: () => void, items?: MenuEntry[]
 * }} MenuItem
 * @typedef {MenuItem | {separator: true}} MenuEntry
 * @typedef {{id: string, label: string, items: MenuEntry[]}} MenuModel
 */

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * A menu bar that behaves like the one in Windows XP: a click opens a menu, moving the
 * pointer over another title switches to it, a press outside or Escape closes it,
 * submenus open on hover or click, a click on an item runs it and closes the menus.
 *
 * The bar is drawn from a model returned by `getMenus()`. It is rebuilt by `render()`,
 * which is also called after every item action so that check marks stay current.
 *
 * @param {{container: HTMLElement, document: Document, getMenus: () => MenuModel[]}} options
 * @returns {{render: () => void, close: () => void, isOpen: () => boolean, destroy: () => void}}
 */
export function createMenuBar({ container, document, getMenus }) {
  let openMenu = null; // id of the open menu
  let openSubmenu = null; // id of the item whose submenu is open
  let wrappers = []; // { id, element }
  let submenuItems = []; // { id, element }

  function applyOpenState() {
    wrappers.forEach(({ id, element: node }) => {
      node.classList.toggle("menubar__menu--open", id === openMenu);
    });
    submenuItems.forEach(({ id, element: node }) => {
      node.classList.toggle("menu__item--open", id === openSubmenu);
    });
  }

  function open(menuId) {
    openMenu = menuId;
    openSubmenu = null;
    applyOpenState();
  }

  function close() {
    open(null);
  }

  function buildItem(model, isInSubmenu) {
    const node = element("div", "menu__item");
    node.dataset.item = model.id;
    node.append(
      element("span", "menu__label", model.label),
      element("span", "menu__shortcut", model.shortcut ?? ""),
    );
    if (model.checked) {
      node.classList.add("menu__item--checked");
    }
    if (model.disabled) {
      node.classList.add("menu__item--disabled");
    }

    if (model.items) {
      node.classList.add("menu__item--submenu");
      node.append(buildMenu(model.items, true));
      submenuItems.push({ id: model.id, element: node });
      const openIt = () => {
        openSubmenu = model.id;
        applyOpenState();
      };
      node.addEventListener("pointerover", openIt);
      node.addEventListener("click", openIt);
      return node;
    }

    node.addEventListener("click", (event) => {
      event.stopPropagation();
      if (model.disabled) {
        return;
      }
      close();
      model.action?.();
      render();
    });
    if (!isInSubmenu) {
      node.addEventListener("pointerover", () => {
        openSubmenu = null;
        applyOpenState();
      });
    }
    return node;
  }

  function buildMenu(entries, isSubmenu) {
    const node = element("div", isSubmenu ? "menu menu--sub" : "menu");
    for (const entry of entries) {
      node.append(
        entry.separator
          ? element("div", "menu__separator")
          : buildItem(entry, isSubmenu),
      );
    }
    return node;
  }

  function render() {
    const menus = getMenus();
    if (!menus.some((menu) => menu.id === openMenu)) {
      openMenu = null;
    }
    wrappers = [];
    submenuItems = [];
    container.replaceChildren(
      ...menus.map((menu) => {
        const wrapper = element("div", "menubar__menu");
        wrapper.dataset.menu = menu.id;
        const title = element("button", "menubar__item", menu.label);
        title.type = "button";
        title.addEventListener("click", () => {
          open(openMenu === menu.id ? null : menu.id);
        });
        title.addEventListener("pointerover", () => {
          if (openMenu !== null && openMenu !== menu.id) {
            open(menu.id);
          }
        });
        wrapper.append(title, buildMenu(menu.items, false));
        wrappers.push({ id: menu.id, element: wrapper });
        return wrapper;
      }),
    );
    applyOpenState();
  }

  function onPointerDown(event) {
    if (openMenu !== null && !container.contains(event.target)) {
      close();
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && openMenu !== null) {
      close();
    }
  }

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);

  return {
    render,
    close,
    isOpen: () => openMenu !== null,
    destroy() {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      container.replaceChildren();
    },
  };
}
