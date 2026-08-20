/* Fix search-to-detail targeting without changing the existing network renderer. */
const CollaborationNetworkSearchFix=(function(){
  const isAggregateNode=name=>/\d+(?:[多余]+)?(?:所|家|名|个|项|校|院)/.test(String(name||''));
  const yearOf=e=>{const v=e.year||e.date;const m=String(v||'').match(/(20\d{2})/);return m?m[1]:''};

  function init(root,data,app){
    if(!root||!data||!app||typeof app.openNodeDetail!=='function')return;

    const searchInput=root.querySelector('.collab-network__search');
    const searchButton=root.querySelector('.collab-network__search-btn');
    if(!searchInput||!searchButton)return;

    const eventMap=new Map((data.events||[]).map(e=>[e.event_id,e]));

    function currentAllowedEventIds(){
      const yearSelect=root.querySelector('.collab-network__select');
      const domainSelect=root.querySelector('[data-domain]');
      const selectedYear=yearSelect?yearSelect.value:'ALL';
      const selectedDomain=domainSelect?domainSelect.value:'全部';

      return new Set((data.events||[]).filter(e=>{
        if(selectedYear!=='ALL'&&yearOf(e)!==selectedYear)return false;
        if(selectedDomain!=='全部'&&!((e.domains||[]).includes(selectedDomain)))return false;
        return true;
      }).map(e=>e.event_id));
    }

    function searchableNodes(){
      const ids=currentAllowedEventIds();
      const regionSelect=root.querySelector('[data-region]');
      const typeSelect=root.querySelector('[data-type]');
      const minInput=root.querySelector('[data-min]');
      const selectedRegion=regionSelect?regionSelect.value:'全部';
      const selectedType=typeSelect?typeSelect.value:'全部';
      const minEvents=minInput?Number(minInput.value||2):2;

      const edges=(data.edges||[]).map(e=>({
        source:e.source,
        target:e.target,
        event_ids:[...new Set(e.event_ids||[])].filter(id=>ids.has(id))
      })).filter(e=>e.event_ids.length>=minEvents);

      const connectedIds=new Set(edges.flatMap(e=>[e.source,e.target]));

      return (data.nodes||[]).filter(n=>
        connectedIds.has(n.id)&&
        !isAggregateNode(n.name)&&
        (selectedRegion==='全部'||n.region===selectedRegion)&&
        (selectedType==='全部'||n.type===selectedType)
      );
    }

    function findTarget(keyword){
      const q=String(keyword||'').trim();
      if(!q)return {target:null,matches:[]};

      const nodes=searchableNodes();
      const exact=nodes.find(n=>String(n.name||'').trim()===q);
      if(exact)return {target:exact,matches:[exact]};

      const matches=nodes.filter(n=>String(n.name||'').includes(q));
      return {target:matches.length===1?matches[0]:null,matches};
    }

    function showAmbiguousHint(keyword,count){
      const hint=root.querySelector('.collab-network__search-hint');
      if(hint&&count>1){
        hint.textContent='🔍 搜索 "'+keyword+'" · 找到 '+count+' 个名称匹配，请输入更完整名称';
      }
    }

    function executeFixedSearch(event){
      const keyword=searchInput.value.trim();
      if(!keyword)return;

      if(event){
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      const result=findTarget(keyword);
      if(result.target){
        app.openNodeDetail(result.target.id);
      }else{
        showAmbiguousHint(keyword,result.matches.length);
      }
    }

    root.addEventListener('click',e=>{
      if(e.target===searchButton)executeFixedSearch(e);
    },true);

    root.addEventListener('keydown',e=>{
      if(e.target===searchInput&&e.key==='Enter')executeFixedSearch(e);
    },true);
  }

  return {init};
})();
