
/* ===== field geometry =====
   Coordinates in metres: x = towards off side (right of screen), d = distance from the batter's stumps towards the bowler.
   Angles: 0 = straight down the ground, +90 = point side, -90 = square leg, 180 = behind the wicket. */
const PITCH=20.12, CD=10.06, RB=64;
function ropeDist(th){const c=Math.cos(rad(th)),b=CD*c;return b+Math.sqrt(Math.max(0,b*b-CD*CD+RB*RB));}
const FIELDS={
  att:[[158,14],[150,18],[122,18],[88,22],[52,24],[20,26],[-22,26],[-58,26],[-95,22]],
  bal:[[155,14],[85,26],[50,33],[15,58],[-15,58],[-58,34],[-92,58],[-155,48],[125,52]],
  def:[[20,60],[-20,60],[55,58],[95,58],[130,50],[-55,58],[-95,58],[-140,50],[35,30]]
};
const FNAMES={
  att:['Slip','Second slip','Gully','Point','Cover','Mid-off','Mid-on','Midwicket','Square leg'],
  bal:['Slip','Point','Cover','Long-off','Long-on','Midwicket','Deep square','Fine leg','Third man'],
  def:['Long-off','Long-on','Deep cover','Deep point','Third man','Deep midwicket','Deep square','Fine leg','Cover']
};
function makeField(k){
  return FIELDS[k].map((p,i)=>{const x=p[1]*Math.sin(rad(p[0])),d=p[1]*Math.cos(rad(p[0]));return{name:FNAMES[k][i],th:p[0],r:p[1],x,d,hx:x,hd:d};});
}
const KEEPER={name:'Keeper',x:.3,d:-10};
function rayInfo(th,f){const s=Math.sin(rad(th)),c=Math.cos(rad(th)),t=f.x*s+f.d*c;return{t,perp:Math.hypot(f.x-t*s,f.d-t*c)};}
/* clearance of an aim angle: how far the nearest fielder on that line is from it (used by the AI batter) */
function clearance(th,field,D){let m=40;for(const f of field){const r=rayInfo(th,f);if(r.t>6&&r.t<D)m=Math.min(m,r.perp);}return m;}

/* ===== delivery physics ===== */
function makeDelivery(o){
  return{d0:19.8,db:o.db,v:o.v,turn:o.turn,xr:o.xr,xb:o.xb,h0:o.type==='spin'?1.9:2.15,hAt:.08+.115*o.db,type:o.type,
    xFinal:o.xb+o.turn,hasBounced:false};
}
function ballAt(del,d){
  if(d>=del.db){const u=clamp((del.d0-d)/(del.d0-del.db),0,1);return{x:lerp(del.xr,del.xb,u),h:del.h0*(1-u)*(1-u)};}
  const u=clamp((del.db-d)/del.db,0,1);
  return{x:del.xb+del.turn*u,h:del.hAt*(1-(1-u)*(1-u))};
}

/* ===== ball missed or left alone ===== */
function resolvePass(del,swung,diff){
  const b=ballAt(del,0),x=b.x,h=b.h;
  const o={runs:0,wk:null,extra:null,boundary:0,kind:'pass',txt:'',miss:swung,beaten:swung};
  if(!swung&&(x>1.08||x<-1.25||h>2.1)){o.extra='wd';o.txt=Math.abs(x)>1?'Wide down the '+(x>0?'off':'leg')+' side.':'Too high, called wide.';return o;}
  if(Math.abs(x)<=.145&&h<.78){o.wk='bowled';o.txt=swung?'Through the gate! Clean bowled.':'Left it alone, and it hits the stumps.';return o;}
  if(x>-.5&&x<.15&&h<.6&&rnd()<(swung?.38:.3)*(del.type==='spin'?1.2:1)){o.wk='lbw';o.txt='Hit on the pads, plumb in front. Given out.';return o;}
  o.txt=swung?pick(['Swings and misses.','Beaten all ends up.','Played and missed.']):pick(['Left alone.','Shoulders arms.','Watchful, lets it go through.']);
  return o;
}

/* ===== bat meets ball =====
   I = {q, aim, loft, bx, db}, field = fielders. Returns an outcome with the path the ball takes afterwards. */
