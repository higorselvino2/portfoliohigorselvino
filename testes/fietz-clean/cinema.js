(() => {
  'use strict';
  const html = document.documentElement;
  const story = document.querySelector('.cinema-story');
  const stage = document.querySelector('.cinema-stage');
  stage.dataset.build = '20261116-4';
  const canvas = document.querySelector('#cinema-canvas');
  const toggle = document.querySelector('#motion-toggle');
  const hint = document.querySelector('#scroll-hint');
  const progressBar = document.querySelector('.story-progress span');
  const panels = [...document.querySelectorAll('.story-panel')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width:700px)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const initialHash = location.hash;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const ctx = canvas?.getContext('2d', { alpha: false });
  const base = new URL('assets/cinema/', document.baseURI);
  const cache = new Map();
  const queued = new Set();
  const pending = new Set();
  const failures = new Map();
  const queue = [];
  const maxCached = compact ? 10 : 24;
  const maxWorkers = compact ? 2 : 3;
  let generation = 0, running = false, manual = null, manifest = null, manifestPromise = null;
  let sequence = null, trigger = null, gsapContext = null, transition = null, lenis = null, lenisTick = null;
  let desired = 0, drawn = -1, chapter = 0, activeWorkers = 0, drawRequest = 0, currentProgress = 0;
  let pendingResize = 0, resizeObserver = null;
  let initialAnchorHandled = false;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const closeImage = image => { if (image?.close) image.close(); else if (image instanceof HTMLImageElement) image.src = ''; };
  const touch = (index, image) => { cache.delete(index); cache.set(index, image); };
  const trim = () => {
    for (const [index, image] of cache) {
      if (cache.size <= maxCached) break;
      if (index === drawn || index === desired) continue;
      cache.delete(index);
      closeImage(image);
    }
  };
  const frameURL = index => new URL(sequence.pattern.replace('####', String(index + 1).padStart(4, '0')), base).href;
  const fit = () => {
    if (!ctx) return;
    const rect = stage.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, compact ? 1.5 : 2, 1920 / rect.width, 1600 / rect.height);
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    drawn = -1;
    render();
  };
  const render = () => {
    drawRequest = 0;
    if (!running || !ctx || !cache.size) return;
    let nearest = cache.has(desired) ? desired : [...cache.keys()].sort((a, b) => Math.abs(a - desired) - Math.abs(b - desired))[0];
    if (nearest === undefined || nearest === drawn) return;
    const image = cache.get(nearest);
    if (!image || !image.width || !image.height) return;
    const w = canvas.width, h = canvas.height;
    const cover = Math.max(w / image.width, h / image.height);
    const iw = image.width * cover, ih = image.height * cover;
    const focus = compact ? .69 : .5;
    ctx.drawImage(image, -(iw - w) * focus, -(ih - h) * .5, iw, ih);
    touch(nearest, image);
    drawn = nearest;
    stage.dataset.rendered = 'true';
    stage.dataset.frame = String(nearest);
    stage.dataset.cinemaState = cache.has(desired) ? 'ready' : 'loading';
    trim();
  };
  const scheduleDraw = () => { if (!drawRequest) drawRequest = requestAnimationFrame(render); };
  const decode = async (url, signal) => {
    const response = await fetch(url, { cache: 'force-cache', signal });
    if (!response.ok) throw new Error('Frame unavailable');
    const blob = await response.blob();
    if (window.createImageBitmap) {
      try { return await createImageBitmap(blob); } catch { /* native image fallback */ }
    }
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const objectURL = URL.createObjectURL(blob);
      image.onload = () => { URL.revokeObjectURL(objectURL); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(objectURL); reject(new Error('Frame cannot decode')); };
      image.src = objectURL;
    });
  };
  const controllers = new Set();
  const pump = () => {
    while (running && activeWorkers < maxWorkers && queue.length) {
      const index = queue.shift();
      queued.delete(index);
      if (cache.has(index) || pending.has(index)) continue;
      pending.add(index);
      activeWorkers += 1;
      const thisGeneration = generation;
      const controller = new AbortController();
      controllers.add(controller);
      decode(frameURL(index), controller.signal).then(image => {
        if (!running || generation !== thisGeneration) { closeImage(image); return; }
        touch(index, image);
        scheduleDraw();
        trim();
      }).catch(error => {
        if (error.name !== 'AbortError') failures.set(index, (failures.get(index) || 0) + 1);
      }).finally(() => {
        controllers.delete(controller);
        if (thisGeneration !== generation) return;
        pending.delete(index);
        activeWorkers -= 1;
        pump();
      });
    }
  };
  const requestFrame = (index, priority = false) => {
    if (!sequence || index < 0 || index >= sequence.count || cache.has(index) || pending.has(index) || (failures.get(index) || 0) >= 2) return;
    if (queued.has(index)) {
      if (priority) { queue.splice(queue.indexOf(index), 1); queue.unshift(index); }
      return;
    }
    queued.add(index);
    if (priority) queue.unshift(index); else queue.push(index);
  };
  const buffer = index => {
    desired = index;
    const radius = compact ? 3 : 5;
    // Discard old queued work after a fast scroll. In-flight requests may finish and enter the bounded cache.
    for (let n = queue.length - 1; n >= 0; n -= 1) {
      if (Math.abs(queue[n] - index) > radius * 3) { queued.delete(queue[n]); queue.splice(n, 1); }
    }
    for (let distance = radius; distance >= 1; distance -= 1) { requestFrame(index - distance, true); requestFrame(index + distance, true); }
    requestFrame(index, true);
    pump();
    scheduleDraw();
  };
  const showChapter = index => {
    if (index === chapter) return;
    transition?.kill();
    chapter = index;
    panels.forEach((panel, n) => {
      panel.inert = n !== index;
      panel.setAttribute('aria-hidden', String(n !== index));
      panel.classList.toggle('is-current', n === index);
    });
    gsap.killTweensOf(panels);
    // Fade old copy out before the new title arrives, including when direction changes quickly.
    gsap.set(panels.filter((_, n) => n !== index), { autoAlpha: 0 });
    transition = gsap.fromTo(panels[index], { autoAlpha: 0, yPercent: -50, y: 18 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power3.out', overwrite: true });
  };
  const progress = value => {
    currentProgress = Math.min(1, Math.max(0, value));
    buffer(Math.round(currentProgress * (sequence.count - 1)));
    progressBar.style.transform = `scaleX(${currentProgress})`;
    stage.dataset.progress = currentProgress.toFixed(3);
    showChapter(currentProgress < .34 ? 0 : currentProgress < .7 ? 1 : 2);
  };
  const stop = ({ keepPosition = true } = {}) => {
    const wasInside = trigger?.isActive;
    const wasPastPin = trigger && scrollY >= trigger.end;
    const previousY = scrollY;
    const previousHeight = story.offsetHeight;
    running = false;
    generation += 1;
    transition?.kill();
    transition = null;
    gsapContext?.revert();
    gsapContext = null;
    trigger = null;
    if (lenisTick) gsap?.ticker.remove(lenisTick);
    lenis?.destroy();
    lenis = null;
    lenisTick = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    controllers.forEach(controller => controller.abort());
    queue.length = 0; queued.clear(); pending.clear(); activeWorkers = 0;
    cache.forEach(closeImage); cache.clear();
    if (drawRequest) cancelAnimationFrame(drawRequest);
    drawRequest = 0; drawn = -1; desired = 0; chapter = 0;
    panels.forEach((panel, n) => {
      ['opacity', 'visibility', 'transform', 'translate'].forEach(property => panel.style.removeProperty(property));
      panel.classList.toggle('is-current', n === 0);
      panel.inert = n !== 0;
      panel.setAttribute('aria-hidden', String(n !== 0));
    });
    html.classList.remove('cinema-live');
    html.classList.add('cinema-static', 'is-motion-off');
    stage.dataset.rendered = 'false';
    stage.dataset.cinemaState = 'static';
    progressBar.style.transform = 'scaleX(0)';
    toggle.textContent = 'Ativar animação';
    toggle.setAttribute('aria-pressed', 'false');
    hint.textContent = 'Conheça os cuidados';
    if (keepPosition && wasInside) window.scrollTo({ top: story.offsetTop, behavior: 'instant' });
    else if (keepPosition && wasPastPin) window.scrollTo({ top: Math.max(0, previousY - (previousHeight - story.offsetHeight)), behavior: 'instant' });
  };
  const getManifest = () => manifestPromise ||= fetch(new URL('manifest.json', base), { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('Sequence unavailable');
    return response.json();
  }).then(data => { manifest = data; return data; }).catch(error => { manifestPromise = null; throw error; });
  const start = async () => {
    if (running || !gsap || !ScrollTrigger || !ctx) return;
    toggle.disabled = true;
    try {
      await getManifest();
      if (!(manual ?? (!reduced.matches && !saveData)) || stage.getBoundingClientRect().height > innerHeight + 1) return;
      sequence = compact ? manifest.mobile : manifest.desktop;
      if (!sequence?.count || !sequence?.pattern) return;
      stage.dataset.frameCount = String(sequence.count);
      stage.dataset.scrollMode = compact ? 'native' : 'lenis';
      const scrollBefore = scrollY;
      running = true;
      generation += 1;
      html.classList.remove('cinema-static', 'is-motion-off');
      html.classList.add('cinema-live');
      stage.dataset.cinemaState = 'loading';
      toggle.textContent = 'Desativar animação';
      toggle.setAttribute('aria-pressed', 'true');
      hint.textContent = 'Role para explorar';
      gsap.registerPlugin(ScrollTrigger);
      gsapContext = gsap.context(() => {
        gsap.set(panels, { autoAlpha: 0, yPercent: -50, y: 0 });
        gsap.set(panels[0], { autoAlpha: 1 });
        trigger = ScrollTrigger.create({
          id: 'fietz-cinema', trigger: story, pin: stage, pinSpacing: true,
          start: 'top top', end: () => `+=${Math.round(innerHeight * (compact ? 1.8 : 2.8))}`,
          anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => progress(self.progress), onRefresh: self => progress(self.progress)
        });
        document.querySelectorAll('[data-parallax]').forEach(frame => {
          const image = frame.querySelector('img');
          if (!image) return;
          gsap.fromTo(image, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .45 } });
        });
        document.querySelectorAll('[data-mask-reveal]').forEach(frame => {
          gsap.fromTo(frame, { clipPath: 'inset(8% 6% 8% 6% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', ease: 'none', scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 20%', scrub: .5 } });
        });
      });
      if (window.Lenis && !compact) {
        lenis = new window.Lenis({ autoRaf: false, anchors: false, smoothWheel: true, syncTouch: false, lerp: .11, prevent: node => ['TEXTAREA', 'SELECT', 'INPUT'].includes(node.tagName) });
        lenis.on('scroll', ScrollTrigger.update);
        lenisTick = time => lenis?.raf(time * 1000);
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
      }
      fit();
      buffer(Math.round(currentProgress * (sequence.count - 1)));
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(pendingResize);
        pendingResize = setTimeout(fit, 120);
      });
      resizeObserver.observe(stage);
      ScrollTrigger.refresh();
      if (!location.hash || !initialAnchorHandled) {
        if (lenis) lenis.scrollTo(scrollBefore, { immediate: true });
        else window.scrollTo({ top: scrollBefore, behavior: 'instant' });
        ScrollTrigger.update();
      }
      if (!initialAnchorHandled && location.hash) {
        initialAnchorHandled = true;
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) requestAnimationFrame(() => navigate(target, { keyboard: true }));
      }
    } catch {
      stop({ keepPosition: false });
      stage.dataset.cinemaState = 'unavailable';
      hint.textContent = 'Conheça os cuidados';
    } finally { toggle.disabled = false; }
  };
  const navigate = (target, { keyboard = false } = {}) => {
    const offset = document.querySelector('.nav').getBoundingClientRect().height + 24;
    // Numeric destinations avoid counting CSS scroll-padding and scroll-margin a second time in Lenis.
    const top = Math.max(0, target.getBoundingClientRect().top + scrollY - offset);
    if (lenis) lenis.scrollTo(top, { immediate: keyboard, duration: .95 });
    else {
      window.scrollTo({ top, behavior: running && !keyboard && !reduced.matches ? 'smooth' : 'instant' });
    }
  };
  window.fietzNavigate = navigate;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    navigate(target, { keyboard: event.detail === 0 });
    if (link.classList.contains('skip-link')) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
  addEventListener('popstate', () => { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (target) navigate(target, { keyboard: true }); });
  toggle.addEventListener('click', () => { manual = !running; if (running) stop(); else start(); });
  reduced.addEventListener('change', () => { manual = null; if (reduced.matches) stop(); else if (!saveData) start(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && running) scheduleDraw(); });
  addEventListener('pagehide', () => { if (running) stop({ keepPosition: false }); });
  addEventListener('pageshow', event => { if (event.persisted && (manual ?? (!reduced.matches && !saveData))) start(); });
  const pageReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => addEventListener('load', resolve, { once: true }));
  Promise.all([document.fonts.ready, pageReady]).then(() => requestAnimationFrame(() => {
    if (running) ScrollTrigger.refresh();
    requestAnimationFrame(() => {
      if (!initialHash || location.hash !== initialHash) return;
      const target = document.getElementById(decodeURIComponent(initialHash.slice(1)));
      if (target) navigate(target, { keyboard: true });
    });
  }));
  const availability = () => {
    const fits = stage.getBoundingClientRect().height <= innerHeight + 1;
    html.classList.toggle('motion-available', Boolean(gsap && ScrollTrigger && ctx && fits));
    if (!fits && running) stop();
    else if (fits && !running && (manual ?? (!reduced.matches && !saveData))) start();
  };
  let modeResize = 0;
  addEventListener('resize', () => { clearTimeout(modeResize); modeResize = setTimeout(availability, 240); });
  stop({ keepPosition: false });
  availability();
})();
