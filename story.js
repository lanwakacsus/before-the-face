(function(root){
'use strict';
const scripts=typeof module!=='undefined'?require('./conversations.js'):root.BTF_STORIES;
const people={
 alex:{name:'Alex',age:34,pronouns:'she / her',color:'#e5ae7c',symbol:'◒',portrait:'alex',job:'Library events coordinator',bio:'A playlist for every errand. Usually has a book she hasn’t finished.',hook:'You both voted for the same terrible film in the neighborhood group.',off:2},
 ben:{name:'Ben',age:32,pronouns:'he / him',color:'#7fc8cc',symbol:'≈',portrait:'jamie',job:'Restaurant manager',bio:'Cooks for a living. Orders takeaway more than he admits.',hook:'He replied to your question about somewhere to eat after ten.',off:4},
 morgan:{name:'Morgan',age:30,pronouns:'they / them',color:'#b4bc8b',symbol:'✳',portrait:'rowan',job:'Urban planning researcher',bio:'Walks everywhere. Notices buildings you’ve never looked at.',hook:'You traded cinema recommendations in the local chat.',off:1},
 maya:{name:'Maya',age:29,pronouns:'she / her',color:'#c7a6e7',symbol:'◇',portrait:'maya',job:'Graphic designer',bio:'Secondhand furniture, ambitious recipes, unfinished projects.',hook:'She offered to identify a chair you found at the flea market.',off:3},
 daniel:{name:'Daniel',age:36,pronouns:'he / him',color:'#9eb9f0',symbol:'⊙',portrait:'daniel',job:'School administrator',bio:'An early walker. Good at fixing things; bad at throwing them away.',hook:'He posted a spare ticket for the community film night.',off:0},
 sam:{name:'Sam',age:31,pronouns:'she / her',color:'#efaaac',symbol:'⌁',portrait:'sam',job:'Bicycle mechanic',bio:'Weekend rides, pub quizzes, an extremely ordinary cat.',hook:'She answered your question about the bike rack outside the café.',off:5}
};
const photos={
 'alex-books':{owner:'alex',alt:'Books and a mug beside a rainy apartment window.',label:'A quiet evening'},
 'ben-noodles':{owner:'ben',alt:'Takeaway noodles on Ben’s kitchen counter.',label:'Off the clock'},
 'morgan-chair':{owner:'morgan',alt:'A doll-sized wooden chair beside a street tree.',label:'Small discoveries'},
 'maya-cupboard':{owner:'maya',alt:'A secondhand cupboard halfway through a green paint job.',label:'Work in progress'},
 'daniel-walk':{owner:'daniel',alt:'Morning sun falling across a quiet neighborhood street.',label:'Before the rush'},
 'sam-cat':{owner:'sam',alt:'A tabby cat sitting inside a bicycle helmet.',label:'An ordinary cat'}
};
for(const [id,p] of Object.entries(people))p.scenes=scripts[id];
const clone=x=>JSON.parse(JSON.stringify(x));
function fresh(){return {version:3,phase:'intro',day:1,slot:0,active:null,turn:0,transcript:[],relations:Object.fromEntries(Object.keys(people).map(id=>[id,{chapter:0,trust:0,interest:0,flags:[],history:[],lastDay:-3,revealed:false,status:'open',pauseUntil:0,path:'undecided',meetingDay:null,missed:false}])),exclusive:null,seenMonth:false};}
function relation(s,id=s.active){return s.relations[id];}
function current(s){return people[s.active]?.scenes[relation(s)?.chapter];}
function context(s){return {r:relation(s),day:s.day,slot:s.slot,exclusive:s.exclusive};}
const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function nextMeeting(s,id,from=s.day+2){let day=from;while((day-1)%7===people[id].off||Object.entries(s.relations).some(([other,r])=>other!==id&&r.chapter===4&&r.meetingDay===day&&r.status==='open'))day++;return day;}
function meetingLabel(day){return `${weekdays[(day-1)%7]}, day ${day}`;}
function resolve(value,s){let text=typeof value==='function'?value(context(s)):value;if(typeof text!=='string')return text;if(relation(s)?.chapter===3&&relation(s).meetingDay)text=text.replace(/Saturday/g,weekdays[(relation(s).meetingDay-1)%7]);return text;}
function closing(s){const r=relation(s);if(r.path==='ended'||r.trust<=-6)return `${people[s.active].name}: “I don’t think I want to keep this going. Take care.”`;if(r.trust<=-3)return `${people[s.active].name}: “I’m going to take a little space. We can talk another day.”`;return resolve(current(s).close,s);}
function beat(s){return current(s)?.beats[s.turn];}
function prompt(s){return resolve(beat(s)?.text,s);}
function promptMessage(s){return {who:'them',text:prompt(s),...(beat(s)?.photo?{photo:beat(s).photo}:{})};}
function options(s){return beat(s).choices.map((c,index)=>{
 const r=relation(s),unavailable=r.flags.includes('end_romance')||(s.exclusive&&s.exclusive!==s.active);
 if(unavailable&&c.path==='romantic')return {...c,say:'I’d like to keep in touch as friends.',reply:'“I’d like that too.”',interest:0,flag:'friends',path:'friends'};
 if(s.exclusive&&s.exclusive!==s.active&&c.interest>0)return {...c,say:['It’s been nice talking. I’d like to keep it friendly.','I’m happy to spend time together as friends.','I’m glad we can talk openly as friends.','I’m seeing someone, so I’d like to keep this friendly.','I’d enjoy getting to know you without making it romantic.'][index],reply:'Thanks for being clear. I’m happy to keep getting to know you as a friend.',interest:0,flag:'friends',path:'friends'};
 return {...c,say:resolve(c.say,s)};
});}
function available(s,id){const r=relation(s,id);if(r.status==='closed')return {ok:false,label:'Conversation ended'};if(r.chapter>=people[id].scenes.length)return {ok:false,label:'Chapter complete'};if(r.chapter===4&&r.meetingDay){if(s.day<r.meetingDay)return {ok:false,reschedule:true,label:`Coffee · ${meetingLabel(r.meetingDay)}`};if(s.day>r.meetingDay||s.slot!==0)return {ok:false,reschedule:true,label:'Coffee needs rearranging'};return {ok:true,label:'Your coffee is this afternoon'};}if(r.pauseUntil>s.day)return {ok:false,label:`Taking space · day ${r.pauseUntil}`};if(r.lastDay>=s.day-1)return {ok:false,label:`Give it time · back after day ${r.lastDay+1}`};if((s.day-1)%7===people[id].off)return {ok:false,label:'Busy today'};if(s.exclusive&&s.exclusive!==id&&r.path==='romantic')return {ok:true,label:'Catch up as friends'};return {ok:true,label:r.chapter===0?'Introduce yourself':people[id].scenes[r.chapter].title};}
function tick(s){s.slot++;if(s.slot>1){s.slot=0;s.day++;}for(const r of Object.values(s.relations)){if(r.chapter===4&&r.meetingDay&&r.status==='open'&&!r.missed&&(s.day>r.meetingDay||(s.day===r.meetingDay&&s.slot>0))){r.missed=true;r.trust--;if(!r.flags.includes('missed_meeting'))r.flags.push('missed_meeting');}}s.phase=s.day>28&&!s.seenMonth?'recap':'calendar';}
function reduce(s,e){const n=clone(s);const r=relation(n);switch(e.type){
 case 'START':if(n.phase==='intro')n.phase='calendar';break;
 case 'OPEN':{if(n.phase!=='calendar'||!people[e.id]||!available(n,e.id).ok)return s;n.active=e.id;n.turn=0;n.transcript=[];const rr=relation(n);if(rr.chapter===3&&!rr.meetingDay)rr.meetingDay=nextMeeting(n,e.id);n.phase=rr.chapter===4?'arrival':'chat';if(n.phase==='chat'){n.transcript.push({who:'you',text:rr.chapter===0?'Hi. I saw your message in the neighborhood group. Free for a quick chat?':'Hey, got a little time to catch up?'},...(rr.chapter===0?[]:[{who:'them',text:'Hey. Yes, good to hear from you.'}]),promptMessage(n));}break;}
 case 'ARRIVE':if(n.phase!=='arrival')return s;r.revealed=true;n.phase='chat';if(r.flags.includes('missed_meeting'))n.transcript.push({who:'them',text:'“I’m glad we managed to rearrange this. Last time threw my afternoon off a bit. A heads-up would help if plans change again.”'});n.transcript.push(promptMessage(n));break;
 case 'ANSWER':{if(n.phase!=='chat'||!Number.isInteger(e.index)||e.index<0||e.index>4)return s;const c=options(n)[e.index];if(!c)return s;n.transcript.push({who:'you',text:resolve(c.say,n)});r.trust+=c.trust||0;r.interest+=c.interest||0;if(c.flag&&!r.flags.includes(c.flag))r.flags.push(c.flag);
 if(c.path)r.path=c.path;
 let reply=resolve(c.reply,n);
 if(c.path==='romantic'&&r.trust<0){reply='“I enjoyed some of today, but I don’t think another date is right for me.”';r.path='friends';r.flags.push('end_romance');}
 n.transcript.push({who:'them',text:reply});n.turn++;
 if(n.turn<current(n).beats.length)n.transcript.push(promptMessage(n));else n.phase='wrap';break;}
 case 'CLOSE_CHAT':{if(n.phase!=='wrap')return s;const scene=current(n);r.history.push({day:n.day,slot:n.slot,title:scene.title,messages:[...clone(n.transcript),{who:'them',text:closing(n)}]} );r.lastDay=n.day;r.chapter++;
 if(r.trust<=-6||r.path==='ended'){r.status='closed';r.path='ended';}else if(r.trust<=-3)r.pauseUntil=n.day+3;
 if(r.flags.includes('end_romance')&&r.status!=='closed')r.path='friends';
 if(r.chapter===5&&r.path==='undecided')r.path=r.interest>=3&&r.trust>=0?'interested':'friends';
 n.active=null;n.transcript=[];n.turn=0;tick(n);break;}
 case 'RESCHEDULE':{if(n.phase!=='calendar'||!people[e.id])return s;const rr=relation(n,e.id);if(rr.chapter!==4||rr.status==='closed')return s;rr.meetingDay=nextMeeting(n,e.id,Math.max(n.day+2,(rr.meetingDay||0)+1));rr.missed=false;break;}
 case 'REST':if(n.phase!=='calendar')return s;tick(n);break;
 case 'LEAVE':if(!n.active||!['chat','wrap','arrival'].includes(n.phase))return s;r.status='closed';r.path='ended';r.history.push({day:n.day,slot:n.slot,title:current(n).title+' · said goodbye',messages:clone(n.transcript)});n.active=null;n.transcript=[];n.turn=0;tick(n);break;
 case 'RECAP':if(n.phase==='calendar')n.phase='recap';break;
 case 'KEEP_PLAYING':if(n.phase==='recap'){n.seenMonth=true;n.phase='calendar';}break;
 case 'EXCLUSIVE':{if(n.phase!=='calendar'||n.exclusive||!people[e.id])return s;const rr=relation(n,e.id);if(rr.chapter<5||rr.trust<1||rr.interest<3||['friends','ended'].includes(rr.path))return s;n.exclusive=e.id;rr.path='exclusive';for(const [id,other]of Object.entries(n.relations)){if(id!==e.id&&other.path==='romantic')other.path='friends';}break;}
 default:return s;
}return n;}
function restore(raw){try{
 const s=JSON.parse(raw),phases=['intro','calendar','arrival','chat','wrap','recap'];
 const messages=a=>Array.isArray(a)&&a.every(m=>m&&['you','them'].includes(m.who)&&typeof m.text==='string'&&(m.photo===undefined||(m.who==='them'&&typeof m.photo==='string'&&Object.hasOwn(photos,m.photo))));
 if(s.version!==3||!phases.includes(s.phase)||!Number.isInteger(s.day)||s.day<1||s.day>10000||![0,1].includes(s.slot)||!s.relations||!messages(s.transcript)||!Number.isInteger(s.turn)||s.turn<0||s.turn>4||typeof s.seenMonth!=='boolean'||(s.exclusive!==null&&!people[s.exclusive]))return fresh();
 for(const id of Object.keys(people)){const r=s.relations[id];if(!r||!Number.isInteger(r.chapter)||r.chapter<0||r.chapter>5||!Array.isArray(r.history)||r.history.some(h=>!h||typeof h.title!=='string'||!Number.isInteger(h.day)||![0,1].includes(h.slot)||!messages(h.messages))||!Array.isArray(r.flags)||r.flags.some(f=>typeof f!=='string')||!Number.isFinite(r.trust)||!Number.isFinite(r.interest)||!Number.isInteger(r.lastDay)||!Number.isInteger(r.pauseUntil)||typeof r.revealed!=='boolean'||typeof r.missed!=='boolean'||(r.meetingDay!==null&&(!Number.isInteger(r.meetingDay)||r.meetingDay<1))||!['open','closed'].includes(r.status)||!['undecided','friends','romantic','ended','interested','exclusive'].includes(r.path))return fresh();}
 if(['chat','wrap','arrival'].includes(s.phase)){
 if(!people[s.active]||relation(s).chapter>=5)return fresh();
 if(s.phase==='chat'&&s.turn>=current(s).beats.length)return fresh();
 if(s.phase==='wrap'&&s.turn!==current(s).beats.length)return fresh();
 if(s.phase==='arrival'&&(relation(s).chapter!==4||s.turn!==0))return fresh();
 }else if(s.active!==null)return fresh();
 return s;
 }catch{return fresh();}}
function status(s,id){const r=relation(s,id);if(r.status==='closed')return 'Parted ways';if(s.exclusive===id)return 'Seeing each other';if(r.path==='friends')return 'Keeping it friendly';if(r.pauseUntil>s.day)return 'Taking some space';if(r.chapter===0)return 'Haven’t talked yet';if(r.chapter===5)return r.interest>=3&&r.trust>=0?'A possible next date':'Coffee, and a familiar face';if(r.trust<0)return 'A little awkward';if(r.interest>=3&&r.trust>=0)return 'A little flirting';return ['','Introduced','Getting acquainted','A familiar conversation','Coffee on the calendar'][r.chapter];}
const api={photos,people,fresh,relation,current,beat,prompt,options,resolve,closing,nextMeeting,meetingLabel,context,available,reduce,restore,status};if(typeof module!=='undefined')module.exports=api;root.BTF=api;
})(typeof window!=='undefined'?window:globalThis);
