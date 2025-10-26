"use strict";

// ------------------------------
// Function Declarations
// ------------------------------

// Navbar blur on scroll
function navbarBlurOnScroll(id) {
    const navbar = document.getElementById(id);
    if (!navbar) return;

    let navbarScrollActive = navbar.getAttribute("data-scroll") === "true";
    let scrollDistance = 5;
    let classes = ["blur", "shadow-blur", "left-auto"];
    let toggleClasses = ["shadow-none"];

    function blurNavbar() {
        navbar.classList.add(...classes);
        navbar.classList.remove(...toggleClasses);
    }

    function transparentNavbar() {
        navbar.classList.remove(...classes);
        navbar.classList.add(...toggleClasses);
    }

    function handleScroll() {
        if (window.scrollY > scrollDistance) {
            blurNavbar();
        } else {
            transparentNavbar();
        }
    }

    window.addEventListener("scroll", debounce(handleScroll, 10));

    // For PerfectScrollbar on Windows
    const isWindows = navigator.platform.indexOf("Win") > -1;
    if (isWindows) {
        const content = document.querySelector(".main-content");
        if (content) {
            content.addEventListener(
                "ps-scroll-y",
                debounce(function () {
                    if (navbarScrollActive) {
                        if (content.scrollTop > scrollDistance) {
                            blurNavbar();
                        } else {
                            transparentNavbar();
                        }
                    } else {
                        transparentNavbar();
                    }
                }, 10)
            );
        }
    }
}

// Tabs navigation
function initNavs() {
    const total = document.querySelectorAll(".nav-pills");
    total.forEach(function (item) {
        const moving_div = document.createElement("div");
        const first_li = item.querySelector("li:first-child .nav-link");
        const tab = first_li.cloneNode();
        tab.innerHTML = "-";

        moving_div.classList.add("moving-tab", "position-absolute", "nav-link");
        moving_div.appendChild(tab);
        item.appendChild(moving_div);

        moving_div.style.padding = "0px";
        moving_div.style.width = item.querySelector("li:nth-child(1)").offsetWidth + "px";
        moving_div.style.transform = "translate3d(0px, 0px, 0px)";
        moving_div.style.transition = ".5s ease";

        item.onmouseover = function (event) {
            const target = event.target.closest("li");
            if (!target) return;

            const nodes = Array.from(target.closest("ul").children);
            const index = nodes.indexOf(target) + 1;

            target.querySelector(".nav-link").onclick = function () {
                const movingTab = item.querySelector(".moving-tab");
                let sum = 0;

                if (item.classList.contains("flex-column")) {
                    for (let j = 1; j <= nodes.indexOf(target); j++) {
                        sum += item.querySelector(`li:nth-child(${j})`).offsetHeight;
                    }
                    movingTab.style.transform = `translate3d(0px, ${sum}px, 0px)`;
                    movingTab.style.height = item.querySelector(`li:nth-child(${index})`).offsetHeight + "px";
                } else {
                    for (let j = 1; j <= nodes.indexOf(target); j++) {
                        sum += item.querySelector(`li:nth-child(${j})`).offsetWidth;
                    }
                    movingTab.style.transform = `translate3d(${sum}px, 0px, 0px)`;
                    movingTab.style.width = item.querySelector(`li:nth-child(${index})`).offsetWidth + "px";
                }
            };
        };
    });
}

// Debounce Function
function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        const context = this,
            args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Dark mode initialization
function initDarkMode() {
    const darkToggle = document.getElementById("dark-version");
    if (!darkToggle) return;

    const darkModeEnabled = localStorage.getItem("darkMode") === "true";
    if (darkModeEnabled) {
        darkToggle.checked = true;
        darkMode(darkToggle);
    }

    darkToggle.addEventListener("click", function () {
        localStorage.setItem("darkMode", this.checked);
        darkMode(this);
    });
}

// ------------------------------
// DOMContentLoaded
// ------------------------------

document.addEventListener("DOMContentLoaded", function () {
    // PerfectScrollbar
    const isWindows = navigator.platform.indexOf("Win") > -1;
    if (isWindows) {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) new PerfectScrollbar(mainContent);

        const sidebar = document.querySelector(".sidenav");
        if (sidebar) new PerfectScrollbar(sidebar);

        const navbarCollapse = document.querySelector(".navbar-collapse");
        if (navbarCollapse) new PerfectScrollbar(navbarCollapse);

        const fixedPlugin = document.querySelector(".fixed-plugin");
        if (fixedPlugin) new PerfectScrollbar(fixedPlugin);
    }

    // Navbar blur
    if (document.getElementById("navbarBlur")) {
        navbarBlurOnScroll("navbarBlur");
    }

    // Tabs navigation
    if (document.querySelectorAll(".nav-pills").length) {
        initNavs();
    }

    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

    // Toasts
    const toastElList = [].slice.call(document.querySelectorAll(".toast"));
    toastElList.map(el => new bootstrap.Toast(el));

    initDarkMode();
});
