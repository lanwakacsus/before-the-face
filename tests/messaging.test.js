const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),G=require('../story.js');
function harness(initial){
 let s=initial||G.reduce(G.reduce(G.fresh(),{type:'START'}),{type:'OPEN',id:'alex'});
 let stored=JSON.stringify(s),nextId=0,now=0,click,key,closeListener,modalOpen=false;
 const timers=new Map();
 const node=()=>({innerHTML:'',textContent:'',focus(){},querySelectorAll(){return [];},querySelector(){return {insertAdjacentHTML(){},innerHTML:''};},scrollTop:500,scrollHeight:600,clientHeight:300});
 const app={...node(),addEventListener(type,fn){if(type==='click')click=fn;},querySelector(){return node();}};
 const nodes=Object.fromEntries(['.thread-messages','.reply-dock','#conversation-scroll','.contact-presence','#modal-body'].map(x=>[x,node()]));
 const modal={showModal(){modalOpen=true;},close(){modalOpen=false;closeListener?.({target:{id:'modal'}});}};
 const context=vm.createContext({window:{BTF:G,scrollTo(){}},Date:{now:()=>now},document:{querySelector(sel){if(sel==='#app')return app;if(sel==='#modal')return modal;if(sel==='dialog[open]')return modalOpen?modal:null;return nodes[sel];},activeElement:node(),body:{dataset:{}},addEventListener(type,fn){if(type==='keydown')key=fn;if(type==='close')closeListener=fn;}},localStorage:{getItem(){return stored;},setItem(k,v){stored=v;}},matchMedia(){return {matches:false};},setTimeout(fn,delay){timers.set(++nextId,{fn,at:now+delay});return nextId;},clearTimeout(id){timers.delete(id);},console});
 vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),context);
 return {
  click(action,index=0){click({target:{closest(){return {dataset:{action,index:String(index)}};}}});},
  key(value){key({key:value,preventDefault(){}});},
  tick(ms){const until=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>until)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=until;},
  get state(){return JSON.parse(stored);},get html(){return app.innerHTML;},
  get bubbles(){return vm.runInContext('messageMarkup()',context);},get dock(){return vm.runInContext('replyMarkup()',context);},
  get pending(){return timers.size;},get flight(){return vm.runInContext('messageFlight',context);}
 };
}
let h=harness();const initial=h.state,reply=G.resolve(G.options(initial)[0].reply,initial);
h.click('answer');assert.equal(h.state.turn,1);assert.equal(h.state.day,1);assert.equal(h.flight.shown,initial.transcript.length+1);assert.match(h.bubbles,/Delivered/);assert.doesNotMatch(h.bubbles,/typing-indicator/);assert.equal(h.dock.includes('data-action="answer"'),false);
h.click('answer');h.key('2');assert.equal(h.state.turn,1,'rapid inputs must commit once');
h.tick(650);assert.match(h.bubbles,/typing-indicator/);assert.match(h.bubbles,/Read/);assert.equal(h.flight.shown,initial.transcript.length+1);
h.tick(2600);assert.equal(h.flight.shown,initial.transcript.length+2);assert.equal(h.dock.includes('data-action="answer"'),false,'next prompt must finish before choices return');
h.tick(5000);assert.equal(h.flight,null);assert.equal(h.pending,0);assert.equal((h.dock.match(/data-action="answer"/g)||[]).length,5);
// Skip and a late callback cannot duplicate an answer.
h.click('answer',1);const saved=h.state;h.click('skip-messages');h.tick(10000);assert.deepEqual(h.state,saved);assert.equal(h.flight,null);
// Reloading after send restores the committed exchange without resending.
h.click('answer');const restored=harness(h.state);assert.equal(restored.state.turn,3);assert.equal(restored.flight,null);assert.equal(restored.pending,0);
// Pause freezes delivery. Closing either via the button or native dialog event resumes it.
h=harness();h.click('answer');h.tick(200);h.click('pause');assert.equal(h.pending,0);h.tick(10000);assert.equal(h.flight.stage,'sent');h.key('3');assert.equal(h.state.turn,1);h.click('close');h.tick(450);assert.equal(h.flight.stage,'typing');h.tick(8000);assert.equal(h.flight,null);
// Home settles visual delivery, keeps the answer, and cancels stray callbacks.
h=harness();h.click('answer');h.click('home');assert.equal(h.pending,0);h.tick(10000);assert.equal(h.state.turn,1);h.click('resume');assert.equal(h.flight,null);assert.match(h.html,/Choose a message to send/);
// Last answer waits before showing the closing controls.
h=harness();for(let i=0;i<3;i++){h.click('answer');h.click('skip-messages');}h.click('answer');assert.equal(h.state.phase,'wrap');assert.doesNotMatch(h.dock,/close-chat/);h.tick(10000);assert.match(h.dock,/close-chat/);
// In-person conversations never show phone typing or a handset status bar.
let s=G.reduce(G.fresh(),{type:'START'});s.relations.alex.chapter=4;s.relations.alex.meetingDay=1;s=G.reduce(s,{type:'OPEN',id:'alex'});s=G.reduce(s,{type:'ARRIVE'});h=harness(s);h.click('answer');assert.equal(h.pending,0);assert.equal(h.flight,null);assert.match(h.html,/Face to face/);assert.doesNotMatch(h.html,/device-island|typing-indicator/);
// A photo has its own transfer state and is hidden until delivery completes.
let photoState=G.reduce(G.reduce(G.fresh(),{type:'START'}),{type:'OPEN',id:'alex'});
photoState=G.reduce(photoState,{type:'ANSWER',index:0});
const replyDelay=Math.min(2600,900+G.resolve(G.options(photoState)[0].reply,photoState).length*12);
h=harness(photoState);h.click('answer');assert.doesNotMatch(h.bubbles,/message-photo/);h.tick(650+replyDelay+550);
assert.equal(h.flight.stage,'photo');assert.match(h.bubbles,/is sending a photo/);assert.doesNotMatch(h.bubbles,/class="message-photo"/);
h.tick(1600);assert.match(h.bubbles,/class="message-photo"/);assert.match(h.bubbles,/alex-books/);h.tick(550);assert.equal(h.flight,null);
console.log('Passed: staged delivery, typing, separate messages, duplicate-input guard, skip, pause/resume, saved reload, home cancellation, final reply and in-person behavior.');
