// Hamburger Menu Functionality

// Logout function
function logout() {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Show logout confirmation
    if (window.toast) {
        window.toast.success('Logged out successfully!');
    }
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    // Query menu items dynamically so newly-injected items are handled
    function getMobileMenuItems() { return mobileMenu ? mobileMenu.querySelectorAll('.mobile-menu-item') : []; }

    // Toggle menu function
    function toggleMenu() {
        const isActive = mobileMenu.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Open menu function
    function openMenu() {
        // Repair menu and attach handlers before showing
        ensureMenuIntegrity();
        attachMenuItemHandlers();
        setActiveMenuItem();
        hamburgerBtn.classList.add('active');
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Close menu function
    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Event listeners
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMenu);
    }


    // Attach click handlers to current menu items (call after injection)
    function attachMenuItemHandlers() {
        const items = getMobileMenuItems();
        items.forEach(item => {
            // avoid attaching duplicate handlers
            if (item.__menuHandlerAttached) return;
            const handler = function(e) {
                e.preventDefault();
                const targetPage = this.getAttribute('data-page');
                closeMenu();
                if (targetPage) {
                    setTimeout(() => { window.location.href = targetPage; }, 300);
                }
            };
            item.addEventListener('click', handler);
            item.__menuHandlerAttached = true;
        });
    }

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Set active menu item based on current page
    function setActiveMenuItem() {
        const currentPage = window.location.pathname;
        const items = getMobileMenuItems();
        items.forEach(item => {
            item.classList.remove('active');
            const itemPage = item.getAttribute('data-page');
            if (!itemPage) return;
            if (currentPage.includes(itemPage) ||
                (currentPage === '/' && itemPage === 'index.html') ||
                (currentPage === '/index.html' && itemPage === 'index.html')) {
                item.classList.add('active');
            }
        });
    }

    // If the mobile menu is empty, populate it with standard links to keep menu behavior consistent across pages
    function populateDefaultMenuIfEmpty() {
        if (!mobileMenu) return;
        if (mobileMenu.children.length > 0) return; // already populated by page

        const items = [
            { href: 'index.html', text: '📋 Job Postings', page: 'index.html' },
            { href: 'resumes.html', text: '📄 Resumes', page: 'resumes.html' },
            { href: 'calendar.html', text: '📅 Calendar', page: 'calendar.html' },
            { href: 'ai.html', text: '🤖 AI Assistant', page: 'ai.html' },
            { href: 'settings.html', text: '⚙️ Settings', page: 'settings.html' }
        ];

        items.forEach(it => {
            const a = document.createElement('a');
            a.href = it.href;
            a.className = 'mobile-menu-item';
            a.setAttribute('data-page', it.page);
            a.textContent = it.text;
            // handler will be attached later via attachMenuItemHandlers
            mobileMenu.appendChild(a);
        });

        // Add logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'mobile-menu-item logout-btn';
        logoutBtn.setAttribute('data-translate', 'nav.logout');
        logoutBtn.textContent = '🚪 Logout';
        logoutBtn.style.background = '#ef4444';
        logoutBtn.style.color = 'white';
        logoutBtn.style.border = 'none';
        logoutBtn.style.padding = '12px 16px';
        logoutBtn.style.margin = '8px 0';
        logoutBtn.style.borderRadius = '8px';
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.width = '100%';
        logoutBtn.style.fontSize = '14px';
        logoutBtn.style.fontWeight = '500';
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeMenu();
            logout();
        });
        mobileMenu.appendChild(logoutBtn);
    }

    // Ensure menu integrity: if any standard items were removed, restore them
    const standardMenuItems = [
        { href: 'index.html', text: '📋 Job Postings', page: 'index.html' },
        { href: 'resumes.html', text: '📄 Resumes', page: 'resumes.html' },
        { href: 'calendar.html', text: '📅 Calendar', page: 'calendar.html' },
        { href: 'ai.html', text: '🤖 AI Assistant', page: 'ai.html' },
        { href: 'settings.html', text: '⚙️ Settings', page: 'settings.html' }
    ];

    function ensureMenuIntegrity() {
        if (!mobileMenu) return;
        // for each standard item, ensure an element with the same data-page exists
        standardMenuItems.forEach(it => {
            const selector = `.mobile-menu-item[data-page="${it.page}"]`;
            if (!mobileMenu.querySelector(selector)) {
                const a = document.createElement('a');
                a.href = it.href;
                a.className = 'mobile-menu-item';
                a.setAttribute('data-page', it.page);
                a.textContent = it.text;
                mobileMenu.appendChild(a);
            }
        });
        
        // Ensure logout button exists
        if (!mobileMenu.querySelector('.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'mobile-menu-item logout-btn';
            logoutBtn.setAttribute('data-translate', 'nav.logout');
            logoutBtn.textContent = '🚪 Logout';
            logoutBtn.style.background = '#ef4444';
            logoutBtn.style.color = 'white';
            logoutBtn.style.border = 'none';
            logoutBtn.style.padding = '12px 16px';
            logoutBtn.style.margin = '8px 0';
            logoutBtn.style.borderRadius = '8px';
            logoutBtn.style.cursor = 'pointer';
            logoutBtn.style.width = '100%';
            logoutBtn.style.fontSize = '14px';
            logoutBtn.style.fontWeight = '500';
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeMenu();
                logout();
            });
            mobileMenu.appendChild(logoutBtn);
        }
        
        // Re-attach handlers to any newly-added items
        attachMenuItemHandlers();
        // Update active state
        setActiveMenuItem();
    }

    // Watch the mobileMenu for removals and restore if necessary
    if (mobileMenu) {
        try {
            const mo = new MutationObserver(mutations => {
                let needsRepair = false;
                for (const m of mutations) {
                    if (m.type === 'childList' && (m.removedNodes.length > 0)) {
                        needsRepair = true;
                        break;
                    }
                }
                if (needsRepair) {
                    // small debounce
                    setTimeout(() => { ensureMenuIntegrity(); }, 30);
                }
            });
            mo.observe(mobileMenu, { childList: true, subtree: false });
        } catch (e) {
            // MutationObserver might not be available in very old browsers; ignore
        }
    }

    // Apply saved settings globally so pages reflect user's choices (theme, font size, high-contrast)
    function applySavedSettings() {
        try {
            const s = JSON.parse(localStorage.getItem('appSettings') || '{}');
            if (s.theme === 'dark') {
                document.body.classList.add('dark-theme');
                // also add to html element so wide/full-bleed selectors match
                try { document.documentElement.classList.add('dark-theme'); } catch(_) {}
            } else {
                document.body.classList.remove('dark-theme');
                try { document.documentElement.classList.remove('dark-theme'); } catch(_) {}
            }
            if (s.fontSize) {
                document.documentElement.style.fontSize = (s.fontSize || 16) + 'px';
                document.body.style.fontSize = (s.fontSize || 16) + 'px';
            }
            if (s.highContrast) {
                document.body.classList.add('high-contrast');
                try { document.documentElement.classList.add('high-contrast'); } catch(_) {}
            } else {
                document.body.classList.remove('high-contrast');
                try { document.documentElement.classList.remove('high-contrast'); } catch(_) {}
            }
            // no i18n: language setting is ignored client-side
        } catch (e) {
            // ignore
        }
    }

    // Set up menu after populating defaults
    populateDefaultMenuIfEmpty();
    attachMenuItemHandlers();
    setActiveMenuItem();
    applySavedSettings();
});
