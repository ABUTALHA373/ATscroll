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
        html, body {
            height: 100% !important;
            overflow: auto !important;
            margin: 0 !important;
        }
        *::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

        .ats-container {
            position: relative !important;
            ${config.autoHide === "leave" ? "overflow: hidden !important;" : ""}
            padding-right: ${config.scrollbarWidth} !important;
        }

        .ats-container:not(body) .ats-scroll-content {
            overflow: auto !important;
            height: 100% !important;
            box-sizing: content-box !important;
            -webkit-overflow-scrolling: touch !important;
        }

        .ats-scrollbar {
            position: fixed !important; /* Use fixed for body */
            top: 2px !important;
            right: 4px !important; /* Adjusted for better visibility */
            width: ${config.scrollbarWidth} !important;
            border-radius: 3px !important;
            transition: opacity 0.15s, height 0.15s, transform 0.15s !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: 9999 !important;
            display: none !important;
            background: ${color.light} !important;
        }

        .ats-container:not(body) .ats-scrollbar {
            position: absolute !important; /* Use absolute for non-body elements */
        }

        .ats-scrollbar.visible {
            display: block !important;
            opacity: ${config.autoHide === "leave" ? "0" : "1"} !important;
            pointer-events: ${config.autoHide === "leave" ? "none" : "auto"} !important;
        }

        ${config.autoHide === "leave" ? `
            .ats-container:hover .ats-scrollbar.visible,
            body.ats-container:hover .ats-scrollbar.visible {
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

        let scrollHeight, clientHeight, scrollTop;

        if (el === document.body) {
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
            scrollTop = window.scrollY || document.documentElement.scrollTop;
        } else {
            scrollHeight = el.scrollHeight;
            clientHeight = el.clientHeight;
            scrollTop = el.scrollTop;
        }

        const scrollable = scrollHeight > clientHeight + 1; // +1px tolerance

        if (scrollable) {
            const ratio = clientHeight / scrollHeight;
            const barHeight = Math.max(data.wrapper.clientHeight * ratio, 20);
            const top = Math.min(
                scrollTop * ratio,
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

    // Set up global event listeners with a 20ms timeout
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

        let wrapper, bar;
        if (el === document.body) {
            // Don't wrap body, use it directly
            wrapper = el;
            wrapper.classList.add("ats-container");

            bar = document.createElement("div");
            bar.classList.add("ats-scrollbar");
            document.body.appendChild(bar);
        } else {
            wrapper = document.createElement("div");
            wrapper.classList.add("ats-container");
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);

            el.classList.add("ats-scroll-content");
            bar = document.createElement("div");
            bar.classList.add("ats-scrollbar");
            wrapper.appendChild(bar);
        }

        let isDragging = false, startY, startScrollTop;

        // Drag handling
        bar.addEventListener("mousedown", (e) => {
            isDragging = true;
            startY = e.clientY;
            startScrollTop = el === document.body ? window.scrollY : el.scrollTop;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const dy = e.clientY - startY;
            const scrollRatio = (el === document.body ? document.documentElement.scrollHeight / window.innerHeight : el.scrollHeight / el.clientHeight);
            if (el === document.body) {
                window.scrollTo(0, startScrollTop + dy * scrollRatio);
            } else {
                el.scrollTop = startScrollTop + dy * scrollRatio;
            }
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
        if (el !== document.body) {
            resizeObserver.observe(wrapper);
        }

        // Watch for scroll events
        const scrollHandler = () => {
            void el.offsetHeight; // Force layout
            updateScrollbar(el);
        };
        if (el === document.body) {
            window.addEventListener("scroll", scrollHandler, { passive: true });
        } else {
            el.addEventListener("scroll", scrollHandler, { passive: true });
        }

        // Store element references
        const elementData = {
            wrapper,
            bar,
            observers: [resizeObserver],
            listeners: [handleMouseMove, handleMouseUp, scrollHandler]
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

        function checkAndWrapBody() {
            if (document.documentElement.scrollHeight > window.innerHeight) {
                wrapElement(document.body);
                void document.body.offsetHeight; // Force layout
                updateScrollbar(document.body);
            }
        }

        // Process existing elements
        document.querySelectorAll(scrollableSelectors).forEach(el => {
            if (el === document.body) {
                checkAndWrapBody();
            } else {
                const style = window.getComputedStyle(el);
                if (style.overflowY === "auto" || style.overflowY === "scroll") {
                    wrapElement(el);
                    void el.offsetHeight;
                    updateScrollbar(el);
                }
            }
        });

        // Watch for new elements and body scrollability changes
        const elementObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const elements = Array.from(node.querySelectorAll(scrollableSelectors))
                            .concat(node.matches(scrollableSelectors) ? [node] : []);

                        elements.forEach(el => {
                            if (el === document.body) {
                                checkAndWrapBody();
                            } else {
                                const style = window.getComputedStyle(el);
                                if (style.overflowY === "auto" || style.overflowY === "scroll") {
                                    wrapElement(el);
                                    void el.offsetHeight;
                                    updateScrollbar(el);
                                }
                            }
                        });
                    }
                });
                // Recheck body scrollability on any mutation
                checkAndWrapBody();
            });
        });

        elementObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Watch for window resize or dynamic content changes
        window.addEventListener("resize", () => {
            checkAndWrapBody();
        }, { passive: true });

        // Periodically check body scrollability for dynamic content
        setInterval(checkAndWrapBody, 500); // Adjust interval as needed
    }

    // Initialize when ready
    if (document.readyState === "complete") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }

    // Return cleanup and update API
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
                    if (el === document.body) {
                        window.removeEventListener("scroll", data.listeners[2]);
                    } else {
                        el.removeEventListener("scroll", data.listeners[2]);
                    }

                    if (el === document.body) {
                        if (data.bar && data.bar.parentNode) {
                            data.bar.parentNode.removeChild(data.bar);
                        }
                        el.classList.remove("ats-container");
                    } else {
                        if (data.wrapper && data.wrapper.parentNode) {
                            data.wrapper.parentNode.insertBefore(el, data.wrapper);
                            data.wrapper.parentNode.removeChild(data.wrapper);
                        }
                        el.classList.remove("ats-scroll-content");
                    }
                }
            });

            wrappedElementsSet.clear();

            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        },
        update: () => {
            wrappedElementsSet.forEach(el => {
                void el.offsetHeight;
                updateScrollbar(el);
            });
        }
    };
};

export default ATscroll;