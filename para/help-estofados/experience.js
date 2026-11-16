/* Experiência conceitual. O pedido permanece local até a aprovação da empresa. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = $('.material-stage'), story = $('.material-story');
  let manualReduced = null, context, refreshTimer;
  const canvas=$('.weave'), painter=canvas.getContext('2d');
  const mobile=matchMedia('(max-width: 650px)').matches;
  const frameCount=mobile?48:72, frameFolder=mobile?'frames-mobile':'frames';
  canvas.width=mobile?576:768;canvas.height=mobile?324:432;
  const frames=new Array(frameCount), playhead={frame:0};let framesStarted=false;
  function renderFrame(){
    const target=Math.round(playhead.frame);let nearest=-1;
    for(let i=0;i<frames.length;i++)if(frames[i]&&(nearest<0||Math.abs(i-target)<Math.abs(nearest-target)))nearest=i;
    if(nearest<0)return;
    painter.drawImage(frames[nearest],0,0,canvas.width,canvas.height);
    canvas.dataset.frame=String(nearest);stage.classList.add('film-ready');
  }
  async function loadFrames(){
    if(framesStarted||document.body.classList.contains('motion-off')||navigator.connection?.saveData)return;
    framesStarted=true;
    // Espalha os primeiros frames por toda a sequência antes de preencher os intervalos.
    const order=[0,frameCount-1], ranges=[[0,frameCount-1]];
    while(ranges.length){const [a,b]=ranges.shift();if(b-a>1){const m=Math.floor((a+b)/2);order.push(m);ranges.push([a,m],[m,b]);}}
    let loaded=0;
    const worker=async()=>{while(order.length){const i=order.shift();await new Promise(resolve=>{const image=new Image();image.decoding='async';image.onload=()=>{frames[i]=image;canvas.dataset.loaded=String(++loaded);renderFrame();resolve();};image.onerror=resolve;image.src=`assets/${frameFolder}/frame-${String(i+1).padStart(3,'0')}.webp`;});}};
    await Promise.all([worker(),worker(),worker()]);
  }
  const nearStory=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadFrames();},{rootMargin:'600px'});nearStory.observe(story);
  function configureStory(){
    context?.revert();context=null;
    const isReduced=manualReduced??reduced.matches;
    document.body.classList.toggle('motion-off',isReduced);
    document.body.classList.toggle('motion-active',!isReduced);
    $('.motion-toggle').setAttribute('aria-pressed',String(!isReduced));
    $('.motion-toggle').textContent=isReduced?'Ativar experiência':'Reduzir movimento';
    if(isReduced||!window.gsap||!window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    context=gsap.context(()=>{
      const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:story,start:'top top',end:'bottom bottom',pin:stage,scrub:.65,invalidateOnRefresh:true,onEnter:loadFrames}});
      tl.to(playhead,{frame:frameCount-1,duration:1,onUpdate:renderFrame},0)
        .to('.story-copy:not(.story-copy-next)',{opacity:0,y:-30,duration:.15},.37)
        .to('.story-copy-next',{opacity:1,y:0,duration:.2},.54)
        .to('.story-progress i',{scaleX:1,duration:1},0);
    });
  }
  configureStory();
  $('.motion-toggle').addEventListener('click',()=>{manualReduced=!document.body.classList.contains('motion-off');configureStory();if(!manualReduced)loadFrames();requestAnimationFrame(()=>story.scrollIntoView({behavior:'instant',block:'start'}));});
  reduced.addEventListener('change',configureStory);
  document.fonts.ready.then(()=>window.ScrollTrigger?.refresh());
  addEventListener('resize',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>window.ScrollTrigger?.refresh(),150);},{passive:true});
  const tabs=[...document.querySelectorAll('[role=tab]')];
  function selectTab(tab,focus=false){
    tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});
    $('.service-world').dataset.world=tab.dataset.service;
    if(focus)tab.focus();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();selectTab(tabs[n],true);}});
  });
  document.querySelectorAll('[data-pick]').forEach(a=>a.addEventListener('click',()=>{$('select[name=servico]').value=a.dataset.pick;}));
  const dialog=$('#summary-dialog');let summary='';
  $('#quote-form').addEventListener('submit',e=>{
    e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
    const d=Object.fromEntries(new FormData(form));
    summary=`Olá, Help! Gostaria de consultar um serviço.\n\nServiço: ${d.servico}\nPeça ou veículo: ${d.peca.trim()}\nQuantidade: ${d.quantidade}\n${d.tamanho.trim()?`Detalhes: ${d.tamanho.trim()}\n`:''}Local: ${d.bairro.trim()}, ${d.cidade.trim()}${d.observacao.trim()?`\nObservação: ${d.observacao.trim()}`:''}\n\nPosso enviar fotos para avaliação?`;
    $('#quote-summary').textContent=summary;$('#copy-status').textContent='';dialog.showModal();
  });
  $('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
  $('.copy-summary').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary);$('#copy-status').textContent='Resumo copiado. Nenhuma mensagem foi enviada.';}catch{$('#copy-status').textContent='Selecione o resumo acima para copiar.';}});
})();
