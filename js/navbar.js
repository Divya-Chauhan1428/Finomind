/* ═══════════════════════════════════════════════════════════
   FinoMind — Navbar (navbar.js)
   Mobile hamburger toggle, scroll-based styling, active link
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // If loaded with defer, DOM is already parsed; guard anyway.
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!navbar) return;

  // ── Scroll Effect ──
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // ── Mobile Menu Toggle ──
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const isOpen = links.classList.contains('open');

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  function openMenu() {
    if (links) links.classList.add('open');
    if (toggle) toggle.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (links) links.classList.remove('open');
    if (toggle) toggle.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Close menu when clicking overlay
  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close menu when clicking a nav link
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 968) {
        closeMenu();
      }
    });
  });

  // Close menu on escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // Close menu on resize past breakpoint
  window.addEventListener('resize', function () {
    if (window.innerWidth > 968) {
      closeMenu();
    }
  });

  // ── Active Link Highlighting ──
  // Highlight nav link based on current page
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;

    var linkPage = href.split('/').pop();

    if (linkPage === currentPage ||
      (currentPage === 'index.html' && (linkPage === '' || linkPage === 'index.html'))) {
      // Don't mark any link as active on the homepage (all sections are on one page)
    }

    if (linkPage === currentPage && currentPage === 'services.html') {
      link.classList.add('active');
    }
  });
})();
