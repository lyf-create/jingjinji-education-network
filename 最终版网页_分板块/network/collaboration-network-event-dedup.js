/* Event-level deduplication for the collaboration network.
 * The raw JSON is left untouched. Duplicate media reports are merged in memory
 * before the network module calculates node counts and edge weights.
 */
const CollaborationNetworkEventDedup=(function(){
  function normalizeTitle(value){
    return String(value||'')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\u3000]+/g,'')
      .replace(/[，。、“”‘’：；！？,.!?:;()（）【】\[\]《》<>·—–\-_/\\|]/g,'');
  }

  function shingles(text,size){
    const s=normalizeTitle(text);
    const out=new Set();
    if(!s)return out;
    if(s.length<=size){out.add(s);return out;}
    for(let i=0;i<=s.length-size;i++)out.add(s.slice(i,i+size));
    return out;
  }

  function dice(a,b){
    if(!a.size&&!b.size)return 1;
    if(!a.size||!b.size)return 0;
    let hit=0;
    a.forEach(x=>{if(b.has(x))hit++});
    return (2*hit)/(a.size+b.size);
  }

  function titleSimilarity(a,b){
    const a2=shingles(a,2),b2=shingles(b,2);
    const a3=shingles(a,3),b3=shingles(b,3);
    return dice(a2,b2)*0.65+dice(a3,b3)*0.35;
  }

  function setOverlapRatio(a,b){
    const A=new Set(a||[]),B=new Set(b||[]);
    if(!A.size||!B.size)return 0;
    let hit=0;A.forEach(x=>{if(B.has(x))hit++});
    return hit/Math.min(A.size,B.size);
  }

  function sameEvent(a,b){
    if(String(a.date||'')!==String(b.date||''))return false;
    const ta=normalizeTitle(a.title),tb=normalizeTitle(b.title);
    if(!ta||!tb)return false;

    if(ta===tb)return true;

    const sim=titleSimilarity(ta,tb);
    const minLen=Math.min(ta.length,tb.length),maxLen=Math.max(ta.length,tb.length);
    const containment=(ta.includes(tb)||tb.includes(ta))&&minLen/Math.max(1,maxLen)>=0.68;
    const subjectOverlap=setOverlapRatio(a.subjects,b.subjects);

    // Very similar titles on the same date are sufficient by themselves.
    if(sim>=0.86)return true;
    // Slightly looser title match requires clear participant overlap.
    if(sim>=0.76&&subjectOverlap>=0.35)return true;
    // One title may be a shortened rewrite of the other.
    if(containment&&subjectOverlap>=0.25)return true;
    return false;
  }

  function unionFind(n){
    const parent=Array.from({length:n},(_,i)=>i);
    function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x]}return x}
    function unite(a,b){a=find(a);b=find(b);if(a!==b)parent[b]=a}
    return {find,unite};
  }

  function uniq(values){return [...new Set((values||[]).filter(v=>v!=null&&v!==''))]}

  function chooseCanonical(group){
    return group.slice().sort((a,b)=>{
      const bodyDiff=(Number(b.body_length)||0)-(Number(a.body_length)||0);
      if(bodyDiff)return bodyDiff;
      const urlDiff=Number(Boolean(b.url))-Number(Boolean(a.url));
      if(urlDiff)return urlDiff;
      return String(b.title||'').length-String(a.title||'').length;
    })[0];
  }

  function mergeGroup(group){
    const base=Object.assign({},chooseCanonical(group));
    const ids=uniq(group.map(e=>e.event_id));
    const sources=uniq(group.map(e=>e.source));
    const urls=uniq(group.map(e=>e.url));
    const subjects=uniq(group.flatMap(e=>e.subjects||[]));
    const domains=uniq(group.flatMap(e=>e.domains||[]));
    const excerpts=group.map(e=>String(e.body_excerpt||'')).sort((a,b)=>b.length-a.length);

    base.merged_event_ids=ids;
    base.source=sources.join('、')||base.source;
    base.sources=sources;
    base.urls=urls;
    base.subjects=subjects;
    base.domains=domains;
    if(excerpts[0])base.body_excerpt=excerpts[0];
    base.body_length=Math.max(...group.map(e=>Number(e.body_length)||0));
    return base;
  }

  function apply(input){
    if(!input||!Array.isArray(input.events))return input;

    const data=input;
    const events=data.events;
    const byDate=new Map();
    events.forEach((event,index)=>{
      const key=String(event.date||event.year||'');
      if(!byDate.has(key))byDate.set(key,[]);
      byDate.get(key).push(index);
    });

    const uf=unionFind(events.length);
    byDate.forEach(indexes=>{
      for(let i=0;i<indexes.length;i++){
        for(let j=i+1;j<indexes.length;j++){
          const a=indexes[i],b=indexes[j];
          if(sameEvent(events[a],events[b]))uf.unite(a,b);
        }
      }
    });

    const groups=new Map();
    events.forEach((event,index)=>{
      const root=uf.find(index);
      if(!groups.has(root))groups.set(root,[]);
      groups.get(root).push(event);
    });

    const idMap=new Map();
    const mergedEvents=[];
    const duplicateGroups=[];
    groups.forEach(group=>{
      const merged=mergeGroup(group);
      mergedEvents.push(merged);
      group.forEach(event=>idMap.set(event.event_id,merged.event_id));
      if(group.length>1){
        duplicateGroups.push({
          canonical_event_id:merged.event_id,
          merged_event_ids:group.map(e=>e.event_id),
          date:merged.date,
          titles:uniq(group.map(e=>e.title)),
          sources:uniq(group.map(e=>e.source))
        });
      }
    });

    function remapIds(ids){
      return uniq((ids||[]).map(id=>idMap.get(id)||id));
    }

    data.events=mergedEvents;
    (data.nodes||[]).forEach(node=>{
      node.event_ids=remapIds(node.event_ids);
      node.event_count=node.event_ids.length;
    });
    (data.edges||[]).forEach(edge=>{
      edge.event_ids=remapIds(edge.event_ids);
      edge.weight=edge.event_ids.length;
    });

    data.meta=Object.assign({},data.meta,{
      event_level_dedup_before:events.length,
      event_level_dedup_after:mergedEvents.length,
      event_level_merged_reports:events.length-mergedEvents.length,
      event_level_duplicate_groups:duplicateGroups
    });

    console.info('[network dedup]',events.length,'reports ->',mergedEvents.length,'events; merged',events.length-mergedEvents.length,'duplicate reports');
    return data;
  }

  return {apply,normalizeTitle,titleSimilarity,sameEvent};
})();
