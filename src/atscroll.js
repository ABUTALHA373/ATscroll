// src/atscroll.js
function ATscroll({
    color = { light: "#00000033", dark: "#ffffff33" },
    autoHide = "leave",
    scrollbarWidth = "6px"
} = {}) {
    const config = { color, autoHide, scrollbarWidth };

    const style = document.createElement("style");
    document.head.appendChild(style);

    function applyStyles() {
        style.innerHTML = `
      *::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; -ms-overflow-style: none; }

      .ats-container {
        position: relative;
        overflow: hidden !important;
      }

      .ats-scroll-content {
        overflow: auto;
        height: 100%;
        width: 100%;
        padding-right: ${config.scrollbarWidth};
        box-sizing: content-box;
      }

      .ats-scrollbar {
        position: absolute;
        top: 0;
        right: 2px;
        width: ${config.scrollbarWidth};
        border-radius: 3px;
        transition: opacity 0.2s, background 0.3s;
        opacity: ${config.autoHide === "leave" ? "0" : "1"};
        pointer-events: ${config.autoHide === "leave" ? "none" : "auto"};
        cursor: pointer;
      }

      ${config.autoHide === "leave" ? `
        .ats-container:hover .ats-scrollbar.visible {
          opacity: 1;
          pointer-events: auto;
        }` : ""}
    `;
    }

    function isDarkMode() {
        return document.documentElement.classList.contains("dark");
    }

    function setScrollbarColor(bar) {
        bar.style.background = isDarkMode() ? config.color.dark : config.color.light;
    }

    function wrapElement(el) {
        if (el.dataset.ats === "applied") return;

        const wrapper = document.createElement("div");
        wrapper.classList.add("ats-container");
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);

        el.classList.add("ats-scroll-content");
        el.dataset.ats = "applied";

        const bar = document.createElement("div");
        bar.classList.add("ats-scrollbar");
        wrapper.appendChild(bar);

        setScrollbarColor(bar);

        let isDragging = false, startY, startScrollTop;

        bar.addEventListener("mousedown", (e) => {
            isDragging = true;
            startY = e.clientY;
            startScrollTop = el.scrollTop;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const dy = e.clientY - startY;
            const scrollRatio = el.scrollHeight / el.clientHeight;
            el.scrollTop = startScrollTop + dy * scrollRatio;
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = "";
            }
        });

        function update() {
            const scrollable = el.scrollHeight > el.clientHeight;
            if (!scrollable) {
                bar.classList.remove("visible");
                return;
            }

            const ratio = el.clientHeight / el.scrollHeight;
            const barHeight = wrapper.clientHeight * ratio;
            const top = el.scrollTop * (wrapper.clientHeight / el.scrollHeight);

            bar.style.height = `${barHeight}px`;
            bar.style.transform = `translateY(${top}px)`;
            bar.classList.add("visible");
        }

        function scheduleUpdate() {
            if (el._atsRaf) cancelAnimationFrame(el._atsRaf);
            el._atsRaf = requestAnimationFrame(update);
        }

        el.addEventListener("scroll", update);
        window.addEventListener("resize", scheduleUpdate);

        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(el);
        resizeObserver.observe(wrapper);

        const mutationObserver = new MutationObserver(scheduleUpdate);
        mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

        const classObserver = new MutationObserver(() => setScrollbarColor(bar));
        classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        update();
    }

    function init() {
        applyStyles();

        const candidates = [...document.querySelectorAll("body, [class*='overflow-']")];
        candidates.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.overflowY === "auto" || style.overflowY === "scroll") {
                wrapElement(el);
            }
        });

        const globalObserver = new MutationObserver(() => init());
        globalObserver.observe(document.body, { childList: true, subtree: true });
    }

    // 👇 Auto-initialize
    init();
};

export default ATscroll;