/**
 * Valentine's Proposal Website Interactions
 * Tech: Pure Vanilla JS
 * UX: Smooth, romantic, premium interactions with soft animations
 */

(function () {
  'use strict';

  // -----------------------------
  // Element references
  // -----------------------------
  const screens = {
    boot: document.getElementById('screen-boot'),
    intro: document.getElementById('screen-intro'),
    question: document.getElementById('screen-question'),
    celebrate: document.getElementById('screen-celebrate'),
    confirm: document.getElementById('screen-confirm'),
  };

  const bgHearts = document.getElementById('bg-hearts');

  const questionTextEl = document.getElementById('question-text');
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const btnProceed = document.getElementById('btn-proceed');
  const arrows = document.querySelector('.arrows');

  const confettiContainer = document.getElementById('confetti-container');
  const sparkleContainer = document.getElementById('sparkle-container');
  const heartBurstContainer = document.getElementById('heart-burst-container');

  const bgMusic = document.getElementById('bg-music');
  const bgMusicSource = document.getElementById('bg-music-source');

  // -----------------------------
  // State
  // -----------------------------
  const originalQuestion = questionTextEl?.dataset?.original || 'Will you be my Valentine?';

  const noMessages = [
    'Are you sure?',
    'Think again 💕',
    'That would break my heart…',
    'Last chance 😢',
  ];

  let noClickCount = 0;
  let typingTimer = null;
  let isTyping = false;
  let celebrationStarted = false;

  // Respect reduced motion preferences
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const HEART_CAP = prefersReducedMotion ? 35 : 70;
  let heartCount = 0;
  let heartIntervalId = null;

  // -----------------------------
  // Utilities
  // -----------------------------
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max));
  }

  // Enhanced button interactions: tilt on hover, ripple and mini-heart burst on click
  function enableButtonInteractions(el) {
    if (!el) return;

    const maxTiltX = prefersReducedMotion ? 6 : 10;
    const maxTiltY = prefersReducedMotion ? 6 : 8;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      const rotX = (-relY) * maxTiltY;
      const rotY = relX * maxTiltX;
      el.style.setProperty('--tilt', `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
    });

    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tilt', 'translateZ(0)');
    });

    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ripple
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.setProperty('--x', `${x}px`);
      ripple.style.setProperty('--y', `${y}px`);
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());

      // Mini hearts
      const count = prefersReducedMotion ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const mh = document.createElement('span');
        mh.className = 'mini-heart';
        mh.textContent = Math.random() > 0.5 ? '💖' : '❤';
        mh.style.setProperty('--x', `${x + randInt(-8, 8)}px`);
        mh.style.setProperty('--y', `${y + randInt(-8, 8)}px`);
        mh.style.setProperty('--rot', `${randInt(-25, 25)}deg`);
        el.appendChild(mh);
        mh.addEventListener('animationend', () => mh.remove());
      }
    }, { passive: true });
  }

  function switchScreen(targetKey) {
    Object.values(screens).forEach((sec) => sec.classList.remove('active'));
    const target = screens[targetKey];
    if (target) {
      // Defer to allow CSS transitions
      setTimeout(() => {
        target.classList.add('active');
        // Focus management for accessibility
        if (targetKey === 'question') {
          btnYes?.focus();
        } else {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }, 16);
    }
  }

  // -----------------------------
  // Background floating hearts
  // -----------------------------
  function createBgHeart() {
    if (!bgHearts) return;

    const heart = document.createElement('div');
    heart.className = 'bg-heart';
    heart.textContent = Math.random() > 0.66 ? '💖' : Math.random() > 0.5 ? '💘' : '❤';

    const duration = prefersReducedMotion ? rand(8, 12) : rand(12, 20);
    const left = rand(0, 100);
    const drift = rand(-80, 80);
    const scale = rand(0.6, 1.6);
    const blur = rand(0, 2.2);

    heart.style.left = `${left}%`;
    heart.style.setProperty('--dur', `${duration}s`);
    heart.style.setProperty('--dx', `${drift}px`);
    heart.style.setProperty('--scale', scale.toFixed(2));
    heart.style.setProperty('--blur', `${blur}px`);
    heart.style.fontSize = `${randInt(20, 36)}px`;

    // Do not remove on animation end; hearts float infinitely and remain
    bgHearts.appendChild(heart);
    heartCount++;
  }

  function startBgHearts() {
    // Initial population
    const initialCount = prefersReducedMotion ? 18 : 40;
    for (let i = 0; i < initialCount; i++) {
      setTimeout(() => {
        if (heartCount < HEART_CAP) createBgHeart();
      }, i * 100);
    }

    // Fill up to cap, then stop creating more to avoid memory growth
    const intervalMs = prefersReducedMotion ? 1400 : 800;
    heartIntervalId = setInterval(() => {
      if (heartCount >= HEART_CAP) {
        clearInterval(heartIntervalId);
        heartIntervalId = null;
        return;
      }
      createBgHeart();
    }, intervalMs);
  }

  // -----------------------------
  // Typewriter effect
  // -----------------------------
  function typeText(el, text, speed = 55) {
    if (!el) return;

    // Cancel previous typing
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    isTyping = true;
    el.textContent = '';

    // Faster typing for reduced motion
    const stepDelay = prefersReducedMotion ? 15 : speed;
    const chars = Array.from(text); // Handles emojis properly

    let index = 0;
    typingTimer = setInterval(() => {
      el.textContent += chars[index];
      index++;
      if (index >= chars.length) {
        clearInterval(typingTimer);
        typingTimer = null;
        isTyping = false;
      }
    }, stepDelay);
  }

  // -----------------------------
  // Question logic (Yes / No)
  // -----------------------------
  function handleNoClick() {
    if (isTyping) {
      // Cancel current typing to switch immediately
      clearInterval(typingTimer);
      typingTimer = null;
      isTyping = false;
    }

    // Show rotating messages, then reset to original and highlight Yes
    if (noClickCount < noMessages.length) {
      typeText(questionTextEl, noMessages[noClickCount]);
      noClickCount++;
      // Hide any arrows and glow if present while rotating messages
      arrows?.classList.remove('show');
      btnYes?.classList.remove('neon');
    } else {
      // After final message, reset question, show arrows pointing to Yes, and glow the Yes button
      noClickCount = 0;
      typeText(questionTextEl, originalQuestion);
      arrows?.classList.add('show');
      btnYes?.classList.add('neon');

      // Optionally nudge Yes visually (brief bounce)
      btnYes?.animate(
        [
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-6px) scale(1.06)' },
          { transform: 'translateY(0) scale(1)' },
        ],
        { duration: 600, easing: 'ease' }
      );
    }
  }

  function handleYesClick() {
    if (celebrationStarted) return;
    celebrationStarted = true;

    // Transition to celebration screen
    switchScreen('celebrate');

    // Start effects
    startCelebrationEffects();

    // Unmute and play background music if available
    try {
      if (bgMusic && bgMusic.readyState >= 2) {
        bgMusic.muted = false;
        bgMusic.volume = 0.6;
        bgMusic
          .play()
          .catch(() => {
            // In case of a browser policy block, keep muted silently
          });
      }
    } catch (e) {
      /* noop */
    }
  }

  // -----------------------------
  // Celebration Effects
  // -----------------------------
  function createConfettiPiece() {
    if (!confettiContainer) return;
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const colors = ['#ff8fab', '#ff4d6d', '#ffc2d1', '#ffd6e0', '#ffe5ec', '#ffffff'];
    const w = randInt(6, 12);
    const h = randInt(10, 18);
    const x = `${rand(2, 98)}%`;
    const dur = `${rand(3.2, 5.2)}s`;
    const spin = `${randInt(800, 1600)}ms`;
    const color = colors[randInt(0, colors.length)];

    piece.style.setProperty('--w', `${w}px`);
    piece.style.setProperty('--h', `${h}px`);
    piece.style.setProperty('--x', x);
    piece.style.setProperty('--dur', dur);
    piece.style.setProperty('--spin', spin);
    piece.style.setProperty('--c', color);
    piece.style.opacity = '0.95';

    piece.addEventListener('animationend', () => piece.remove());

    confettiContainer.appendChild(piece);
  }

  function startConfetti() {
    // Initial burst
    const burstCount = prefersReducedMotion ? 60 : 140;
    for (let i = 0; i < burstCount; i++) {
      setTimeout(createConfettiPiece, i * (prefersReducedMotion ? 12 : 8));
    }
    // Continuous drizzle for a short duration
    const drizzleInterval = setInterval(() => createConfettiPiece(), prefersReducedMotion ? 180 : 120);
    setTimeout(() => clearInterval(drizzleInterval), prefersReducedMotion ? 6000 : 9000);
  }

  function createSparkle() {
    if (!sparkleContainer) return;
    const el = document.createElement('div');
    el.className = 'sparkle';

    const size = randInt(6, 14);
    const x = `${rand(0, 100)}%`;
    const y = `${rand(0, 100)}%`;
    const dur = `${rand(1200, 2200)}ms`;

    el.style.setProperty('--s', `${size}px`);
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--dur', dur);

    el.addEventListener('animationend', () => el.remove());
    sparkleContainer.appendChild(el);
  }

  function startSparkles() {
    // Gentle twinkles across the area
    const initial = prefersReducedMotion ? 18 : 30;
    for (let i = 0; i < initial; i++) {
      setTimeout(createSparkle, i * 80);
    }
    const interval = setInterval(createSparkle, prefersReducedMotion ? 220 : 160);
    setTimeout(() => clearInterval(interval), prefersReducedMotion ? 6000 : 9000);
  }

  function createBurstHeart() {
    if (!heartBurstContainer) return;
    const heart = document.createElement('div');
    heart.className = 'burst-heart';
    heart.textContent = Math.random() > 0.5 ? '💖' : '❤';

    const x = `${rand(8, 92)}%`;
    const y = `${rand(68, 88)}%`;
    const size = `${randInt(18, 34)}px`;

    heart.style.setProperty('--x', x);
    heart.style.setProperty('--y', y);
    heart.style.setProperty('--size', size);

    heart.addEventListener('animationend', () => heart.remove());
    heartBurstContainer.appendChild(heart);
  }

  function startHeartBursts() {
    const burst = prefersReducedMotion ? 20 : 38;
    for (let i = 0; i < burst; i++) {
      setTimeout(createBurstHeart, i * (prefersReducedMotion ? 120 : 90));
    }
    // A few extra
    const extraInterval = setInterval(createBurstHeart, prefersReducedMotion ? 260 : 180);
    setTimeout(() => clearInterval(extraInterval), prefersReducedMotion ? 5000 : 8000);
  }

  function startCelebrationEffects() {
    startConfetti();
    startSparkles();
    startHeartBursts();
  }

  // -----------------------------
  // Audio setup (load on first user interaction)
  // -----------------------------
  function primeAudioOnFirstInteraction() {
    const applySourceAndLoad = () => {
      if (!bgMusic || !bgMusicSource) return;
      const dataSrc = bgMusicSource.getAttribute('data-src');
      if (dataSrc && !bgMusicSource.src) {
        bgMusicSource.src = dataSrc;
        try {
          bgMusic.load();
        } catch (e) {
          /* noop */
        }
      }
      window.removeEventListener('click', applySourceAndLoad);
      window.removeEventListener('keydown', applySourceAndLoad);
      // keep muted; we unmute on "Yes"
    };

    window.addEventListener('click', applySourceAndLoad, { once: true, passive: true });
    window.addEventListener('keydown', applySourceAndLoad, { once: true });
  }

  // -----------------------------
  // Boot Screen
  // -----------------------------
  function setupBootScreen() {
    if (!screens.boot) return;
    
    // Auto-transition from boot to intro after 3.5 seconds
    setTimeout(() => {
      switchScreen('intro');
    }, 3500);
  }

  // -----------------------------
  // Navigation & Event Handlers
  // -----------------------------
  function setupIntro() {
    if (!screens.intro) return;
    // Clicking anywhere on the intro screen proceeds to the question
    screens.intro.addEventListener('click', () => {
      switchScreen('question');
      // Begin with typewriter question
      typeText(questionTextEl, originalQuestion);
    });
  }

  function setupQuestion() {
    if (!btnNo || !btnYes) return;

    // Enhanced interactions
    enableButtonInteractions(btnNo);
    enableButtonInteractions(btnYes);

    btnNo.addEventListener('click', handleNoClick);
    btnYes.addEventListener('click', handleYesClick);
  }

  function setupCelebration() {
    if (!btnProceed) return;

    // Enhanced interactions for proceed button
    enableButtonInteractions(btnProceed);

    btnProceed.addEventListener('click', () => {
      switchScreen('confirm');
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  function init() {
    // Start subtle floating hearts in the background
    startBgHearts();

    // Prime audio load on first interaction (kept muted until "Yes")
    primeAudioOnFirstInteraction();

    // Setup screens
    setupBootScreen();
    setupIntro();
    setupQuestion();
    setupCelebration();

    // Ensure the boot screen is active initially
    switchScreen('boot');
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
