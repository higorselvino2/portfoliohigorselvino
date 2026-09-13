const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('[data-view]')];
const crumb = document.querySelector('#crumb');
const sidebar = document.querySelector('.sidebar');
const menuButton = document.querySelector('.mobile-menu');
const dialog = document.querySelector('#approvalDialog');
const toast = document.querySelector('#toast');
let approved = false;
let openComments = 3;

function requestedView() {
  const hashView = window.location.hash.slice(1);
  if (hashView && !hashView.startsWith('figmacapture=')) return hashView;
  const queryView = new URLSearchParams(window.location.search).get('view');
  return queryView || 'dashboard';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function navigate(viewName, updateHash = true) {
  const next = document.querySelector(`#view-${viewName}`) || document.querySelector('#view-dashboard');
  const resolvedView = next.id.replace('view-', '');
  views.forEach(view => view.classList.toggle('is-active', view === next));
  navItems.forEach(item => {
    const active = item.dataset.view === resolvedView;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  document.body.dataset.view = resolvedView;
  crumb.textContent = next.dataset.title;
  document.title = `${next.dataset.title} · Revision Room`;
  if (updateHash) history.replaceState(null, '', `#${resolvedView}`);
  sidebar.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.querySelector('#main').focus?.({preventScroll:true});
  window.scrollTo({top:0, behavior:'smooth'});
  return resolvedView;
}

navItems.forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
document.querySelectorAll('[data-go]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.go)));
menuButton.addEventListener('click', () => {
  const open = sidebar.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.pin').forEach(pin => pin.addEventListener('click', () => {
  document.querySelectorAll('.pin').forEach(p => p.classList.toggle('is-active', p === pin));
  document.querySelectorAll('.comment-card').forEach(card => card.classList.toggle('is-active', card.dataset.card === pin.dataset.comment));
  document.querySelector(`[data-card="${pin.dataset.comment}"]`)?.scrollIntoView({behavior:'smooth', block:'center'});
}));

document.querySelectorAll('[data-resolve]').forEach(button => button.addEventListener('click', () => {
  const card = document.querySelector(`[data-card="${button.dataset.resolve}"]`);
  if (!card || card.classList.contains('is-resolved')) return;
  card.classList.add('is-resolved');
  button.textContent = 'Resolved';
  openComments = Math.max(0, openComments - 1);
  document.querySelector('.comments-head h2').textContent = `${openComments} open comment${openComments === 1 ? '' : 's'}`;
  document.querySelector('#openCount').textContent = `${openComments} comment${openComments === 1 ? '' : 's'}`;
  showToast(`Comment ${button.dataset.resolve} resolved`);
}));

document.querySelector('#commentForm').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#commentInput');
  const value = input.value.trim();
  if (!value) { input.focus(); showToast('Write a comment first'); return; }
  const id = String(document.querySelectorAll('.comment-card').length + 1);
  const article = document.createElement('article');
  article.className = 'comment-card is-active';
  article.dataset.card = id;
  article.innerHTML = `<div class="comment-meta"><span class="avatar">HS</span><div><strong>Higor Selvino</strong><small>Creator · now</small></div><span class="comment-number">0${id}</span></div><p></p><div class="comment-actions"><button type="button">Mark resolved</button><button type="button">Reply</button></div>`;
  article.querySelector('p').textContent = value;
  document.querySelectorAll('.comment-card').forEach(c => c.classList.remove('is-active'));
  document.querySelector('.comment-list').append(article);
  openComments += 1;
  document.querySelector('.comments-head h2').textContent = `${openComments} open comments`;
  document.querySelector('#openCount').textContent = `${openComments} comments`;
  input.value = '';
  showToast('Comment added to Version 03');
});

function openApproval() {
  if (approved) { navigate('delivery'); showToast('Version 03 is already approved'); return; }
  document.querySelector('#approvalCheck').checked = false;
  dialog.showModal();
}
function applyApprovalState() {
  approved = true;
  document.querySelector('#deliveryStatus').className = 'badge approved';
  document.querySelector('#deliveryStatus').textContent = 'Approved';
  document.querySelector('#approvalHeading').textContent = 'Version 03 approved';
  document.querySelector('#approvalCopy').textContent = 'Approved by Sofia M. today. The decision record remains tied to Version 03.';
  const delivery = document.querySelector('#deliveryPanel');
  delivery.setAttribute('aria-disabled', 'false');
  delivery.classList.add('is-unlocked');
  delivery.querySelector('.lock-label').textContent = 'Available';
  delivery.querySelectorAll('button').forEach(button => { button.disabled = false; button.textContent = 'Download'; });
}
document.querySelectorAll('[data-open-approval]').forEach(button => button.addEventListener('click', openApproval));
document.querySelector('#requestApproval').addEventListener('click', () => { navigate('delivery'); showToast('Approval request sent to Sofia'); });

document.querySelector('#approvalForm').addEventListener('submit', event => {
  const submitter = event.submitter?.value;
  if (submitter !== 'approve') return;
  if (!document.querySelector('#approvalCheck').checked) {
    event.preventDefault();
    document.querySelector('#approvalCheck').focus();
    showToast('Confirm the reviewed version first');
    return;
  }
  applyApprovalState();
  window.setTimeout(() => { navigate('delivery'); showToast('Version 03 approved · delivery unlocked'); }, 20);
});

document.querySelectorAll('[data-open-new]').forEach(button => button.addEventListener('click', () => showToast('New-project flow is outside this prototype')));
window.addEventListener('hashchange', () => navigate(requestedView(), false));
navigate(requestedView(), false);
if (new URLSearchParams(window.location.search).get('approved') === '1') applyApprovalState();

const comparisonRange = document.querySelector('#comparisonRange');
const comparisonCanvas = document.querySelector('#comparisonCanvas');
if (comparisonRange && comparisonCanvas) {
  const updateComparison = () => {
    const value = Number(comparisonRange.value);
    comparisonCanvas.style.setProperty('--split', `${value}%`);
    comparisonRange.setAttribute('aria-valuetext', `${value}% of Version 03 revealed`);
  };
  comparisonRange.addEventListener('input', updateComparison);
  updateComparison();
}

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = tool => Promise.resolve(context.registerTool(tool)).catch(() => {});
  register({
    name:'read_project_status', title:'Read project status',
    description:'Read the visible Revision Room prototype status for Spring Arts Festival.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:() => ({project:'Spring Arts Festival',currentVersion:'V03',openComments,approved,currentView:location.hash.slice(1)||'dashboard'})
  });
  register({
    name:'navigate_to_view', title:'Navigate prototype',
    description:'Navigate the visible prototype to dashboard, review, compare, delivery, evidence, or the UI system.',
    inputSchema:{type:'object',properties:{view:{type:'string',enum:['dashboard','review','compare','delivery','evidence','system']}},required:['view'],additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:input => { const allowed=['dashboard','review','compare','delivery','evidence','system']; if(!allowed.includes(input?.view)) throw new Error('view must be one of: dashboard, review, compare, delivery, evidence, system'); navigate(input.view); return {currentView:input.view}; }
  });
  register({
    name:'add_review_comment', title:'Add review comment',
    description:'Add a visible contextual comment to Version 03 in the prototype.',
    inputSchema:{type:'object',properties:{comment:{type:'string',minLength:1,maxLength:280}},required:['comment'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:true},
    execute:input => { const comment=String(input?.comment||'').trim(); if(!comment) throw new Error('comment is required'); if(comment.length>280) throw new Error('comment must be 280 characters or fewer'); navigate('review'); const field=document.querySelector('#commentInput'); field.value=comment; document.querySelector('#commentForm').requestSubmit(); return {status:'added',version:'V03',openComments}; }
  });
  register({
    name:'approve_current_version', title:'Approve current version',
    description:'Approve Version 03 and unlock the visible final-delivery panel.',
    inputSchema:{type:'object',properties:{confirmed:{type:'boolean'}},required:['confirmed'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:input => { if(input?.confirmed!==true) throw new Error('confirmed must be true'); applyApprovalState(); navigate('delivery'); return {status:'approved',version:'V03',deliveryUnlocked:true}; }
  });
}
registerWebMCP();
