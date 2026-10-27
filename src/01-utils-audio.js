'use strict';
/* ===== utilities ===== */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=()=>Math.random();
const rr=(a,b)=>a+(b-a)*rnd();
const pick=a=>a[Math.floor(rnd()*a.length)];
const randn=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*v);};
const rad=d=>d*Math.PI/180;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const store={
  get(k,d){try{const v=localStorage.getItem('sns_'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('sns_'+k,JSON.stringify(v));}catch(e){}}
};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const oversText=b=>Math.floor(b/6)+'.'+(b%6);

/* ===== teams & players ===== */
const TEAMS=[
  {id:'DKS',name:'Deccan Strikers',c1:'#f0bf55',c2:'#233a8a'},
  {id:'CKG',name:'Coastal Kings',c1:'#35c2d6',c2:'#0e4a5c'},
  {id:'NLN',name:'Northern Lions',c1:'#ef5a3c',c2:'#5b1a14'},
  {id:'HBH',name:'Harbour Hawks',c1:'#9bdc6a',c2:'#1d4a2b'}
];
const FIRST=['Arjun','Rohan','Kabir','Vikram','Imran','Dev','Sameer','Nikhil','Rahul','Aryan','Tarun','Zaheer','Mohit','Pranav','Karan','Siddharth','Rizwan','Harsh','Yash','Ankit','Farhan','Jayant','Ishan','Varun'];
const LAST=['Rao','Khan','Reddy','Naidu','Sharma','Iyer','Menon','Patel','Verma','Gill','Bose','Kulkarni','Das','Nair','Joshi','Mirza','Singh','Chauhan','Pillai','Ahmed','Yadav','Thakur','Mehta','Shetty'];
const BAT_BASE=[.88,.84,.8,.76,.7,.64,.56,.46,.4,.34,.3];
const BOWL_SLOTS=[[10,'fast',.82],[9,'fast',.78],[8,'medium',.7],[7,'spin',.74],[6,'spin',.66],[5,'medium',.6]];
function genTeam(ti){
  const used=new Set(),players=[];
  for(let i=0;i<11;i++){
    let n;do{n=pick(FIRST)+' '+pick(LAST);}while(used.has(n));used.add(n);
    players.push({i,name:n,bat:clamp(BAT_BASE[i]+rr(-.04,.04),.2,.95),bowl:null});
  }
  BOWL_SLOTS.forEach(s=>{players[s[0]].bowl={type:s[1],skill:clamp(s[2]+rr(-.05,.05),.4,.95)};});
  return {ti,team:TEAMS[ti],players};
}

/* ===== audio (WebAudio, started by the first tap) ===== */
const Snd={ctx:null,on:true,
  init(){if(this.ctx)return;try{const A=window.AudioContext||window.webkitAudioContext;if(A)this.ctx=new A();}catch(e){}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  tone(f,dur,type,vol,slide){if(!this.on||!this.ctx)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+dur);g.gain.setValueAtTime(vol||.15,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.02);},
  noise(dur,vol,freq,type,swell){if(!this.on||!this.ctx)return;const c=this.ctx,n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq||1500;const g=c.createGain(),t=c.currentTime;if(swell){g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(vol,t+dur*.3);g.gain.linearRampToValueAtTime(.001,t+dur);}else{g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);}s.connect(f).connect(g).connect(c.destination);s.start(t);},
  click(){this.tone(620,.06,'square',.05);},
  hit(q){this.noise(.07,.35+q*.3,1800+q*1200,'bandpass');this.tone(170,.09,'triangle',.2,.5);},
  edge(){this.noise(.05,.3,3000,'highpass');},
  stumps(){this.noise(.25,.5,900,'bandpass');this.tone(120,.3,'sawtooth',.15,.4);},
  four(){this.noise(1.1,.22,900,'lowpass',true);},
  six(){this.noise(1.8,.32,1100,'lowpass',true);this.tone(660,.18,'triangle',.08,1.5);},
  wide(){this.tone(900,.12,'square',.05);},
  out(){this.noise(.5,.3,500,'lowpass');this.tone(220,.4,'sawtooth',.1,.5);},
  whoosh(){this.noise(.18,.12,700,'bandpass');}
};
