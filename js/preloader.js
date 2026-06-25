/* ═══════════════════════════════════════════════════════════
   FinoMind — Preloader  v3.0  (preloader.js)
   Canvas frame-sequence animation — fully responsive.

   HOW RESPONSIVENESS WORKS
   ─────────────────────────
   Canvas has two separate "sizes":
     1. CSS / layout size  → controlled by CSS (width:100%, height:100%)
     2. Pixel buffer size  → controlled by canvas.width / canvas.height

   If (1) ≠ (2) the browser will stretch the buffer to fit the layout,
   causing blurry or distorted output.

   We fix this by:
     a) resizeCanvas() — sets the pixel buffer = viewport × devicePixelRatio
        so the buffer always matches the physical screen pixels exactly.
     b) ctx.setTransform(dpr,0,0,dpr,0,0) — scales the drawing context so
        ALL draw calls can be expressed in simple CSS-pixel coordinates
        and the DPR conversion is automatic.
     c) drawCover() — replicates `object-fit: cover` behaviour:
          scale = max(viewportW / sourceW, viewportH / sourceH)
        This guarantees the image always fills the full viewport without
        letter-boxing or pillar-boxing, keeping content centred.
     d) A debounced 'resize' listener updates everything on orientation
        change or window resize.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     CONFIGURATION
  ────────────────────────────────────────────────────────── */
  var PRELOADER_KEY  = 'finomind_preloader_seen';
  var FRAME_DIR      = 'ezgif-814ed8a15dbbd723-jpg';
  var TOTAL_FRAMES   = 240;
  var FRAME_STEP     = 2;      /* use every 2nd frame → 120 frames at 24 fps  */
  var FPS            = 24;
  /* Native pixel dimensions of the source JPEG frames */
  var SRC_W          = 1920;
  var SRC_H          = 1080;

  /* ──────────────────────────────────────────────────────────
     DOM
  ────────────────────────────────────────────────────────── */
  var preloader = document.getElementById('fm-preloader');
  var canvas    = document.getElementById('fm-preloader-canvas');

  /* Skip if already seen this browser session */
  if (sessionStorage.getItem(PRELOADER_KEY)) {
    if (preloader) preloader.remove();
    document.body.classList.remove('fm-preloader-active');
    return;
  }

  if (!canvas || !preloader) return;

  document.body.classList.add('fm-preloader-active');

  var ctx = canvas.getContext('2d');

  /* ──────────────────────────────────────────────────────────
     RESPONSIVE CANVAS SIZING
     Sets the pixel buffer to: viewport-pixels × devicePixelRatio.
     Calling setTransform afterwards normalises the coordinate space
     to CSS pixels so drawCover stays simple on every device.
  ────────────────────────────────────────────────────────── */
  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;

    /* Buffer size = physical screen pixels */
    canvas.width  = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);

    /*
     * Scale the context by DPR so that all subsequent draw calls
     * use CSS-pixel coordinates.  Setting canvas.width resets the
     * transform, so we must call this AFTER the assignment above.
     */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ──────────────────────────────────────────────────────────
     COVER-SCALE DRAW  (replicates `object-fit: cover` for canvas)

     Algorithm:
       scale = max( viewportW / sourceW,  viewportH / sourceH )
     This is the smallest scale that makes the image at least as
     wide AND at least as tall as the viewport, i.e. full coverage.
     The image is then centred — excess is hidden by the overflow:
     hidden on the parent .fm-preloader div.
  ────────────────────────────────────────────────────────── */
  function drawCover(img) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    /* Uniform scale that ensures full viewport coverage */
    var scale   = Math.max(vw / SRC_W, vh / SRC_H);

    var drawW   = SRC_W * scale;
    var drawH   = SRC_H * scale;

    /* Centre the (possibly over-sized) image */
    var offsetX = (vw - drawW) / 2;
    var offsetY = (vh - drawH) / 2;

    /* Clear exactly the CSS-pixel viewport area */
    ctx.clearRect(0, 0, vw, vh);

    /* Draw the frame */
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  /* ── Initial sizing ── */
  resizeCanvas();

  /* ──────────────────────────────────────────────────────────
     RESIZE / ORIENTATION-CHANGE LISTENER
     Debounced: waits 50 ms after the last event fires to avoid
     hammering the canvas on rapid resize drags.
  ────────────────────────────────────────────────────────── */
  var resizeTimer = null;

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 50);
  }

  window.addEventListener('resize', onResize);
  /* orientationchange fires on mobile rotation before resize */
  window.addEventListener('orientationchange', function () {
    /* give the browser ~100 ms to update innerWidth/innerHeight */
    setTimeout(resizeCanvas, 100);
  });

  /* ──────────────────────────────────────────────────────────
     BUILD FRAME LIST
  ────────────────────────────────────────────────────────── */
  var frameIndices = [];
  for (var i = 1; i <= TOTAL_FRAMES; i += FRAME_STEP) {
    frameIndices.push(i);
  }
  var totalPlayFrames = frameIndices.length; /* 120 */
  var images          = new Array(totalPlayFrames);

  var loadedCount       = 0;
  var hasStartedPlaying = false;
  var isFinished        = false;
  var pageLoaded        = false;

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  /* ──────────────────────────────────────────────────────────
     PROGRESSIVE FRAME PRELOAD
     Starts the animation after the first 15 frames are ready so
     the preloader feels instant even on slow connections.
  ────────────────────────────────────────────────────────── */
  frameIndices.forEach(function (frameNum, index) {
    var img  = new Image();
    var done = function () {
      loadedCount++;
      if (loadedCount >= Math.min(15, totalPlayFrames) && !hasStartedPlaying) {
        hasStartedPlaying = true;
        startAnimation();
      }
    };
    img.onload  = function () { images[index] = img; done(); };
    img.onerror = done; /* never block on a missing frame */
    img.src = FRAME_DIR + '/ezgif-frame-' + pad(frameNum) + '.jpg';
  });

  /* ──────────────────────────────────────────────────────────
     PAGE-LOAD TRACKING
  ────────────────────────────────────────────────────────── */
  window.addEventListener('load', function () {
    pageLoaded = true;
  });

  /* Hard fallback: treat page as loaded after 5 seconds */
  setTimeout(function () { pageLoaded = true; }, 5000);

  /* ──────────────────────────────────────────────────────────
     ANIMATION LOOP  (requestAnimationFrame-based, FPS-throttled)
  ────────────────────────────────────────────────────────── */
  function startAnimation() {
    var currentFrame = 0;
    var interval     = 1000 / FPS;   /* ms per frame ≈ 41.67 ms */
    var lastTime     = performance.now();

    function draw(now) {
      if (isFinished) return;

      var elapsed = now - lastTime;

      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);

        /* End of sequence? */
        if (currentFrame >= totalPlayFrames) {
          if (pageLoaded || document.readyState === 'complete') {
            finishPreloader();
            return;
          }
          /* Page not ready yet — loop the animation */
          currentFrame = 0;
        }

        var img = images[currentFrame];
        if (img) drawCover(img);
        currentFrame++;
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  /* ──────────────────────────────────────────────────────────
     FINISH & FADE OUT
  ────────────────────────────────────────────────────────── */
  function finishPreloader() {
    if (isFinished) return;
    isFinished = true;

    sessionStorage.setItem(PRELOADER_KEY, 'true');

    preloader.classList.add('hidden');
    document.body.classList.remove('fm-preloader-active');

    /* Remove from DOM after the CSS opacity transition finishes (650 ms) */
    setTimeout(function () {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 650);
  }

})();
