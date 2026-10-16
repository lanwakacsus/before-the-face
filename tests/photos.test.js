const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../story.js');
const start=()=>G.reduce(G.fresh(),{type:'START'});
function ready(s,id){while(!G.available(s,id).ok)s=G.reduce(s,{type:'REST'});return G.reduce(s,{type:'OPEN',id});}
const seen=new Set();
for(const id of Object.keys(G.people)){
 let s=start();
 for(let chapter=0;chapter<2;chapter++){
  s=ready(s,id);
  for(let turn=0;turn<4;turn++)s=G.reduce(s,{type:'ANSWER',index:0});
  for(const m of s.transcript.filter(m=>m.photo)){
   assert.equal(m.who,'them');assert.equal(G.photos[m.photo].owner,id);assert.ok(m.text.length>0);assert.ok(G.photos[m.photo].alt.length>10);seen.add(m.photo);
   assert.ok(fs.existsSync(path.join(__dirname,'../assets',m.photo+'.png')));
  }
  assert.equal(s.relations[id].revealed,false,'Photos must not reveal faces');
  assert.deepEqual(G.restore(JSON.stringify(s)),s);
  s=G.reduce(s,{type:'CLOSE_CHAT'});
 }
 assert.equal(s.relations[id].history.flatMap(h=>h.messages).filter(m=>m.photo).length,1,'One deliberate photo moment per character');
 assert.deepEqual(G.restore(JSON.stringify(s)),s);
}
assert.equal(seen.size,6);
// Old saves remain valid; previously completed dialogue is not retroactively rewritten.
let old=ready(start(),'morgan');old=G.reduce(old,{type:'ANSWER',index:0});old.transcript.forEach(m=>delete m.photo);assert.deepEqual(G.restore(JSON.stringify(old)),old);
for(const invalid of ['../../alex','alex','https://example.org/track.png','__proto__',null]){
 const bad=structuredClone(old);bad.transcript[1].photo=invalid;assert.equal(G.restore(JSON.stringify(bad)).phase,'intro');
}
const badSender=structuredClone(old);badSender.transcript[0].photo='morgan-chair';assert.equal(G.restore(JSON.stringify(badSender)).phase,'intro');
console.log('Passed: all six photo moments, captions, local assets, history, reload, legacy saves, hidden faces, and attachment validation.');
