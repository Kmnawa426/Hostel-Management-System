(function () {
  function getCurrentPageFile() {
    const path = (window.location.pathname || "").split("/").pop();
    return (path || "dashboard.html").toLowerCase();
  }

  function hasActionControl(labels) {
    const wanted = labels.map(v => v.toLowerCase());
    const nodes = Array.from(document.querySelectorAll("button, a, input[type='button'], input[type='submit']"));

    return nodes.some(node => {
      const text = ((node.textContent || node.value || "") + "").trim().toLowerCase();
      if (!text) return false;
      return wanted.some(label => text === label || text.includes(label));
    });
  }

  function installGlobalNavActions() {
    const pageFile = getCurrentPageFile();
    if (pageFile === "login.html" || pageFile === "index.html") return;
    if (document.getElementById("globalNavActions")) return;

    const hasBackAlready = pageFile === "dashboard.html" || hasActionControl(["back"]);
    const hasLogoutAlready = hasActionControl(["logout", "sign out", "signout"]);

    if (hasBackAlready && hasLogoutAlready) return;

    const style = document.createElement("style");
    style.textContent = `
      #globalNavActions {
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #globalNavActions .global-nav-btn {
        min-width: 44px;
        width: 44px;
        height: 44px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(15, 23, 42, 0.14);
        border-radius: 999px;
        font-size: 20px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      }
      #globalNavActions .btn-back {
        background: #ffffff;
        color: #0f172a;
      }
      @media (max-width: 700px) {
        #globalNavActions {
          left: 12px;
          bottom: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    const wrapper = document.createElement("div");
    wrapper.id = "globalNavActions";

    if (!hasBackAlready) {
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "global-nav-btn btn-back";
      backButton.textContent = "◀";
      backButton.setAttribute("aria-label", "Back");
      backButton.setAttribute("title", "Back");
      backButton.addEventListener("click", function () {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
      wrapper.appendChild(backButton);

      const isOpenOverlayVisible = () => {
        if (document.body.classList.contains("drawer-open")) return true;

        const overlaySelectors = [
          ".modal",
          ".modal.fade",
          ".status-modal",
          ".app-export-modal",
          ".modal-backdrop"
        ];
        const overlays = Array.from(document.querySelectorAll(overlaySelectors.join(",")));
        return overlays.some(isVisible);
      };

      const refreshBackButtonVisibility = () => {
        backButton.style.display = isOpenOverlayVisible() ? "none" : "inline-flex";
      };

      refreshBackButtonVisibility();

      document.addEventListener("click", () => setTimeout(refreshBackButtonVisibility, 0), true);
      document.addEventListener("keydown", () => setTimeout(refreshBackButtonVisibility, 0), true);

      const bodyObserver = new MutationObserver(refreshBackButtonVisibility);
      bodyObserver.observe(document.body, { attributes: true, childList: true, subtree: true });
    }

    if (wrapper.children.length > 0) {
      document.body.appendChild(wrapper);
    }
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getActiveModal() {
    const candidates = Array.from(document.querySelectorAll(".modal, .modal.fade"));
    const visible = candidates.filter(isVisible);
    return visible.length ? visible[visible.length - 1] : null;
  }

  function pickSubmitButton(scope) {
    const selectors = [
      "[data-enter-submit='true']",
      "button[type='submit']",
      ".btn-primary",
      ".primary",
      ".btn-danger",
      ".danger",
      "#confirmYes",
      "button"
    ];

    for (const selector of selectors) {
      const buttons = Array.from(scope.querySelectorAll(selector));
      const btn = buttons.find(b =>
        !b.disabled &&
        isVisible(b) &&
        !b.classList.contains("btn-secondary") &&
        !b.classList.contains("secondary") &&
        !b.classList.contains("btn-light") &&
        !b.classList.contains("btn-close")
      );
      if (btn) return btn;
    }

    return null;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

    const target = e.target;
    if (!target) return;

    const tag = (target.tagName || "").toLowerCase();
    if (tag === "textarea" || target.isContentEditable) return;

    const form = target.closest("form");
    const modal = target.closest(".modal") || getActiveModal();
    const isPassword = (target.type || "").toLowerCase() === "password";

    if (!form && !modal && !isPassword) return;

    if (form && typeof form.requestSubmit === "function") {
      e.preventDefault();
      form.requestSubmit();
      return;
    }

    const scope = modal || document;
    const submitBtn = pickSubmitButton(scope);
    if (!submitBtn) return;

    e.preventDefault();
    submitBtn.click();
  });

  document.addEventListener("DOMContentLoaded", function () {
    installGlobalNavActions();

    const pageFile = getCurrentPageFile();
    const hasTopbar = !!document.querySelector(".topbar");
    const hasFixedTitle = !!document.querySelector(".page-title-fixed");
    const hasPageTitle = !!document.querySelector(".page-title");
    const titleText = (document.title || "").trim();
    const disableAutoTitle = document.body && document.body.dataset && document.body.dataset.autoTitleBar === "off";
    const usesSharedLayout = pageFile !== "login.html" && pageFile !== "index.html";

    if (!disableAutoTitle && !usesSharedLayout && !hasTopbar && !hasFixedTitle && !hasPageTitle && titleText) {
      const titleBar = document.createElement("div");
      titleBar.className = "page-title-fixed";
      titleBar.textContent = titleText;
      document.body.prepend(titleBar);
    }
  });
})();
