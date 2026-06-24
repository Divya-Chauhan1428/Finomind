/* ═══════════════════════════════════════════════════════════
   FinoMind — Preloader (preloader.js)
   Canvas-based frame sequence preloader. Plays once per session.
   Seamless infinite loop during load, clean finish-on-complete once loaded.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  console.log('[Preloader] Initialization started.');

  const PRELOADER_KEY = 'finomind_preloader_seen';
  const FRAME_DIR = 'ezgif-814ed8a15dbbd723-jpg';
  const TOTAL_FRAMES = 240;
  const FRAME_STEP = 2; // Play every 2nd frame (120 frames total) for smooth 24fps playback
  const FPS = 24;

  const preloader = document.getElementById('fm-preloader');
  const canvas = document.getElementById('fm-preloader-canvas');

  // Skip preloader if already seen in this session
  if (sessionStorage.getItem(PRELOADER_KEY)) {
    console.log('[Preloader] Already seen in this session. Skipping.');
    if (preloader) {
      preloader.remove();
    }
    document.body.classList.remove('fm-preloader-active');
    return;
  }

  // Prevent scrolling while preloader is active
  document.body.classList.add('fm-preloader-active');

  if (!canvas || !preloader) return;

  const ctx = canvas.getContext('2d');
  
  // Set canvas coordinate system to match source frame size (1920x1080)
  canvas.width = 1920;
  canvas.height = 1080;

  // Build the list of frames to use
  const frameIndices = [];
  for (let i = 1; i <= TOTAL_FRAMES; i += FRAME_STEP) {
    frameIndices.push(i);
  }
  
  const totalPlayFrames = frameIndices.length;
  const images = new Array(totalPlayFrames);
  
  let loadedCount = 0;
  let hasStartedPlaying = false;
  let isFinished = false;
  let pageLoaded = false;

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  // Preload frames progressively
  console.log('[Preloader] Preloading 120 frames...');
  frameIndices.forEach(function (frameNum, index) {
    const img = new Image();
    img.onload = function () {
      images[index] = img;
      loadedCount++;
      // Start animation loop early (buffer of 15 frames) to feel instant
      if (loadedCount >= Math.min(15, totalPlayFrames) && !hasStartedPlaying) {
        hasStartedPlaying = true;
        console.log('[Preloader] Buffer loaded. Starting animation loop.');
        startAnimation();
      }
    };
    img.onerror = function () {
      loadedCount++;
      // Ensure we don't block on load failures
      if (loadedCount >= Math.min(15, totalPlayFrames) && !hasStartedPlaying) {
        hasStartedPlaying = true;
        startAnimation();
      }
    };
    img.src = FRAME_DIR + '/ezgif-frame-' + pad(frameNum) + '.jpg';
  });

  // Track window load state
  window.addEventListener('load', function () {
    console.log('[Preloader] Window load event fired.');
    pageLoaded = true;
  });

  // Safety fallback: if page assets take too long, consider page loaded in 5 seconds
  setTimeout(function () {
    console.log('[Preloader] Safety pageLoaded fallback triggered.');
    pageLoaded = true;
  }, 5000);

  function startAnimation() {
    let currentFrame = 0;
    const interval = 1000 / FPS;
    let lastTime = performance.now();

    function draw(now) {
      if (isFinished) return;

      const elapsed = now - lastTime;
      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);

        // Check if we reached the last frame
        if (currentFrame >= totalPlayFrames) {
          // If page has loaded, finish the preloader. Otherwise loop back to frame 0.
          if (pageLoaded || document.readyState === 'complete') {
            console.log('[Preloader] Playback loop finished and page is ready. Exiting.');
            finishPreloader();
            return;
          } else {
            console.log('[Preloader] Loop finished but page not loaded yet. Looping animation.');
            currentFrame = 0;
          }
        }

        const img = images[currentFrame];
        if (img) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        currentFrame++;
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function finishPreloader() {
    if (isFinished) return;
    isFinished = true;

    sessionStorage.setItem(PRELOADER_KEY, 'true');
    console.log('[Preloader] Fading out.');

    preloader.classList.add('hidden');
    document.body.classList.remove('fm-preloader-active');

    // Remove preloader element from DOM once opacity transition completes (600ms)
    setTimeout(function () {
      console.log('[Preloader] Removing element from DOM.');
      preloader.remove();
    }, 600);
  }
})();
