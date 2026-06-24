/* ═══════════════════════════════════════════════════════════
   FinoMind — Animations (animations.js)
   IntersectionObserver scroll reveals + count-up counters
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Scroll Reveal ──
  function initReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ── Count-Up Animation ──
  function initCountUp() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute('data-count');
      });
      return;
    }

    // Only run counters on elements that are inside the stats bar.
    // (Prevents any accidental count animation on other pages.)
    var statsRoot = document.querySelector('.stats-bar');
    if (!statsRoot) return;

    var counterEls = Array.prototype.filter.call(counters, function (el) {
      return statsRoot.contains(el);
    });

    if (!counterEls.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    counterEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  function animateCounter(el) {
    var target = el.getAttribute('data-count');
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 2000;
    var startTime = null;

    // Parse numeric value (handle decimals like 2.4)
    var isDecimal = target.indexOf('.') !== -1;
    var targetNum = parseFloat(target);

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easeOutQuart(progress);
      var currentVal = easedProgress * targetNum;

      if (isDecimal) {
        el.textContent = prefix + currentVal.toFixed(1) + suffix;
      } else {
        el.textContent = prefix + Math.floor(currentVal) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // ── Smooth Parallax on Hero Floating Cards ──
  function initFloatingParallax() {
    var floatingCards = document.querySelectorAll('.floating-card');
    if (!floatingCards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      if (scrollY > 800) return; // Only active in hero area

      floatingCards.forEach(function (card, index) {
        var speed = 0.02 + index * 0.01;
        var yOffset = scrollY * speed;
        card.style.transform = 'translateY(' + (-yOffset) + 'px)';
      });
    }, { passive: true });
  }

  // ── Initialize All ──
  function init() {
    // Wait a tick so DOM is fully parsed
    requestAnimationFrame(function () {
      initReveal();
      initCountUp();
      initFloatingParallax();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
