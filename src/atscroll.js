// src/atscroll.js
function ATscroll({
    color = { light: "#00000033", dark: "#ffffff33" },
    autoHide = "leave",
    scrollbarWidth = "6px"
} = {}) {
    const config = { color, autoHide, scrollbarWidth };

    // Create global style element with !important rules
    const style = document.createElement("style");
    style.innerHTML = `
        *::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

        .ats-container {
            position: relative !important;
            overflow: hidden !important;
        }

        .ats-scroll-content {
            overflow: auto !important;
            height: 100% !important;
            width: 100% !important;
            padding-right: ${config.scrollbarWidth} !important;
            box-sizing: content-box !important;
            -webkit-overflow-scrolling: touch !important;
        }

        .ats-scrollbar {
            position: absolute !important;
            top: 0 !important;
            right: 2px !important;
            width: ${config.scrollbarWidth} !important;
            border-radius: 3px !important;
            transition: opacity 0.15s, height 0.15s, transform 0.15s !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: 9999 !important;
            display: none !important;
            background: ${color.light} !important;
        }

        .ats-scrollbar.visible {
            display: block !important;
            opacity: ${config.autoHide === "leave" ? "0" : "1"} !important;
            pointer-events: ${config.autoHide === "leave" ? "none" : "auto"} !important;
        }

        ${config.autoHide === "leave" ? `
            .ats-container:hover .ats-scrollbar.visible {
                opacity: 1 !important;
                pointer-events: auto !important;
            }` : ""}

        .dark .ats-scrollbar {
            background: ${color.dark} !important;
        }
    `;
    document.head.appendChild(style);

    // Track all wrapped elements (using both WeakMap and Set for iteration)
    const wrappedElements = new WeakMap();
    const wrappedElementsSet = new Set();

    // Immediate update system with forced synchronous layout
    function updateScrollbar(el) {
        const data = wrappedElements.get(el);
        if (!data) return;

        // Force synchronous layout calculation
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        const scrollable = scrollHeight > clientHeight + 1; // +1px tolerance

        if (scrollable) {
            const ratio = clientHeight / scrollHeight;
            const barHeight = Math.max(data.wrapper.clientHeight * ratio, 20);
            const top = Math.min(
                el.scrollTop * ratio,
                data.wrapper.clientHeight - barHeight
            );

            data.bar.style.height = `${barHeight}px`;
            data.bar.style.transform = `translateY(${top}px)`;
            data.bar.classList.add("visible");
        } else {
            data.bar.style.height = "0px";
            data.bar.classList.remove("visible");
        }
    }

    // Global event listener for instant updates
    function handleGlobalEvent() {
        wrappedElementsSet.forEach(el => {
            // Force synchronous update
            void el.offsetHeight; // Trigger layout
            updateScrollbar(el);
        });
    }

    // Set up global event listeners with a 20ms timeout as requested
    const events = [
        'click', 'mousedown', 'mouseup', 'keydown', 'keyup',
        'input', 'change', 'focus', 'blur', 'scroll',
        'touchstart', 'touchend', 'resize'
    ];

    events.forEach(event => {
        document.addEventListener(event, () => {
            setTimeout(handleGlobalEvent, 20);
        }, { passive: true });
    });

    // Ultra-sensitive DOM observer
    const domObserver = new MutationObserver(mutations => {
        const affectedElements = new Set();

        mutations.forEach(mutation => {
            // Check target node
            if (mutation.target.nodeType === Node.ELEMENT_NODE) {
                let parent = mutation.target;
                while (parent) {
                    if (wrappedElements.has(parent)) {
                        affectedElements.add(parent);
                    }
                    parent = parent.parentElement;
                }
            }

            // Check added/removed nodes
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    let parent = node;
                    while (parent) {
                        if (wrappedElements.has(parent)) {
                            affectedElements.add(parent);
                        }
                        parent = parent.parentElement;
                    }
                }
            });

            mutation.removedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    let parent = node;
                    while (parent) {
                        if (wrappedElements.has(parent)) {
                            affectedElements.add(parent);
                        }
                        parent = parent.parentElement;
                    }
                }
            });
        });

        affectedElements.forEach(el => {
            // Immediate update with forced layout
            void el.offsetHeight;
            updateScrollbar(el);
        });
    });

    // Start observing the entire document
    domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ['style', 'class', 'id']
    });

    function wrapElement(el) {
        if (wrappedElements.has(el)) return;

        const wrapper = document.createElement("div");
        wrapper.classList.add("ats-container");
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);

        el.classList.add("ats-scroll-content");

        const bar = document.createElement("div");
        bar.classList.add("ats-scrollbar");
        wrapper.appendChild(bar);

        let isDragging = false, startY, startScrollTop;

        // Drag handling
        bar.addEventListener("mousedown", (e) => {
            isDragging = true;
            startY = e.clientY;
            startScrollTop = el.scrollTop;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const dy = e.clientY - startY;
            const scrollRatio = el.scrollHeight / el.clientHeight;
            el.scrollTop = startScrollTop + dy * scrollRatio;
            updateScrollbar(el);
        };

        const handleMouseUp = () => {
            isDragging = false;
            document.body.style.userSelect = "";
            updateScrollbar(el);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        // Watch for element size changes
        const resizeObserver = new ResizeObserver(() => {
            void el.offsetHeight; // Force layout
            updateScrollbar(el);
        });
        resizeObserver.observe(el);
        resizeObserver.observe(wrapper);

        // Watch for scroll events
        el.addEventListener("scroll", () => {
            void el.offsetHeight; // Force layout
            updateScrollbar(el);
        }, { passive: true });

        // Store element references
        const elementData = {
            wrapper,
            bar,
            observers: [resizeObserver],
            listeners: [handleMouseMove, handleMouseUp]
        };

        wrappedElements.set(el, elementData);
        wrappedElementsSet.add(el);

        // Initial update with forced layout
        setTimeout(() => {
            void el.offsetHeight;
            updateScrollbar(el);
        }, 0);
    }

    // Initialize scrollbars on matching elements
    function init() {
        const scrollableSelectors = [
            "body",
            "[class*='overflow-']",
            "[data-scrollable]",
            ".scrollable",
            ".scroll-container"
        ].join(",");

        // Process existing elements
        document.querySelectorAll(scrollableSelectors).forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.overflowY === "auto" || style.overflowY === "scroll") {
                wrapElement(el);
            }
        });

        // Watch for new elements
        const elementObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const elements = Array.from(node.querySelectorAll(scrollableSelectors))
                            .concat(node.matches(scrollableSelectors) ? [node] : []);

                        elements.forEach(el => {
                            const style = window.getComputedStyle(el);
                            if (style.overflowY === "auto" || style.overflowY === "scroll") {
                                wrapElement(el);
                                void el.offsetHeight;
                                updateScrollbar(el);
                            }
                        });
                    }
                });
            });
        });

        elementObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when ready
    if (document.readyState === "complete") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }

    // Return cleanup API
    return {
        destroy: () => {
            domObserver.disconnect();
            events.forEach(event => {
                document.removeEventListener(event, handleGlobalEvent);
            });

            wrappedElementsSet.forEach(el => {
                const data = wrappedElements.get(el);
                if (data) {
                    data.observers.forEach(obs => obs.disconnect());
                    document.removeEventListener("mousemove", data.listeners[0]);
                    document.removeEventListener("mouseup", data.listeners[1]);
                    el.removeEventListener("scroll", updateScrollbar);

                    if (data.wrapper && data.wrapper.parentNode) {
                        data.wrapper.parentNode.insertBefore(el, data.wrapper);
                        data.wrapper.parentNode.removeChild(data.wrapper);
                    }

                    el.classList.remove("ats-scroll-content");
                }
            });

            wrappedElementsSet.clear();

            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }
    };
};

export default ATscroll;