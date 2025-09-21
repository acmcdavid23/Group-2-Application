// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');

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

    // Handle menu item clicks
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            
            // Close menu first
            closeMenu();
            
            // Navigate to the target page
            if (targetPage) {
                setTimeout(() => {
                    window.location.href = targetPage;
                }, 300); // Wait for menu close animation
            }
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Set active menu item based on current page
    function setActiveMenuItem() {
        const currentPage = window.location.pathname;
        mobileMenuItems.forEach(item => {
            item.classList.remove('active');
            const itemPage = item.getAttribute('data-page');
            
            if (currentPage.includes(itemPage) || 
                (currentPage === '/' && itemPage === 'index.html') ||
                (currentPage === '/index.html' && itemPage === 'index.html')) {
                item.classList.add('active');
            }
        });
    }

    // Set active menu item on page load
    setActiveMenuItem();
});
