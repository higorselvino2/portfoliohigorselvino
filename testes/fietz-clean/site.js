(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const form = $('#quote-form');
  const model = $('#model');
  const quantity = $('#quantity');
  const place = $('#place');
  const notes = $('#notes');
  const preview = $('.request-preview');
  const output = $('#request-text');
  const actions = $('#review-actions');
  const state = $('#preview-state');
  const status = $('#form-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const models = { 'Sofá': ['2 lugares', '3 lugares', 'Retrátil ou com chaise', 'Não sei informar'], 'Colchão': ['Solteiro', 'Casal', 'Queen', 'King', 'Não sei informar'] };
  let reviewed = false;
  const selectedPiece = () => form.elements.piece.value;
  const message = () => {
    const piece = selectedPiece().toLocaleLowerCase('pt-BR');
    const lines = ['Olá, Fietz Clean. Gostaria de um orçamento para higienização.', '', `Peça: ${piece}`, `Quantidade: ${quantity.value || 'a informar'}`];
    if (model.value) lines.push(`Tamanho ou modelo: ${model.value}`);
    if (place.value.trim()) lines.push(`Local: ${place.value.trim()}`);
    if (notes.value.trim()) lines.push(`O que precisa de atenção: ${notes.value.trim()}`);
    lines.push('', 'Posso enviar fotos para avaliação. Poderiam confirmar o atendimento no meu bairro e a disponibilidade?');
    return lines.join('\n');
  };
  const sync = () => {
    output.textContent = message();
    $('#manual-copy').value = message();
    $('#whatsapp-link').href = `https://wa.me/5551986029129?text=${encodeURIComponent(message())}`;
    $('[data-count="-1"]').disabled = Number(quantity.value) <= 1;
    $('[data-count="1"]').disabled = Number(quantity.value) >= 20;
    if (reviewed) {
      reviewed = false;
      actions.hidden = true;
      preview.classList.remove('is-reviewed');
      state.textContent = 'Atualizado';
      status.textContent = 'Pedido alterado. Revise a mensagem novamente para continuar.';
    }
    $('#copy-status').textContent = '';
    $('#copy-fallback').hidden = true;
  };
  const clearError = (field) => {
    field.removeAttribute('aria-invalid');
    $(`#${field.id}-error`).textContent = '';
  };
  const setError = (field, text) => {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${field.id}-error`);
    $(`#${field.id}-error`).textContent = text;
  };
  const setPiece = (piece) => {
    form.querySelectorAll('[name="piece"]').forEach(radio => { radio.checked = radio.value === piece; });
    model.replaceChildren(new Option('Selecione o tamanho', ''), ...models[piece].map(value => new Option(value, value)));
    clearError(model);
    sync();
  };
  form.querySelectorAll('[name="piece"]').forEach(radio => radio.addEventListener('change', () => setPiece(radio.value)));
  document.querySelectorAll('[data-pick]').forEach(link => link.addEventListener('click', () => setPiece(link.dataset.pick)));
  document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
    quantity.value = String(Math.min(20, Math.max(1, (Number(quantity.value) || 1) + Number(button.dataset.count))));
    clearError(quantity);
    sync();
  }));
  [model, quantity, place, notes].forEach(field => field.addEventListener('input', () => { if (field !== notes) clearError(field); sync(); }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    [model, quantity, place].forEach(clearError);
    const errors = [];
    if (!model.value) { setError(model, 'Selecione o tamanho ou escolha “Não sei informar”.'); errors.push(model); }
    if (!Number.isInteger(Number(quantity.value)) || Number(quantity.value) < 1 || Number(quantity.value) > 20) { setError(quantity, 'Informe uma quantidade de 1 a 20.'); errors.push(quantity); }
    if (place.value.trim().length < 4) { setError(place, 'Informe sua cidade e seu bairro.'); errors.push(place); }
    if (errors.length) {
      status.textContent = `Confira ${errors.length === 1 ? 'o campo indicado' : 'os campos indicados'} antes de revisar.`;
      errors[0].focus();
      return;
    }
    sync();
    reviewed = true;
    state.textContent = 'Pronta para revisar';
    preview.classList.add('is-reviewed');
    actions.hidden = false;
    status.textContent = '';
    preview.focus({ preventScroll: true });
    preview.scrollIntoView({ behavior: reduced.matches || event.submitter?.matches(':focus-visible') ? 'instant' : 'smooth', block: 'start' });
  });
  $('#copy-message').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message());
      $('#copy-status').textContent = 'Mensagem copiada. Cole na conversa quando quiser.';
    } catch {
      $('#copy-fallback').hidden = false;
      $('#manual-copy').focus();
      $('#manual-copy').select();
      $('#copy-status').textContent = 'A cópia automática não ficou disponível. Copie o texto selecionado abaixo.';
    }
  });
  const toggle = $('.menu-toggle');
  const menu = $('#menu');
  const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); menu.classList.remove('is-open'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
  matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
  sync();
})();
