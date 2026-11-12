(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-story-explorer]').forEach((explorer, group) => {
    const buttons = [...explorer.querySelectorAll('[data-story-tab]')];
    const panels = [...explorer.querySelectorAll('[data-story-panel]')];
    if (!buttons.length || panels.length !== buttons.length) return;
    explorer.classList.add('is-enhanced');
    explorer.querySelector('.story-tabs').setAttribute('role', 'tablist');
    buttons.forEach((button, index) => {
      button.id = `story-tab-${group}-${index}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `story-panel-${group}-${index}`);
      panels[index].id = `story-panel-${group}-${index}`;
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', button.id);
      panels[index].tabIndex = 0;
    });
    let active = 0;
    const select = (index, animate = true) => {
      active = index;
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      explorer.classList.remove('is-switching');
      if (animate && !reducedMotion.matches) {
        void explorer.offsetWidth;
        explorer.classList.add('is-switching');
      }
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        let next = active;
        if (event.key === 'ArrowRight') next = (active + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (active + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        select(next);
        buttons[next].focus({ preventScroll: true });
      });
    });
    explorer.querySelectorAll('[data-mark-scale]').forEach(input => {
      input.addEventListener('input', () => {
        explorer.style.setProperty('--mark-scale', `${input.value}%`);
        input.setAttribute('aria-valuetext', `${input.value} percent of the preview width`);
      });
    });
    select(0, false);
  });

  const launch = document.querySelector('[data-launch-demo]');
  if (launch) {
    const container = document.querySelector('[data-prototype-demo]');
    const frame = container.querySelector('iframe');
    const buttons = [...container.querySelectorAll('[data-prototype-view]')];
    const help = container.querySelector('[data-demo-help]');
    const select = button => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      help.textContent = button.dataset.help;
      frame.src = `prototypes/revision-room/index.html${button.dataset.approved ? '?approved=1' : ''}#${button.dataset.prototypeView}`;
    };
    launch.addEventListener('click', () => {
      container.hidden = false;
      launch.hidden = true;
      launch.setAttribute('aria-expanded', 'true');
      select(buttons[0]);
      buttons[0].focus({ preventScroll: true });
    });
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    container.querySelector('[data-close-demo]').addEventListener('click', () => {
      container.hidden = true;
      frame.removeAttribute('src');
      launch.hidden = false;
      launch.setAttribute('aria-expanded', 'false');
      launch.focus({ preventScroll: true });
    });
  }

  document.querySelectorAll('[data-planning-demo]').forEach(demo => {
    const rows = [...demo.querySelectorAll('[data-unit-price]')];
    const budget = demo.querySelector('[data-plan-budget]');
    const total = demo.querySelector('[data-plan-total]');
    const summary = demo.querySelector('[data-plan-remaining]');
    const progress = demo.querySelector('progress');
    const yen = value => `¥${Math.round(value).toLocaleString('en-US')}`;
    const update = () => {
      let sum = 0;
      rows.forEach(row => {
        const input = row.querySelector('input');
        const quantity = Math.min(20, Math.max(0, Math.floor(Number(input.value) || 0)));
        if (input.value !== '' && Number(input.value) !== quantity) input.value = quantity;
        const frequency = Number(row.querySelector('select').value);
        const subtotal = Number(row.dataset.unitPrice) * quantity * frequency;
        sum += subtotal;
        row.querySelector('[data-row-total]').textContent = `${yen(Number(row.dataset.unitPrice))} × ${quantity} × ${frequency} = ${yen(subtotal)} / month`;
      });
      const limit = Math.max(1, Number(budget.value) || 1);
      if (budget.value !== '' && Number(budget.value) < 1) budget.value = limit;
      total.value = yen(sum);
      const percent = Math.round(sum / limit * 100);
      progress.value = Math.min(100, percent);
      progress.setAttribute('aria-valuetext', `${percent} percent of the example budget`);
      summary.textContent = sum > limit ? `${yen(sum - limit)} over the example budget.` : `${yen(limit - sum)} left in the example budget.`;
    };
    demo.addEventListener('input', update);
    demo.addEventListener('change', update);
    demo.querySelector('[data-plan-reset]').addEventListener('click', () => {
      demo.querySelectorAll('input').forEach(input => { input.value = input.defaultValue; });
      demo.querySelectorAll('select').forEach(select => { select.selectedIndex = 0; });
      update();
    });
    update();
  });

  const main = document.querySelector('main');
  const navs = [...document.querySelectorAll('nav[class$="-toc"], nav[class*="-toc "]')];
  if (main && navs.length) {
    const links = navs.flatMap(nav => {
      nav.dataset.readingNav = '';
      return [...nav.querySelectorAll('a[href^="#"]')];
    });
    const targets = links.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter(item => item.section);
    const meter = document.createElement('div');
    meter.className = 'reading-progress';
    meter.setAttribute('aria-hidden', 'true');
    meter.innerHTML = '<i></i>';
    document.body.append(meter);
    const back = document.createElement('a');
    back.className = 'reading-return';
    back.href = '#main';
    back.textContent = '↑';
    back.setAttribute('aria-label', 'Back to project introduction');
    back.hidden = true;
    document.body.append(back);
    let pending = false;
    let selected = null;
    const update = () => {
      pending = false;
      const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      meter.firstElementChild.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / maximum))})`;
      back.hidden = window.scrollY < window.innerHeight * 1.5;
      const line = Math.min(window.innerHeight * .35, 240);
      const active = targets.filter(item => item.section.getBoundingClientRect().top <= line).at(-1);
      if (active === selected) return;
      selected = active;
      targets.forEach(item => {
        if (item === active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
      if (active) {
        const parent = active.link.parentElement;
        const left = active.link.offsetLeft - parent.offsetLeft;
        if (left < parent.scrollLeft || left + active.link.offsetWidth > parent.scrollLeft + parent.clientWidth) {
          parent.scrollTo({ left: Math.max(0, left - parent.clientWidth / 2 + active.link.offsetWidth / 2), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }
      }
    };
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(main);
    update();
  }
})();
