const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const G=require('../story.js');
function harness(reduced=false){
 let s=G.reduce(G.fresh(),{type:'START'});s.relations.alex.chapter=4;s.relations.alex.meetingDay=1;s=G.reduce(s,{type:'OPEN',id:'alex'});
 let listener,timer,stored=JSON.stringify(s),nextId=0;
 const app={innerHTML:'',addEventListener(type,fn){if(type==='click')listener=fn;},querySelector(){return {focus(){}};}};
 const modal={innerHTML:'',showModal(){},close(){},scrollTop:0,scrollHeight:100};
 const context=vm.createContext({window:{BTF:G,scrollTo(){}},document:{querySelector(sel){return sel==='#app'?app:modal;},body:{dataset:{}},addEventListener(){}},localStorage:{getItem(){return stored;},setItem(k,v){stored=v;}},matchMedia(){return {matches:reduced};},setTimeout(fn){timer=fn;return ++nextId;},clearTimeout(){timer=null;},console});
 vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),context);
 return {click(action){listener({target:{closest(){return {dataset:{action}};}}});},get state(){return JSON.parse(stored);},get html(){return app.innerHTML;},get timer(){return timer;}};
}
let h=harness();h.click('walk');assert.match(h.html,/meeting-scene walking/);assert.equal(h.state.relations.alex.revealed,false);h.timer();assert.equal(h.state.phase,'chat');assert.equal(h.state.relations.alex.revealed,true);assert.match(h.html,/meeting-person/);assert.equal(h.timer,null);
h=harness();h.click('walk');h.click('skip');assert.equal(h.state.phase,'chat');assert.equal(h.timer,null);
h=harness();h.click('walk');h.click('home');assert.equal(h.timer,null);assert.equal(h.state.phase,'arrival');h.click('resume');assert.match(h.html,/Walk over/);
h=harness(true);h.click('walk');assert.equal(h.state.phase,'chat');assert.equal(h.timer,undefined);
console.log('Passed: meeting animation completion, skip, cancellation, resume, and reduced motion.');
