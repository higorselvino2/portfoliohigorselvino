(() => {
  const body = document.body;
  const projectFiles = new Set([
    'baly-energy-drink.html',
    'beyond-the-sky.html',
    'cacau-parque.html',
    'doaleite.html',
    'matcha-mojo.html',
    'revision-room.html',
    'songbird.html',
    'web-design-coffee-shops.html'
  ]);
  const currentFile = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  if (projectFiles.has(currentFile) && !window.location.hash) {
    const resetProjectScroll = () => {
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      window.requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
    };
    resetProjectScroll();
    window.addEventListener('pageshow', resetProjectScroll);
    window.addEventListener('load', resetProjectScroll, { once: true });
  }

  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    const closeMenu = () => {
      mobileNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'Menu';
      body.classList.remove('menu-open');
    };
    menuButton.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'Close' : 'Menu';
      body.classList.toggle('menu-open', open);
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  }

  const sunflowerTriggers = [...document.querySelectorAll('[data-sunflower-trigger]')];
  if (sunflowerTriggers.length) {
    const surpriseSprites = {
      sunflower: {
        src: 'assets/images/ui/easteregg-sunflower.png',
        className: 'is-sunflower',
        minSize: 34,
        sizeRange: 48
      },
      camera: {
        src: 'assets/images/ui/easteregg-camera.png',
        className: 'is-camera',
        minSize: 58,
        sizeRange: 56
      },
      rodriguez: {
        src: 'assets/images/ui/easteregg-rodriguez.webp',
        className: 'is-rodriguez',
        minSize: 48,
        sizeRange: 44
      }
    };
    const spritePools = {
      1: ['sunflower'],
      2: ['sunflower', 'sunflower', 'sunflower', 'camera'],
      3: ['sunflower', 'sunflower', 'sunflower', 'camera', 'camera', 'rodriguez']
    };
    const triggerLevels = new WeakMap();
    const rapidClickHistory = new WeakMap();
    const holdDuration = 1700;
    const rapidClickWindow = 2600;
    let activePlayground = null;

    const bloom = (trigger, level) => {
      document.querySelector('.portfolio-confetti-layer')?.remove();
      const layer = document.createElement('div');
      layer.className = 'portfolio-confetti-layer';
      layer.dataset.surpriseLevel = String(level);
      layer.setAttribute('aria-hidden', 'true');

      const triggerRect = trigger.getBoundingClientRect();
      const originX = triggerRect.left + (triggerRect.width / 2);
      const originY = triggerRect.top + (triggerRect.height / 2);
      const total = window.innerWidth < 760 ? 30 : 52;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const pool = spritePools[level];

      for (let index = 0; index < total; index += 1) {
        const sprite = document.createElement('img');
        const spriteType = pool[index % pool.length];
        const spriteConfig = surpriseSprites[spriteType];
        const angle = (-Math.PI * .95) + (Math.random() * Math.PI * .9);
        const distance = Math.max(window.innerWidth, window.innerHeight) * (.25 + Math.random() * .75);
        const burstX = Math.cos(angle) * distance;
        const burstY = Math.sin(angle) * distance;

        sprite.className = `portfolio-confetti ${spriteConfig.className}${reduceMotion ? ' is-reduced' : ''}`;
        sprite.src = spriteConfig.src;
        sprite.alt = '';
        sprite.decoding = 'async';
        sprite.style.left = reduceMotion ? `${5 + Math.random() * 90}%` : `${originX}px`;
        sprite.style.top = reduceMotion ? `${8 + Math.random() * 78}%` : `${originY}px`;
        sprite.style.setProperty('--burst-x', `${burstX}px`);
        sprite.style.setProperty('--burst-y', `${burstY}px`);
        sprite.style.setProperty('--fall-x', `${burstX + (-120 + Math.random() * 240)}px`);
        sprite.style.setProperty('--fall-y', `${window.innerHeight - originY + 180 + Math.random() * 260}px`);
        sprite.style.setProperty('--sprite-size', `${spriteConfig.minSize + Math.random() * spriteConfig.sizeRange}px`);
        sprite.style.setProperty('--sprite-delay', `${Math.random() * .3}s`);
        sprite.style.setProperty('--sprite-duration', `${3.2 + Math.random() * 1.8}s`);
        sprite.style.setProperty('--sprite-rotate', `${-300 + Math.random() * 600}deg`);
        layer.appendChild(sprite);
      }

      document.body.appendChild(layer);
      window.setTimeout(() => layer.remove(), 5600);
    };

    const openPlayground = trigger => {
      if (activePlayground || document.querySelector('.surprise-playground')) return;

      const previousFocus = document.activeElement;
      const layer = document.createElement('section');
      const backdrop = document.createElement('div');
      const toolbar = document.createElement('div');
      const toolbarCopy = document.createElement('p');
      const toolbarTitle = document.createElement('strong');
      const toolbarHint = document.createElement('span');
      const closeButton = document.createElement('button');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const compact = window.innerWidth < 720;
      const spriteTypes = compact
        ? ['sunflower', 'camera', 'rodriguez', 'sunflower', 'camera', 'sunflower', 'rodriguez', 'camera']
        : ['sunflower', 'camera', 'rodriguez', 'sunflower', 'camera', 'sunflower', 'rodriguez', 'camera', 'sunflower', 'rodriguez', 'camera', 'sunflower'];
      const spriteLabels = {
        sunflower: 'Sunflower',
        camera: 'Camera',
        rodriguez: 'Rodriguez'
      };
      const spriteMetrics = {
        sunflower: { size: compact ? 66 : 92, ratio: 1 },
        camera: { size: compact ? 82 : 116, ratio: .9 },
        rodriguez: { size: compact ? 66 : 92, ratio: .665 }
      };
      const states = [];
      let animationFrame = 0;
      let lastFrame = performance.now();
      let topLayer = 1;

      layer.className = 'surprise-playground';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      layer.setAttribute('aria-label', 'Floating friends playground');
      backdrop.className = 'surprise-playground-backdrop';
      toolbar.className = 'surprise-playground-toolbar';
      toolbarCopy.className = 'surprise-playground-copy';
      toolbarTitle.textContent = 'Balloon mode';
      toolbarHint.textContent = 'Drag and throw the floating friends.';
      closeButton.className = 'surprise-playground-close';
      closeButton.type = 'button';
      closeButton.textContent = 'Close';
      closeButton.setAttribute('aria-label', 'Close balloon mode');

      toolbarCopy.append(toolbarTitle, toolbarHint);
      toolbar.append(toolbarCopy, closeButton);
      layer.append(backdrop, toolbar);
      document.body.appendChild(layer);
      body.classList.add('surprise-playground-open');

      const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

      const render = state => {
        state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${state.rotation}deg)`;
      };

      const keepInBounds = (state, bounce = false) => {
        const maximumX = Math.max(0, window.innerWidth - state.width);
        const maximumY = Math.max(0, window.innerHeight - state.height);

        if (state.x <= 0) {
          state.x = 0;
          if (bounce && state.vx < 0) state.vx = Math.abs(state.vx) * .82;
        } else if (state.x >= maximumX) {
          state.x = maximumX;
          if (bounce && state.vx > 0) state.vx = -Math.abs(state.vx) * .82;
        }

        if (state.y <= 0) {
          state.y = 0;
          if (bounce && state.vy < 0) state.vy = Math.abs(state.vy) * .82;
        } else if (state.y >= maximumY) {
          state.y = maximumY;
          if (bounce && state.vy > 0) state.vy = -Math.abs(state.vy) * .82;
        }
      };

      const finishDrag = (state, event) => {
        if (!state.dragging || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
        state.dragging = false;
        state.element.classList.remove('is-dragging');
        if (event.pointerId !== undefined && state.element.hasPointerCapture?.(event.pointerId)) {
          state.element.releasePointerCapture(event.pointerId);
        }
      };

      spriteTypes.forEach((type, index) => {
        const metric = spriteMetrics[type];
        const size = metric.size * (.9 + Math.random() * .2);
        const item = document.createElement('button');
        const image = document.createElement('img');
        const columns = compact ? 3 : 4;
        const rows = Math.ceil(spriteTypes.length / columns);
        const width = size;
        const height = size / metric.ratio;
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellWidth = window.innerWidth / columns;
        const cellHeight = window.innerHeight / rows;
        const jitterX = (Math.random() - .5) * cellWidth * .3;
        const jitterY = (Math.random() - .5) * cellHeight * .25;
        const state = {
          element: item,
          width,
          height,
          x: clamp((column + .5) * cellWidth - width / 2 + jitterX, 8, Math.max(8, window.innerWidth - width - 8)),
          y: clamp((row + .5) * cellHeight - height / 2 + jitterY, 8, Math.max(8, window.innerHeight - height - 8)),
          vx: reducedMotion ? 0 : (Math.random() - .5) * .08,
          vy: reducedMotion ? 0 : (Math.random() - .5) * .07,
          rotation: (Math.random() - .5) * 12,
          spin: reducedMotion ? 0 : (Math.random() - .5) * .012,
          phase: Math.random() * Math.PI * 2,
          frequency: .00055 + Math.random() * .00045,
          dragging: false,
          pointerId: null,
          pointerOffsetX: 0,
          pointerOffsetY: 0,
          lastPointerX: 0,
          lastPointerY: 0,
          lastPointerTime: 0
        };

        item.className = `surprise-floater ${surpriseSprites[type].className}`;
        item.type = 'button';
        item.style.setProperty('--float-size', `${width}px`);
        item.style.setProperty('--float-ratio', String(metric.ratio));
        item.style.setProperty('--float-delay', `${index * 45}ms`);
        item.setAttribute('aria-label', `${spriteLabels[type]}. Drag it or use the arrow keys to move it`);
        image.src = surpriseSprites[type].src;
        image.alt = '';
        image.draggable = false;
        image.decoding = 'async';
        item.appendChild(image);
        layer.appendChild(item);
        states.push(state);
        render(state);

        item.addEventListener('pointerdown', event => {
          if (event.button !== undefined && event.button !== 0) return;
          event.preventDefault();
          state.dragging = true;
          state.pointerId = event.pointerId;
          state.pointerOffsetX = event.clientX - state.x;
          state.pointerOffsetY = event.clientY - state.y;
          state.lastPointerX = event.clientX;
          state.lastPointerY = event.clientY;
          state.lastPointerTime = performance.now();
          state.vx = 0;
          state.vy = 0;
          topLayer += 1;
          item.style.zIndex = String(topLayer);
          item.classList.add('is-dragging');
          item.setPointerCapture?.(event.pointerId);
        });

        item.addEventListener('pointermove', event => {
          if (!state.dragging || event.pointerId !== state.pointerId) return;
          event.preventDefault();
          const now = performance.now();
          const elapsed = Math.max(8, now - state.lastPointerTime);
          const maximumX = Math.max(0, window.innerWidth - state.width);
          const maximumY = Math.max(0, window.innerHeight - state.height);
          const nextX = clamp(event.clientX - state.pointerOffsetX, 0, maximumX);
          const nextY = clamp(event.clientY - state.pointerOffsetY, 0, maximumY);
          const instantVx = (nextX - state.x) / elapsed;
          const instantVy = (nextY - state.y) / elapsed;

          state.vx = clamp((state.vx * .22) + (instantVx * .78), -2.35, 2.35);
          state.vy = clamp((state.vy * .22) + (instantVy * .78), -2.35, 2.35);
          state.x = nextX;
          state.y = nextY;
          state.lastPointerX = event.clientX;
          state.lastPointerY = event.clientY;
          state.lastPointerTime = now;
          render(state);
        });

        item.addEventListener('pointerup', event => finishDrag(state, event));
        item.addEventListener('pointercancel', event => {
          state.vx = 0;
          state.vy = 0;
          finishDrag(state, event);
        });

        item.addEventListener('keydown', event => {
          const distance = event.shiftKey ? 48 : 24;
          if (event.key === 'ArrowLeft') state.x -= distance;
          else if (event.key === 'ArrowRight') state.x += distance;
          else if (event.key === 'ArrowUp') state.y -= distance;
          else if (event.key === 'ArrowDown') state.y += distance;
          else if (event.key === ' ') {
            state.vx = (Math.random() - .5) * 1.2;
            state.vy = -.45 - Math.random() * .55;
          } else return;

          event.preventDefault();
          keepInBounds(state);
          render(state);
        });
      });

      const animate = now => {
        const elapsed = Math.min(34, Math.max(0, now - lastFrame));
        lastFrame = now;

        states.forEach(state => {
          if (state.dragging) return;
          const driftX = reducedMotion ? 0 : Math.sin((now * state.frequency) + state.phase) * .018;
          const driftY = reducedMotion ? 0 : Math.cos((now * state.frequency * .83) + state.phase) * .014;
          const damping = Math.pow(.992, elapsed / 16.667);

          state.x += (state.vx + driftX) * elapsed;
          state.y += (state.vy + driftY) * elapsed;
          state.vx *= damping;
          state.vy *= damping;
          state.rotation += (state.spin + (state.vx * .014)) * elapsed;
          keepInBounds(state, true);
          render(state);
        });

        animationFrame = window.requestAnimationFrame(animate);
      };

      const resizePlayground = () => {
        states.forEach(state => {
          keepInBounds(state);
          render(state);
        });
      };

      const closePlayground = () => {
        if (!activePlayground) return;
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resizePlayground);
        document.removeEventListener('keydown', handlePlaygroundKeydown);
        body.classList.remove('surprise-playground-open');
        layer.classList.add('is-closing');
        window.setTimeout(() => layer.remove(), 260);
        if (previousFocus?.focus) previousFocus.focus({ preventScroll: true });
        activePlayground = null;
      };

      const handlePlaygroundKeydown = event => {
        if (event.key === 'Escape') {
          closePlayground();
          return;
        }

        if (event.key === 'Tab') {
          const controls = [closeButton, ...states.map(state => state.element)];
          const currentIndex = controls.indexOf(document.activeElement);
          const direction = event.shiftKey ? -1 : 1;
          const nextIndex = currentIndex < 0
            ? 0
            : (currentIndex + direction + controls.length) % controls.length;
          event.preventDefault();
          controls[nextIndex].focus({ preventScroll: true });
        }
      };

      activePlayground = { close: closePlayground, layer };
      closeButton.addEventListener('click', closePlayground);
      window.addEventListener('resize', resizePlayground, { passive: true });
      document.addEventListener('keydown', handlePlaygroundKeydown);
      animationFrame = window.requestAnimationFrame(() => {
        if (!activePlayground || activePlayground.layer !== layer) return;
        layer.classList.add('is-visible');
        states.forEach(state => state.element.classList.add('is-visible'));
        closeButton.focus({ preventScroll: true });
        animationFrame = window.requestAnimationFrame(animate);
      });
    };

    const registerRapidClick = trigger => {
      const now = performance.now();
      const clicks = (rapidClickHistory.get(trigger) || []).filter(time => now - time <= rapidClickWindow);
      clicks.push(now);

      if (clicks.length >= 7) {
        rapidClickHistory.set(trigger, []);
        openPlayground(trigger);
        return;
      }

      rapidClickHistory.set(trigger, clicks);
    };

    sunflowerTriggers.forEach(trigger => {
      let holdTimer = 0;
      let holdActive = false;
      let suppressNextClick = false;
      let popTimer = 0;

      const setTriggerLabel = label => {
        const completeLabel = `${label}. Press and hold to charge the surprise`;
        trigger.setAttribute('aria-label', completeLabel);
        trigger.setAttribute('title', completeLabel);
      };

      const releaseSurprise = () => {
        const level = Math.min(3, (triggerLevels.get(trigger) || 0) + 1);
        triggerLevels.set(trigger, level);
        bloom(trigger, level);

        const nextLabel = level === 1
          ? 'Release the sunflowers and cameras'
          : level === 2
            ? 'Invite Rodriguez too'
            : 'Release the whole crew again';
        setTriggerLabel(nextLabel);
      };

      const resetCharge = () => {
        window.clearTimeout(holdTimer);
        holdTimer = 0;
        holdActive = false;
        trigger.classList.remove('is-charging');
      };

      const completeCharge = () => {
        if (!holdActive) return;
        resetCharge();
        suppressNextClick = true;
        trigger.classList.add('is-overloaded');
        releaseSurprise();

        window.clearTimeout(popTimer);
        popTimer = window.setTimeout(() => trigger.classList.remove('is-overloaded'), 620);
      };

      const startCharge = () => {
        if (holdActive) return;
        window.clearTimeout(popTimer);
        trigger.classList.remove('is-overloaded');
        trigger.classList.add('is-charging');
        trigger.style.setProperty('--charge-duration', `${holdDuration}ms`);
        holdActive = true;
        holdTimer = window.setTimeout(completeCharge, holdDuration);
      };

      setTriggerLabel('Release the sunflowers');

      trigger.addEventListener('pointerdown', event => {
        if (event.button !== undefined && event.button !== 0) return;
        suppressNextClick = false;
        startCharge();
        trigger.setPointerCapture?.(event.pointerId);
      });

      trigger.addEventListener('pointerup', event => {
        if (holdActive) resetCharge();
        if (trigger.hasPointerCapture?.(event.pointerId)) {
          trigger.releasePointerCapture(event.pointerId);
        }
      });

      trigger.addEventListener('pointercancel', () => {
        resetCharge();
        suppressNextClick = false;
      });
      trigger.addEventListener('lostpointercapture', () => {
        if (holdActive) resetCharge();
      });

      trigger.addEventListener('keydown', event => {
        if (event.key === ' ' && !event.repeat) startCharge();
      });

      trigger.addEventListener('keyup', event => {
        if (event.key === ' ' && holdActive) resetCharge();
      });

      trigger.addEventListener('blur', () => {
        resetCharge();
        suppressNextClick = false;
      });

      trigger.addEventListener('contextmenu', event => {
        if (holdActive || suppressNextClick) event.preventDefault();
      });

      trigger.addEventListener('click', event => {
        if (suppressNextClick) {
          suppressNextClick = false;
          event.preventDefault();
          return;
        }
        releaseSurprise();
        registerRapidClick(trigger);
      });
    });
  }

  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-categories]')];
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.filter;
      filters.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      cards.forEach(card => {
        const categories = (card.dataset.categories || '').split(' ');
        card.hidden = target !== 'all' && !categories.includes(target);
      });
    });
  });

  document.querySelectorAll('[data-swipe-carousel]').forEach(carousel => {
    const hint = carousel.nextElementSibling?.matches('[data-swipe-hint]')
      ? carousel.nextElementSibling
      : null;
    const thumb = hint?.querySelector('i b');
    let frame = 0;

    const syncCarouselHint = () => {
      frame = 0;
      if (!hint || !thumb) return;
      const maximum = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
      const visibleRatio = carousel.scrollWidth > 0
        ? Math.min(1, carousel.clientWidth / carousel.scrollWidth)
        : 1;
      const progress = maximum > 0 ? carousel.scrollLeft / maximum : 0;
      thumb.style.width = `${Math.max(16, visibleRatio * 100)}%`;
      thumb.style.left = `${progress * Math.max(0, 100 - (visibleRatio * 100))}%`;
      hint.classList.toggle('is-inactive', maximum < 2);
      hint.classList.toggle('is-complete', maximum > 0 && progress > .97);
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncCarouselHint);
    };

    carousel.addEventListener('scroll', requestSync, { passive: true });
    carousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      carousel.scrollBy({
        left: (event.key === 'ArrowRight' ? 1 : -1) * carousel.clientWidth * .72,
        behavior: 'smooth'
      });
    });
    window.addEventListener('resize', requestSync, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(requestSync).observe(carousel);
    syncCarouselHint();
  });

  document.querySelectorAll('[data-before-after]').forEach(comparison => {
    const range = comparison.querySelector('input[type="range"]');
    if (!range) return;
    const syncComparison = () => {
      comparison.style.setProperty('--reveal', `${range.value}%`);
    };
    range.addEventListener('input', syncComparison, { passive: true });
    syncComparison();
  });

  const lightbox = document.querySelector('[data-lightbox]');
  if (lightbox) {
    const image = lightbox.querySelector('img');
    const close = lightbox.querySelector('button');
    let lastFocus = null;
    const hide = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll('[data-zoom]').forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      const open = () => {
        const source = item.matches('img') ? item : item.querySelector('img');
        if (!source) return;
        lastFocus = item;
        image.src = source.currentSrc || source.src;
        image.alt = source.alt;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        body.classList.add('lightbox-open');
        close.focus();
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
    close.addEventListener('click', hide);
    lightbox.addEventListener('click', event => { if (event.target === lightbox) hide(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) hide(); });
  }

  const reveal = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
    reveal.forEach(item => observer.observe(item));
  } else {
    reveal.forEach(item => item.classList.add('is-visible'));
  }

  document.querySelectorAll('[data-deck]').forEach(deck => {
    const slides = JSON.parse(deck.dataset.deck || '[]');
    if (!slides.length) return;
    const stage = deck.querySelector('[data-deck-image]');
    const status = deck.querySelector('[data-deck-status]');
    const prev = deck.querySelector('[data-deck-prev]');
    const next = deck.querySelector('[data-deck-next]');
    const thumbs = [...deck.querySelectorAll('[data-deck-thumb]')];
    let index = 0;
    const render = nextIndex => {
      index = (nextIndex + slides.length) % slides.length;
      stage.style.opacity = '0';
      window.setTimeout(() => {
        stage.src = slides[index].src;
        stage.alt = slides[index].alt;
        stage.style.opacity = '1';
      }, 120);
      status.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === index));
      thumbs[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };
    prev.addEventListener('click', () => render(index - 1));
    next.addEventListener('click', () => render(index + 1));
    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => render(i)));
    deck.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') render(index - 1);
      if (event.key === 'ArrowRight') render(index + 1);
    });
    render(0);
  });
})();
