(() => {
  'use strict';
  document.querySelector('#feedback-form')?.addEventListener('submit',e=>{e.preventDefault();const text=document.querySelector('#feedback').value.trim()||'Olá, Higor! Vi a proposta da Help Estofados e gostaria de conversar sobre a ideia.';location.href=`mailto:higorselvino0@gmail.com?subject=${encodeURIComponent('Proposta Help Estofados')}&body=${encodeURIComponent(text)}`;});
  const sticky=document.querySelector('.sticky-preview');
  let passedHero=false,decisionVisible=false,filmVisible=false;
  sticky.hidden=true;
  const visibility=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target.classList.contains('proposal-hero'))passedHero=!entry.isIntersecting&&entry.boundingClientRect.top<0;else if(entry.target.classList.contains('decision'))decisionVisible=entry.isIntersecting;else filmVisible=entry.isIntersecting;}sticky.hidden=!passedHero||decisionVisible||filmVisible;});
  visibility.observe(document.querySelector('.proposal-hero'));
  visibility.observe(document.querySelector('.decision'));
  visibility.observe(document.querySelector('.proposal-film'));
})();
