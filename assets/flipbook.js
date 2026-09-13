(() => {
  const book = document.querySelector('[data-flipbook]');
  if (!book) return;
  const pages = JSON.parse(book.dataset.flipbook || '[]');
  const image = book.querySelector('[data-book-image]');
  const status = book.querySelector('[data-book-status]');
  const caption = book.querySelector('[data-book-caption]');
  const prev = book.querySelector('[data-book-prev]');
  const next = book.querySelector('[data-book-next]');
  const thumbs = [...book.querySelectorAll('[data-book-thumb]')];
  let index = 0;
  let startX = 0;
  let locked = false;

  const render = (nextIndex, direction = 'next', immediate = false) => {
    if (locked || nextIndex < 0 || nextIndex >= pages.length) return;
    const swap = () => {
      index = nextIndex;
      image.src = pages[index].src;
      image.alt = pages[index].alt;
      status.textContent = `${String(index + 1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
      caption.textContent = pages[index].label;
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === index));
      thumbs[index]?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    };
    if (immediate) { swap(); return; }
    locked = true;
    image.classList.add(direction === 'next' ? 'turning-next' : 'turning-prev');
    window.setTimeout(() => {
      swap();
      image.classList.remove('turning-next', 'turning-prev');
      window.setTimeout(() => { locked = false; }, 180);
    }, 230);
  };

  prev.addEventListener('click', () => render(index - 1, 'prev'));
  next.addEventListener('click', () => render(index + 1, 'next'));
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => render(i, i > index ? 'next' : 'prev')));
  book.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') render(index - 1, 'prev');
    if (event.key === 'ArrowRight') render(index + 1, 'next');
  });
  book.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) < 45) return;
    render(index + (delta < 0 ? 1 : -1), delta < 0 ? 'next' : 'prev');
  }, { passive: true });
  render(0, 'next', true);
})();
