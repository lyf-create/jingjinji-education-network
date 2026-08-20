/* Fix search-to-detail targeting and graph focus behavior. */
const CollaborationNetworkSearchFix=(function(){
  const isAggregateNode=name=>/\d+(?:[多余]+)?(?:所|家|名|个|项|校|院)/.test(String(name||''));
  const yearOf=e=>{const v=e.year||e.date;const m=String(v||'').match(/(20\d{2})/);return m?m[1]:''};

  function init(root,data,app){
    if(!root||!data||!app||typeof app.openNodeDetail!=='function')return;

    const searchInput=root.querySelector('.collab-network__search');
    const searchButton=root.querySelector('.collab-network__search-btn');
    if(!searchInput||!searchButton)return;

    const originalInputHandler=searchInput.oninput;

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

    function eligibleEdges(){
      const ids=currentAllowedEventIds();
      const minInput=root.querySelector('[data-min]');
      const minEvents=minInput?Number(minInput.value||2):2;
      return (data.edges||[]).map(e=>({
        source:e.source,
        target:e.target,
        event_ids:[...new Set(e.event_ids||[])].filter(id=>ids.has(id))
      })).filter(e=>e.event_ids.length>=minEvents);
    }

    function searchableNodes(){
      const edges=eligibleEdges();
      const connectedIds=new Set(edges.flatMap(e=>[e.source,e.target]));
      const regionSelect=root.querySelector('[data-region]');
      const typeSelect=root.querySelector('[data-type]');
      const selectedRegion=regionSelect?regionSelect.value:'全部';
      const selectedType=typeSelect?typeSelect.value:'全部';
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
      if(hint&&count>1)hint.textContent='🔍 搜索 "'+keyword+'" · 找到 '+count+' 个名称匹配，请输入更完整名称';
    }

    function renderTargetNetwork(target){
      if(typeof originalInputHandler!=='function')return;
      const originalEdges=data.edges;
      data.edges=(originalEdges||[]).filter(e=>e.source===target.id||e.target===target.id);
      originalInputHandler.call(searchInput,{target:searchInput});
      data.edges=originalEdges;
    }

    function executeFixedSearch(){
      const keyword=searchInput.value.trim();
      if(!keyword)return;
      const result=findTarget(keyword);
      if(result.target){
        renderTargetNetwork(result.target);
        app.openNodeDetail(result.target.id);
      }else{
        showAmbiguousHint(keyword,result.matches.length);
      }
    }

    searchInput.oninput=e=>{
      if(!e.target.value.trim()&&typeof originalInputHandler==='function'){
        originalInputHandler.call(searchInput,e);
      }
    };
    searchButton.onclick=executeFixedSearch;
    searchInput.onkeydown=e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        executeFixedSearch();
      }
    };
  }

  return {init};
})();
