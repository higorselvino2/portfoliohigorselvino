(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); } });
    }, { threshold: .06 });
    document.querySelectorAll('.heading,.design-grid article,.steps article,.author-section,.prospect-card').forEach(element => { element.dataset.reveal=''; element.classList.add('pending'); observer.observe(element); });
    reduced.addEventListener('change', e => { if(e.matches) document.querySelectorAll('.pending').forEach(el => el.classList.remove('pending')); });
  }
  const copy = async (text, container) => {
    const status=container.querySelector('.copy-status');
    try { await navigator.clipboard.writeText(text); if(status) status.textContent='Mensagem copiada.'; }
    catch { if(status) status.textContent='Selecione o texto acima e use a opção Copiar do seu aparelho.'; }
  };
  document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.preview-frame')?.classList.toggle('mobile',button.dataset.device==='mobile');
    document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  const slider=document.querySelector('.comparison input');
  slider?.addEventListener('input',()=>{slider.closest('.comparison').style.setProperty('--split',slider.value+'%');slider.setAttribute('aria-valuetext',`${slider.value}% do site atual e ${100-Number(slider.value)}% da proposta`);});
  document.querySelectorAll('[data-service-pick]').forEach(link=>link.addEventListener('click',()=>{for(const [name,key] of [['service','servicePick'],['item','itemPick']]){const select=document.querySelector(`[name=${name}]`);if(select && [...select.options].some(o=>o.value===link.dataset[key])) select.value=link.dataset[key];}}));
  const quote=document.querySelector('.quote-form');
  quote?.addEventListener('submit',event=>{
    event.preventDefault();
    const d=new FormData(quote), company=document.body.dataset.company;
    const text=`Olá, ${company}! Quero solicitar uma avaliação.\nServiço: ${d.get('service')}\nPeça: ${d.get('item')}\nQuantidade: ${d.get('quantity')}\nTamanho ou modelo: ${String(d.get('size')).trim()}\nCidade e bairro: ${String(d.get('place')).trim()}\nNecessidade: ${String(d.get('need')).trim()||'A alinhar com a equipe'}\nVou enviar fotos da peça para avaliação.`;
    quote.querySelector('.quote-summary').textContent=text;
    const result=quote.querySelector('.quote-result');result.hidden=false;result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});
  });
  document.querySelector('.copy-quote')?.addEventListener('click',()=>copy(quote.querySelector('.quote-summary').textContent,quote));
  const feedback=document.querySelector('.feedback-form');
  feedback?.addEventListener('submit',event=>{
    event.preventDefault();const text=`Oi, Higor! Vi a proposta para ${document.body.dataset.company}.\n\n${feedback.querySelector('textarea').value.trim()}`;
    const result=feedback.querySelector('.feedback-result');result.querySelector('.feedback-message').textContent=text;
    result.querySelector('.email-feedback').href=`mailto:higorselvino0@gmail.com?subject=${encodeURIComponent('Conversa sobre '+document.body.dataset.company)}&body=${encodeURIComponent(text)}`;
    result.hidden=false;result.focus({preventScroll:true});result.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});
  });
  document.querySelector('.copy-feedback')?.addEventListener('click',()=>copy(feedback.querySelector('.feedback-message').textContent,feedback));
  document.querySelectorAll('.copy-outreach').forEach(button=>button.addEventListener('click',()=>{const parent=button.closest('details');copy(parent.querySelector('.outreach-text').innerText,parent);}));
})();
