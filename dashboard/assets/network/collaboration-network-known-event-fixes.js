/* Curated corrections for known collaboration events whose participant extraction
 * in the source JSON included unrelated institutions mentioned elsewhere in an article.
 * Corrections are applied in memory after event-level deduplication.
 */
const CollaborationNetworkKnownEventFixes=(function(){
  const TARGET_DATE='2025-04-23';
  const TARGET_TITLE_KEY='京津冀蒙高校商科分联盟';
  const TARGET_PARTICIPANTS=[
    '北京工商大学',
    '首都经济贸易大学',
    '北京物资学院',
    '天津财经大学',
    '天津商业大学',
    '河北经贸大学',
    '北京金融学院',
    '内蒙古财经大学'
  ];
  const REGION_BY_NAME={
    '北京工商大学':'北京',
    '首都经济贸易大学':'北京',
    '北京物资学院':'北京',
    '北京金融学院':'北京',
    '天津财经大学':'天津',
    '天津商业大学':'天津',
    '河北经贸大学':'河北',
    '内蒙古财经大学':'其他'
  };

  const uniq=values=>[...new Set((values||[]).filter(v=>v!=null&&v!==''))];
  const pairKey=(a,b)=>a<b?a+'\u0000'+b:b+'\u0000'+a;

  function apply(data){
    if(!data||!Array.isArray(data.events)||!Array.isArray(data.nodes)||!Array.isArray(data.edges))return data;

    const event=data.events.find(e=>
      String(e.date||'')===TARGET_DATE && String(e.title||'').includes(TARGET_TITLE_KEY)
    ) || data.events.find(e=>String(e.title||'').includes(TARGET_TITLE_KEY));
    if(!event){
      console.warn('[network known-event fix] target event not found:',TARGET_TITLE_KEY);
      return data;
    }

    const eventId=event.event_id;
    event.subjects=TARGET_PARTICIPANTS.slice();
    event.participants=TARGET_PARTICIPANTS.slice();
    event.participant_evidence='北京工商大学、首都经济贸易大学、北京物资学院、天津财经大学、天津商业大学、河北经贸大学、北京金融学院、内蒙古财经大学等40所高校携手成立京津冀蒙高校商科分联盟。';

    // Remove this event from every old node/edge first. This prevents institutions
    // merely mentioned elsewhere in the article from remaining as partners.
    data.nodes.forEach(node=>{
      node.event_ids=uniq((node.event_ids||[]).filter(id=>id!==eventId));
      node.event_count=node.event_ids.length;
    });
    data.edges.forEach(edge=>{
      edge.event_ids=uniq((edge.event_ids||[]).filter(id=>id!==eventId));
      edge.weight=edge.event_ids.length;
      edge.count=edge.event_ids.length;
    });
    data.edges=data.edges.filter(edge=>edge.event_ids.length>0);

    // Reuse existing nodes by institution name. If a correctly named institution
    // was absent because of the original extraction error, create a minimal node.
    const nodeByName=new Map(data.nodes.map(node=>[node.name,node]));
    TARGET_PARTICIPANTS.forEach(name=>{
      let node=nodeByName.get(name);
      if(!node){
        node={id:name,name,region:REGION_BY_NAME[name]||'其他',type:'高校',event_ids:[],event_count:0};
        data.nodes.push(node);
        nodeByName.set(name,node);
      }
      node.event_ids=uniq([...(node.event_ids||[]),eventId]);
      node.event_count=node.event_ids.length;
    });

    // This event is a joint alliance-formation event. Therefore every explicitly
    // named participating university is a partner of every other named participant.
    const edgeByPair=new Map(data.edges.map(edge=>[pairKey(edge.source,edge.target),edge]));
    for(let i=0;i<TARGET_PARTICIPANTS.length;i++){
      for(let j=i+1;j<TARGET_PARTICIPANTS.length;j++){
        const a=nodeByName.get(TARGET_PARTICIPANTS[i]);
        const b=nodeByName.get(TARGET_PARTICIPANTS[j]);
        if(!a||!b)continue;
        const k=pairKey(a.id,b.id);
        let edge=edgeByPair.get(k);
        if(!edge){
          edge={source:a.id,target:b.id,event_ids:[],weight:0,count:0};
          data.edges.push(edge);
          edgeByPair.set(k,edge);
        }
        edge.event_ids=uniq([...(edge.event_ids||[]),eventId]);
        edge.weight=edge.event_ids.length;
        edge.count=edge.event_ids.length;
      }
    }

    data.meta=Object.assign({},data.meta,{
      known_event_participant_fix_20250423:true
    });
    console.info('[network known-event fix]',eventId,'participants corrected:',TARGET_PARTICIPANTS.length);
    return data;
  }

  return {apply};
})();