function groundShot(th,D,field,o,sk){
  const rope=ropeDist(th);let best=null;
  field.forEach((f,i)=>{const r=rayInfo(th,f);if(r.t>3&&r.t<D&&r.perp<(D<35?7:4.8)){if(!best||r.t<best.t)best={i,t:r.t};}});
  o.loft=false;
  if(best){
    o.fielder=best.i;o.endD=best.t;
    if(rnd()<.1){o.runs=2;o.endD=Math.min(rope,best.t+14);o.txt='Misfield! '+field[best.i].name+' lets it through.';}
    else{o.runs=best.t<20?(rnd()<.3?1:0):best.t<36?1:best.t<52?2:3;
      if(o.runs===3)o.runs=2;
      o.txt=o.runs===0?'Straight to '+field[best.i].name+'. No run.':'Fielded by '+field[best.i].name+', '+(o.runs===1?'a single.':o.runs+' runs.');
      if(o.runs>=2&&rnd()<.05){o.wk='run out';o.runs=1;o.txt='Direct hit! Run out going for the second.';}}
    return;
  }
  if(D>=rope*.94){o.runs=4;o.boundary=4;o.endD=rope;o.txt=pick(['Pierces the gap! FOUR.','Races away to the rope.','Pure timing, four runs.']);return;}
  o.endD=D;o.runs=D<28?1:D<46?2:3;o.txt=o.runs===1?'Worked into the gap for a single.':o.runs+' runs, good running.';
}
function aerialShot(th,D2,field,o,peakBoost){
  const rope=ropeDist(th),lx=D2*Math.sin(rad(th)),ld=D2*Math.cos(rad(th));
  let bi=-1,bd=99;field.forEach((f,i)=>{const d=Math.hypot(f.x-lx,f.d-ld);if(d<bd){bd=d;bi=i;}});
  o.loft=true;o.peak=clamp(D2*.34*(peakBoost||1),4,20);
  if(D2>=rope+1.5){
    if(bd<3.6&&rnd()<.5){o.wk='caught';o.fielder=bi;o.endD=rope-1;o.txt='Caught on the boundary by '+field[bi].name+'!';return;}
    o.runs=6;o.boundary=6;o.endD=D2;o.txt=pick(['SIX! Into the stands.','Launched! Maximum.','Over the rope, six runs.']);return;
  }
  const pc=bd<2.4?.9:bd<4.5?.62:bd<7?.28:bd<10?.08:0;
  if(rnd()<pc){o.wk='caught';o.fielder=bi;o.endD=D2;o.txt='Skied, and '+field[bi].name+' takes the catch.';return;}
  if(pc>.5&&rnd()<.5){o.dropped=true;}
  o.fielder=-1;
  if(D2>rope*.78){o.runs=4;o.boundary=4;o.endD=rope;o.txt='Lands safe and rolls away for four.';}
  else{o.runs=D2>38?3:D2>22?2:1;o.endD=D2;o.txt=(o.dropped?'Dropped by '+field[bi].name+'! ':'Lands safe, ')+o.runs+(o.runs===1?' run.':' runs.');}
}
function resolveShot(I,field){
  let q=I.q,th=I.aim;const loft=I.loft;
  const o={runs:0,wk:null,extra:null,boundary:0,kind:'shot',th,loft,endD:20,fielder:-1,q:I.q,edge:false,txt:'',peak:0};
  const off=I.bx;
  if(Math.abs(off)>.6)q*=Math.max(.35,1-(Math.abs(off)-.6)*.9);
  if(off>.45&&th<-25)q*=.78;
  if(off<-.05&&th>25)q*=.82;
  if(I.db<1.9)q*=loft?.6:.8;
  if(I.db>7.8&&loft&&th<-20)q=Math.min(1,q*1.12);
  if(I.db>2.2&&I.db<4.2&&!loft&&Math.abs(th)<35)q=Math.min(1,q*1.1);
  q=clamp(q,0,1);o.q=q;
  th=I.aim+randn()*(1-q)*14;o.th=th;
  if(q<.28){
    o.edge=true;const r=rnd();
    if(r<.5){
      o.th=off>=0?rr(140,172):rr(-172,-140);th=o.th;o.loft=false;
      if(rnd()<.4+(1-q)*.3){o.wk=rnd()<.6?'caught behind':'caught';o.fielder=o.wk==='caught'?0:-2;o.endD=12;o.txt=o.wk==='caught behind'?'Thin edge, and the keeper takes it!':'Edged to slip, a sharp catch!';}
      else if(rnd()<.3){o.runs=4;o.boundary=4;o.endD=ropeDist(th);o.txt='Edged, and it flies past slip for four.';}
      else{o.runs=rnd()<.5?0:1;o.endD=18;o.txt='Edged, but it falls short of the slips.';}
    }else if(r<.78){
      o.th=rr(-60,60);o.loft=false;
      if(rnd()<.25){o.wk='bowled';o.txt='Inside edge onto the stumps. Bowled!';}
      else{o.runs=rnd()<.6?0:1;o.endD=9;o.txt='Inside edge, rolls to leg. '+(o.runs?'A leg-bye single.':'No run.');}
    }else{aerialShot(th+rr(-40,40),rr(10,24),field,o,1.6);o.txt='Top edge! '+o.txt;}
    return o;
  }
  if(q<.55){
    if(loft){aerialShot(th,12+q*45,field,o,1.4);o.txt='Mistimed. '+o.txt;}
    else{groundShot(th,8+q*30,field,o);}
    return o;
  }
  const p=(q-.55)/.45;
  if(loft)aerialShot(th,28+p*62+randn()*5,field,o);
  else groundShot(th,22+p*58+randn()*4,field,o);
  return o;
}
