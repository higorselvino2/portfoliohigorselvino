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

    sunflowerTriggers.forEach(trigger => {
      trigger.setAttribute('aria-label', 'Release the sunflowers');
      trigger.setAttribute('title', 'Release the sunflowers');
      trigger.addEventListener('click', () => {
        const level = Math.min(3, (triggerLevels.get(trigger) || 0) + 1);
        triggerLevels.set(trigger, level);
        bloom(trigger, level);

        const nextLabel = level === 1
          ? 'Release the sunflowers and cameras'
          : level === 2
            ? 'Invite Rodriguez too'
            : 'Release the whole crew again';
        trigger.setAttribute('aria-label', nextLabel);
        trigger.setAttribute('title', nextLabel);
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
