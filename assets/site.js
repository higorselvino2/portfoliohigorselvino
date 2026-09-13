(() => {
  const body = document.body;
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
    let taps = 0;
    let resetTimer = 0;
    const bloom = () => {
      document.querySelector('.sunflower-layer')?.remove();
      const layer = document.createElement('div');
      layer.className = 'sunflower-layer';
      layer.setAttribute('aria-hidden', 'true');
      const total = window.innerWidth < 760 ? 12 : 20;
      for (let index = 0; index < total; index += 1) {
        const flower = document.createElement('span');
        flower.className = 'sunflower-bloom';
        flower.style.left = `${5 + Math.random() * 90}%`;
        flower.style.top = `${12 + Math.random() * 78}%`;
        flower.style.setProperty('--flower-size', `${44 + Math.random() * 62}px`);
        flower.style.setProperty('--flower-delay', `${Math.random() * .45}s`);
        flower.style.setProperty('--flower-rotate', `${-28 + Math.random() * 56}deg`);
        for (let petal = 0; petal < 10; petal += 1) {
          const shape = document.createElement('i');
          shape.style.setProperty('--petal', petal);
          flower.appendChild(shape);
        }
        layer.appendChild(flower);
      }
      document.body.appendChild(layer);
      window.setTimeout(() => layer.remove(), 3600);
    };
    sunflowerTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        taps += 1;
        window.clearTimeout(resetTimer);
        if (taps >= 3) {
          taps = 0;
          bloom();
          return;
        }
        resetTimer = window.setTimeout(() => { taps = 0; }, 2200);
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
