/* Detail partner list fix.
 * The main network may keep using the "minimum collaboration events" threshold,
 * while the full-screen institution detail always lists every real partner in the
 * selected year/domain, including relationships with only one shared event.
 */
const CollaborationNetworkDetailPartnersFix=(function(){
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uniq=values=>[...new Set((values||[]).filter(Boolean))];
  function yearOf(e){const m=String(e.year||e.date||'').match(/(20\d{2})/);return m?m[1]:''}

  function init(root,data){
    if(!root||!data)return;
    const container=root.closest('.module-root')||root.parentElement||document;
    const overlay=container.querySelector('.collab-network__detail-overlay')||document.querySelector('.collab-network__detail-overlay');
    if(!overlay)return;

    const byId=new Map((data.nodes||[]).map(n=>[n.id,n]));
    const byName=new Map((data.nodes||[]).map(n=>[String(n.name||'').trim(),n]));
    const eventMap=new Map((data.events||[]).map(e=>[e.event_id,e]));
    let patching=false;

    function selectedEventIds(){
      const yearSel=root.querySelector('.collab-network__select');
      const domainSel=root.querySelector('[data-domain]');
      const year=yearSel?yearSel.value:'ALL';
      const domain=domainSel?domainSel.value:'全部';
      return new Set((data.events||[]).filter(e=>
        (year==='ALL'||yearOf(e)===year) &&
        (domain==='全部'||(e.domains||[]).includes(domain))
      ).map(e=>e.event_id));
    }

    function allPartners(nodeId){
      const allowed=selectedEventIds();
      return (data.edges||[]).filter(e=>e.source===nodeId||e.target===nodeId).map(e=>{
        const ids=uniq(e.event_ids||[]).filter(id=>allowed.has(id));
        return {id:e.source===nodeId?e.target:e.source,eventIds:ids,count:ids.length};
      }).filter(p=>p.count>0 && byId.has(p.id)).sort((a,b)=>
        b.count-a.count || String(byId.get(a.id).name||'').localeCompare(String(byId.get(b.id).name||''),'zh-CN')
      );
    }

    function nodeEvents(nodeId){
      const allowed=selectedEventIds();
      const node=byId.get(nodeId);
      return uniq(node&&node.event_ids||[]).filter(id=>allowed.has(id)).map(id=>eventMap.get(id)).filter(Boolean)
        .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    }

    function eventHtml(e){
      const title=esc(e.title||'未命名事件');
      const link=e.url?`<a class="collab-network__event-title" href="${esc(e.url)}" target="_blank" rel="noopener">${title}</a>`:`<span class="collab-network__event-title">${title}</span>`;
      return `<article class="collab-network__event">${link}<p class="collab-network__event-info">${esc(e.date||'日期未标明')} · ${esc((e.domains||[]).join('、')||'领域未标明')}</p><p class="collab-network__event-subjects">${esc((e.subjects||[]).join('、')||'参与主体未标明')}</p></article>`;
    }

    function patchDetail(){
      if(patching||!overlay.classList.contains('is-open'))return;
      const titleEl=overlay.querySelector('.collab-network__detail-title');
      const listEl=overlay.querySelector('[data-partners]');
      const eventsEl=overlay.querySelector('[data-events]');
      if(!titleEl||!listEl||!eventsEl)return;

      const name=String(titleEl.textContent||'').split(' · ')[0].trim();
      const node=byName.get(name);
      if(!node)return;
      const partners=allPartners(node.id);
      const events=nodeEvents(node.id);

      patching=true;
      listEl.innerHTML=partners.length?partners.map(p=>
        `<button class="collab-network__partner" data-all-partner="${esc(p.id)}"><span class="collab-network__partner-name">${esc(byId.get(p.id).name)}</span><strong class="collab-network__partner-count">${p.count} 次</strong></button>`
      ).join(''):'<p class="collab-network__no-data">当前年份暂无合作记录</p>';

      function showEvents(partnerId){
        let shown=events;
        let note='';
        if(partnerId){
          const p=partners.find(x=>x.id===partnerId);
          shown=events.filter(e=>p&&p.eventIds.includes(e.event_id));
          note='<div class="collab-network__events-note"><span>仅显示双方共同事件</span><button type="button" class="collab-network__restore" data-all-restore>查看全部相关事件</button></div>';
        }
        eventsEl.innerHTML=note+(shown.length?shown.map(eventHtml).join(''):'<p class="collab-network__no-data">暂无相关事件</p>');
        const restore=eventsEl.querySelector('[data-all-restore]');
        if(restore)restore.onclick=()=>{
          listEl.querySelectorAll('[data-all-partner]').forEach(x=>x.classList.remove('is-selected'));
          showEvents(null);
        };
      }

      listEl.querySelectorAll('[data-all-partner]').forEach(btn=>{
        btn.onclick=()=>{
          listEl.querySelectorAll('[data-all-partner]').forEach(x=>x.classList.toggle('is-selected',x===btn));
          showEvents(btn.dataset.allPartner);
        };
      });
      showEvents(null);
      patching=false;
    }

    const observer=new MutationObserver(()=>requestAnimationFrame(patchDetail));
    observer.observe(overlay,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-hidden']});
    overlay.addEventListener('click',()=>setTimeout(patchDetail,0));
    return {refresh:patchDetail,destroy:()=>observer.disconnect()};
  }

  return {init};
})();
