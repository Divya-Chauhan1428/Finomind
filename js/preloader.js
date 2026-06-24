/* ═══════════════════════════════════════════════════════════
   FinoMind — Preloader (preloader.js)
   Canvas-based frame-sequence preloader. Plays once per session.
   Fully responsive: cover-scales across mobile, tablet, laptop, desktop.
   Uses devicePixelRatio for crisp HiDPI / Retina rendering.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Config ── */
  const PRELOADER_KEY  = 'finomind_preloader_seen';
  const FRAME_DIR      = 'ezgif-814ed8a15dbbd723-jpg';
  const TOTAL_FRAMES   = 240;
  const FRAME_STEP     = 2;   // play every 2nd frame → 120 frames @ 24 fps
  const FPS            = 24;
  /* Native resolution of the source frames */
  const SRC_W          = 1920;
  const SRC_H          = 1080;

  /* ── DOM references ── */
  const preloader = document.getElementById('fm-preloader');
  const canvas    = document.getElementById('fm-preloader-canvas');

  /* ── Skip if already seen this session ── */
  if (sessionStorage.getItem(PRELOADER_KEY)) {
    if (preloader) preloader.remove();
    document.body.classList.remove('fm-preloader-active');
    return;
  }

  /* ── Guard ── */
  if (!canvas || !preloader) return;

  document.body.classList.add('fm-preloader-active');

  const ctx = canvas.getContext('2d');

  /* ──────────────────────────────────────────────────────────
     RESPONSIVE CANVAS SIZING
     Sets the canvas *pixel buffer* to match the physical viewport
     pixels (accounting for devicePixelRatio for HiDPI sharpness).
     The CSS keeps the canvas element at width/height 100% of the
     overlay, so the element size is always correct — we only need
     to match the buffer.
  ────────────────────────────────────────────────────────── */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w   = window.innerWidth;
    const h   = window.innerHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    /* Scale the context once so all draw calls use CSS-pixel coordinates */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ──────────────────────────────────────────────────────────
     COVER-SCALE DRAW
     Replicates `object-fit: cover` for canvas:
       • Scale the source image so it fills the canvas completely
         (no letter-boxing / pillar-boxing)
       • Keep the source aspect ratio
       • Centre the crop within the viewport
  ────────────────────────────────────────────────────────── */
  function drawCover(img) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scale = Math.max(vw / SRC_W, vh / SRC_H);

    const scaledW = SRC_W * scale;
    const scaledH = SRC_H * scale;

    /* Offset to centre the scaled image */
    const offsetX = (vw - scaledW) / 2;
    const offsetY = (vh - scaledH) / 2;

    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
  }

  /* ── Initial sizing ── */
  resizeCanvas();

  /* ── Resize listener (orientation change / window resize) ── */
  let resizeTimer = null;
  window.addEventListener('resize', function () {
    /* Debounce to avoid thrashing on rapid resize events */
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 50);
  });

  /* ── Build frame list ── */
  const frameIndices = [];
  for (let i = 1; i <= TOTAL_FRAMES; i += FRAME_STEP) {
    frameIndices.push(i);
  }
  const totalPlayFrames = frameIndices.length;
  const images = new Array(totalPlayFrames);

  let loadedCount     = 0;
  let hasStartedPlaying = false;
  let isFinished      = false;
  let pageLoaded      = false;

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  /* ── Preload frames progressively ── */
  frameIndices.forEach(function (frameNum, index) {
    const img = new Image();
    img.onload = function () {
      images[index] = img;
      loadedCount++;
      if (loadedCount >= Math.min(15, totalPlayFrames) && !hasStartedPlaying) {
        hasStartedPlaying = true;
        startAnimation();
      }
    };
    img.onerror = function () {
      loadedCount++;
      if (loadedCount >= Math.min(15, totalPlayFrames) && !hasStartedPlaying) {
        hasStartedPlaying = true;
        startAnimation();
      }
    };
    img.src = FRAME_DIR + '/ezgif-frame-' + pad(frameNum) + '.jpg';
  });

  /* ── Track page-load state ── */
  window.addEventListener('load', function () {
    pageLoaded = true;
  });

  /* Safety fallback: treat page as loaded after 5 s */
  setTimeout(function () {
    pageLoaded = true;
  }, 5000);

  /* ── Animation loop ── */
  function startAnimation() {
    let currentFrame = 0;
    const interval  = 1000 / FPS;
    let lastTime     = performance.now();

    function draw(now) {
      if (isFinished) return;

      const elapsed = now - lastTime;
      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);

        if (currentFrame >= totalPlayFrames) {
          if (pageLoaded || document.readyState === 'complete') {
            finishPreloader();
            return;
          } else {
            currentFrame = 0;   /* loop until page ready */
          }
        }

        const img = images[currentFrame];
        if (img) drawCover(img);
        currentFrame++;
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ── Finish & fade-out ── */
  function finishPreloader() {
    if (isFinished) return;
    isFinished = true;

    sessionStorage.setItem(PRELOADER_KEY, 'true');

    preloader.classList.add('hidden');
    document.body.classList.remove('fm-preloader-active');

    /* Remove from DOM after CSS opacity transition completes */
    setTimeout(function () {
      preloader.remove();
    }, 650);
  }

})();
