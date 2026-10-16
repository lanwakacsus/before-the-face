const assert=require('node:assert/strict');
const G=require('../story.js');
const newGame=()=>G.reduce(G.fresh(),{type:'START'});
function ready(s,id){for(let i=0;i<200;i++){if(s.phase==='recap')s=G.reduce(s,{type:'KEEP_PLAYING'});if(G.available(s,id).ok)return s;const a=G.available(s,id);if(a.reschedule&&G.relation(s,id).meetingDay<s.day)s=G.reduce(s,{type:'RESCHEDULE',id});else s=G.reduce(s,{type:'REST'});}throw Error('Cannot reach '+id);}
function runChat(s,id,answers=[0,0,0,0]){s=ready(s,id);const day=s.day,slot=s.slot;s=G.reduce(s,{type:'OPEN',id});if(s.phase==='arrival'){assert.equal(G.relation(s).revealed,false);s=G.reduce(s,{type:'ARRIVE'});}for(const index of answers){assert.equal(s.phase,'chat');s=G.reduce(s,{type:'ANSWER',index});assert.equal(s.day,day);assert.equal(s.slot,slot);assert.deepEqual(G.restore(JSON.stringify(s)),s);}assert.equal(s.phase,'wrap');return G.reduce(s,{type:'CLOSE_CHAT'});}
let optionChecks=0;
for(const id of Object.keys(G.people)){
 let s=newGame();
 for(let chapter=0;chapter<5;chapter++){
  s=ready(s,id);s=G.reduce(s,{type:'OPEN',id});
  if(chapter<4)assert.equal(G.reduce(s,{type:'ARRIVE'}).relations[id].revealed,false);
  else {assert.equal(s.phase,'arrival');s=G.reduce(s,{type:'ARRIVE'});}
  for(let turn=0;turn<4;turn++){
   assert.equal(G.options(s).length,5);assert.equal(new Set(G.options(s).map(c=>c.say)).size,5,'Distinct options');assert.ok(G.prompt(s));
   for(let index=0;index<5;index++){
    const next=G.reduce(s,{type:'ANSWER',index});assert.equal(next.transcript.filter(m=>m.who==='you').at(-1).text,G.options(s)[index].say);assert.equal(next.day,s.day);assert.equal(next.slot,s.slot);assert.equal(next.turn,s.turn+1);assert.deepEqual(G.restore(JSON.stringify(next)),next);assert.ok(next.transcript.every(m=>typeof m.text==='string'&&m.text.length>0));optionChecks++;
   }
   s=G.reduce(s,{type:'ANSWER',index:0});
  }
  s=G.reduce(s,{type:'CLOSE_CHAT'});assert.equal(G.relation(s,id).chapter,chapter+1);assert.ok(G.relation(s,id).history.at(-1).messages.length>=13);
 }
 assert.equal(G.relation(s,id).revealed,true);assert.equal(G.relation(s,id).history.length,5);
}
// Several connections can develop in the same day without exclusive selection.
let s=newGame();s=runChat(s,'alex');assert.equal(s.day,1);assert.equal(s.slot,1);assert.equal(G.available(s,'alex').ok,false);s=runChat(s,'ben');assert.equal(s.day,2);assert.equal(s.exclusive,null);assert.equal(s.relations.alex.chapter,1);assert.equal(s.relations.ben.chapter,1);
// A skipped coffee has a bounded consequence; rearranging remains possible.
s=newGame();for(let i=0;i<4;i++)s=runChat(s,'maya');const booked=s.relations.maya.meetingDay;while(s.day<booked)s=G.reduce(s,{type:'REST'});assert.equal(G.available(s,'maya').ok,true);const trust=s.relations.maya.trust;s=G.reduce(s,{type:'REST'});assert.equal(s.relations.maya.trust,trust-1);s=G.reduce(s,{type:'REST'});assert.equal(s.relations.maya.trust,trust-1);assert.equal(G.available(s,'maya').reschedule,true);s=G.reduce(s,{type:'RESCHEDULE',id:'maya'});assert.ok(s.relations.maya.meetingDay>s.day);
// Rearranging in advance genuinely changes the date without treating it as a no-show.
let advance=newGame();for(let i=0;i<4;i++)advance=runChat(advance,'sam');const previous=advance.relations.sam.meetingDay,beforeTrust=advance.relations.sam.trust;advance=G.reduce(advance,{type:'RESCHEDULE',id:'sam'});assert.ok(advance.relations.sam.meetingDay>previous);assert.equal(advance.relations.sam.trust,beforeTrust);
// Incompatibility doesn't become romance just by choosing a flattering last reply.
s=newGame();s=runChat(s,'morgan');s=runChat(s,'morgan');s=runChat(s,'morgan',[0,2,0,0]);assert.equal(s.relations.morgan.path,'friends');s=runChat(s,'morgan');s=ready(s,'morgan');s=G.reduce(s,{type:'OPEN',id:'morgan'});s=G.reduce(s,{type:'ARRIVE'});for(let i=0;i<3;i++)s=G.reduce(s,{type:'ANSWER',index:0});assert.match(G.options(s)[0].say,/friends/);s=G.reduce(s,{type:'ANSWER',index:0});s=G.reduce(s,{type:'CLOSE_CHAT'});assert.equal(s.relations.morgan.path,'friends');
// A character can decline even after a romantic invitation; warmth is not a guarantee.
s=newGame();for(let i=0;i<4;i++)s=runChat(s,'alex');s=ready(s,'alex');s=G.reduce(s,{type:'OPEN',id:'alex'});s=G.reduce(s,{type:'ARRIVE'});for(let i=0;i<3;i++)s=G.reduce(s,{type:'ANSWER',index:0});s.relations.alex.trust=-4;s=G.reduce(s,{type:'ANSWER',index:0});assert.match(s.transcript.at(-1).text,/don’t think another date/);
// Explicit commitment required, unavailable early; later keeps friendships available.
s=newGame();assert.equal(G.reduce(s,{type:'EXCLUSIVE',id:'alex'}).exclusive,null);for(let i=0;i<5;i++)s=runChat(s,'alex',[i===0?4:0,0,0,0]);s.relations.alex.interest=5;s=G.reduce(s,{type:'EXCLUSIVE',id:'alex'});assert.equal(s.exclusive,'alex');s=ready(s,'ben');s=G.reduce(s,{type:'OPEN',id:'ben'});assert.ok(G.options(s).every(c=>!c.interest));
// Ending one conversation never ends anyone else's route.
s=newGame();s=G.reduce(s,{type:'OPEN',id:'sam'});s=G.reduce(s,{type:'LEAVE'});assert.equal(s.relations.sam.status,'closed');assert.equal(s.relations.alex.status,'open');
// Month summary doesn't erase progress or block unfinished content.
s=newGame();for(let i=0;i<56;i++)s=G.reduce(s,{type:'REST'});assert.equal(s.phase,'recap');s=G.reduce(s,{type:'KEEP_PLAYING'});assert.equal(s.phase,'calendar');assert.equal(s.day,29);
// Save validation and invalid events.
for(const raw of [null,'bad','{}',JSON.stringify({...G.fresh(),phase:'chat',active:'bad'})])assert.equal(G.restore(raw).phase,'intro');
s=newGame();s=G.reduce(s,{type:'OPEN',id:'alex'});assert.equal(G.reduce(s,{type:'ANSWER',index:9}),s);assert.equal(G.reduce(s,{type:'ANSWER',index:1.2}),s);assert.equal(G.reduce(s,{type:'REST'}),s);
console.log(`Passed ${optionChecks} authored answer checks, 30 full conversations, per-person progress, calendar consequences, friendship boundaries, exclusivity, saves, and month continuation.`);
