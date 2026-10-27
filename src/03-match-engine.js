
/* ===== settings & runtime state ===== */
const S=Object.assign({overs:5,diff:'med',team:0},store.get('settings',{}));
if(![2,5,10,20].includes(S.overs))S.overs=5;
if(!['easy','med','hard'].includes(S.diff))S.diff='med';
if(!(Number.isInteger(S.team)&&S.team>=0&&S.team<4))S.team=0;
const DIFF={easy:{spd:.84,win:1.3,bat:-.08,hint:true,name:'Easy'},med:{spd:1,win:1,bat:0,hint:false,name:'Medium'},hard:{spd:1.13,win:.82,bat:.07,hint:false,name:'Hard'}};
const BASE_V={fast:19,medium:16,spin:12.5};
const LEN_DB={yorker:1.0,full:3.1,good:6.1,short:9.2};
const FIELD_NAME={att:'Attacking',bal:'Balanced',def:'Defensive'};
const G={phase:'menu',t:0,wait:0,del:null,ball:{d:19.8,x:0,h:2,v:0},trail:[],swing:null,plan:null,res:null,hit:null,
  field:makeField('bal'),fieldKey:'bal',bowler:null,sel:{len:'good',spd:'stock',line:.25,field:'bal'},fx:[],aim:0,loft:false,
  lastShot:null,stumpsDown:0,shake:0,spinSign:1};
let M=null;

/* ===== match setup ===== */
function newMatch(mode,toss){
  const ai=pick([0,1,2,3].filter(i=>i!==S.team));
  M={mode,practice:mode==='nets',overs:mode==='nets'?999:S.overs,t:[genTeam(S.team),genTeam(ai)],inn:[],cur:-1,target:0,comm:[],over:false,userBatsFirst:true};
  return M;
}
function curInn(){return M&&M.cur>=0?M.inn[M.cur]:null;}
function userBatting(){const i=curInn();return !!i&&i.batSide===0;}
function startInnings(idx,batSide){
  const bat=M.t[batSide];
  const inn={idx,batSide,bowlSide:1-batSide,runs:0,wk:0,balls:0,extras:0,
    order:bat.players.map(p=>({i:p.i,name:p.name,skill:p.bat,runs:0,balls:0,f:0,s:0,out:null})),
    striker:0,non:1,next:2,bs:{},cur:-1,prev:-1,chips:[],fow:[],over:0,overOpen:false,done:false};
  M.inn[idx]=inn;M.cur=idx;M.comm=[];
  G.fx=[];G.lastShot=null;
  beginOver();
}
function bowlersOf(inn){return M.t[inn.bowlSide].players.filter(p=>p.bowl);}
function quota(){return M.practice?999:Math.ceil(M.overs/5);}
function oversBowled(inn,i){return inn.bs[i]?Math.floor(inn.bs[i].balls/6):0;}
function eligible(inn){
  let c=bowlersOf(inn).filter(p=>p.i!==inn.prev&&oversBowled(inn,p.i)<quota());
  if(!c.length)c=bowlersOf(inn).filter(p=>oversBowled(inn,p.i)<quota());
  if(!c.length)c=bowlersOf(inn);
  return c;
}
function aiFieldFor(inn){
  const o=inn.over,ov=M.overs,pp=Math.max(1,Math.round(ov*.3)),death=Math.max(1,Math.round(ov*.2));
  if(M.practice)return'bal';
  if(o<pp)return'att';
  if(o>=ov-death)return rnd()<.65?'def':'bal';
  return rnd()<.2?pick(['att','def']):'bal';
}
function beginOver(){
  const inn=curInn();inn.over=Math.floor(inn.balls/6);inn.chips=[];inn.overOpen=true;
  if(inn.bowlSide===1){ // AI bowls, user bats
    const c=eligible(inn),tot=c.reduce((s,p)=>s+p.bowl.skill+.2,0);let r=rnd()*tot,b=c[0];
    for(const p of c){r-=p.bowl.skill+.2;if(r<=0){b=p;break;}}
    inn.cur=b.i;G.bowler=b;G.fieldKey=aiFieldFor(inn);G.field=makeField(G.fieldKey);G.spinSign=rnd()<.5?1:-1;
    hud();setupBall();
  }else{ // user bowls: pick a bowler first
    G.phase='overlay';hud();showBowlerPicker(inn);
  }
}
function setBowler(p){
  const inn=curInn();inn.cur=p.i;G.bowler=p;G.spinSign=rnd()<.5?1:-1;
  G.sel.field=G.sel.field||'bal';G.fieldKey=G.sel.field;G.field=makeField(G.fieldKey);
  hideOverlay();hud();setupBall();
}

/* ===== ball set-up ===== */
function resetFielders(){G.field.forEach(f=>{f.x=f.hx;f.d=f.hd;});}
function setupBall(){
  const inn=curInn();resetFielders();
  G.del=null;G.swing=null;G.plan=null;G.res=null;G.hit=null;G.trail=[];G.stumpsDown=0;G.t=0;
  G.ball={d:19.8,x:0,h:2,v:0};
  if(inn.batSide===0){ // user bats, AI bowler delivers
    G.del=aiDelivery(G.bowler);G.phase='runup';G.t=0;
    G.aim=+$('aim').value;
    setControls('bat');
    $('hint').textContent=DIFF[S.diff].hint?'Swing when the ball reaches the bat. The ring marks where it will bounce.':'Swing when the ball reaches the bat. Aim into the gaps in the field.';
  }else{
    G.phase='ready';setControls('bowl');
    $('hint').textContent=G.bowler.name+' ('+G.bowler.bowl.type+'). Pick line and length, then bowl.';
    updateLineOut();
  }
  hud();
}
function aiDelivery(b){
  const type=b.bowl.type,sk=b.bowl.skill,inn=curInn();
  const death=inn.over>=M.overs-Math.max(1,Math.round(M.overs*.2));
  const pool=type==='spin'?[['good',.55],['full',.25],['short',.2]]:death?[['yorker',.3],['good',.3],['full',.15],['short',.25]]:[['good',.42],['full',.22],['yorker',.1],['short',.26]];
  let r=rnd(),len='good';for(const[k,w]of pool){r-=w;if(r<=0){len=k;break;}}
  const db=Math.max(.5,LEN_DB[len]+randn()*.55*(1.3-sk));
  let xb=.28+randn()*(.52-sk*.3);
  const w=rnd();if(w<.06)xb=rr(1.15,1.6);else if(w<.1)xb=rr(-1.5,-.9);
  const v=BASE_V[type]*DIFF[S.diff].spd*rr(.95,1.05);
  const turn=type==='spin'?G.spinSign*rr(.25,.7):type==='medium'?rr(-.2,.2):rr(-.12,.12);
  return makeDelivery({db,xb,xr:xb*.6+rr(-.1,.1),v,turn,type});
}
function userDelivery(){
  const b=G.bowler,sk=b.bowl.skill,s=G.sel;
  const spd=s.spd==='slow'?.82:s.spd==='quick'?1.1:1,err=s.spd==='quick'?1.35:s.spd==='slow'?.85:1;
  const db=Math.max(.45,LEN_DB[s.len]+randn()*.5*(1.3-sk)*err);
  const xb=s.line+randn()*(.15+(1-sk)*.25)*err;
  const type=b.bowl.type;
  let turn=type==='spin'?G.spinSign*rr(.3,.75)*(s.spd==='slow'?1.25:1):type==='medium'?rr(-.2,.2):rr(-.12,.12);
  return makeDelivery({db,xb,xr:xb*.6+rr(-.08,.08),v:BASE_V[type]*spd,turn,type});
}
function startBowl(){
  if(G.phase!=='ready')return;
  G.fieldKey=G.sel.field;G.field=makeField(G.fieldKey);
  G.del=userDelivery();G.phase='runup';G.t=0;setControls('wait');$('hint').textContent='';
}

/* ===== AI batter ===== */
function aiBatPlan(del,bowler){
  const inn=curInn(),bt=inn.order[inn.striker],dd=DIFF[S.diff],x=del.xFinal;
  let hard=0;
  if(Math.abs(x-.1)<.35)hard+=.1;
  if(del.db<1.9)hard+=.2;else if(del.db<4.5)hard+=.04;else if(del.db<7.2)hard+=.1;else if(del.db>8)hard-=.05;
  if(Math.abs(del.turn)>.4)hard+=.08;
  hard+=(bowler.bowl.skill-.65)*.35;
  hard+=(del.v-16)*.006;
  const base=.52+(bt.skill-.6)*.55+dd.bat+Math.min(.08,bt.balls*.01)-hard;
  const q=clamp(base+randn()*.2,0,1);
  const wide=x>1.08||x<-1.25;
  let aggr=0;
  if(inn.idx===1){const left=Math.max(1,M.overs*6-inn.balls),need=M.target-inn.runs;aggr=clamp((need/left*6-7)/14,-.1,.45);}
  else aggr=inn.over>=M.overs-2?.18:0;
  const loft=rnd()<clamp(.2+aggr+(bt.skill>.7?.05:0),.05,.7);
  let aim=0,best=-9;
  for(let k=0;k<8;k++){const th=rr(-95,100),c=clearance(th,G.field,60)+randn()*(8-bt.skill*5);if(c>best){best=c;aim=th;}}
  return{play:!wide||rnd()<.25,q:wide?q*.6:q,aim,loft};
}

/* ===== frame update ===== */
const RUNUP=.85;
function ballSpeed(){const del=G.del;return del.hasBounced?del.v*.86:del.v;}
function update(dt){
  G.shake=Math.max(0,G.shake-dt*2.5);
  G.fx=G.fx.filter(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;return p.t<p.life;});
  if(G.phase==='runup'){
    G.t+=dt;
    if(G.t>=RUNUP){G.phase='flight';G.t=0;G.ball={d:G.del.d0,x:G.del.xr,h:G.del.h0,v:G.del.v};
      if(!userBatting())G.plan=aiBatPlan(G.del,G.bowler);
      Snd.whoosh();}
  }else if(G.phase==='flight'){
    const del=G.del,step=ballSpeed()*dt;
    G.ball.d-=step;
    if(!del.hasBounced&&G.ball.d<=del.db){del.hasBounced=true;Snd.tone(110,.05,'sine',.12);}
    const b=ballAt(del,Math.max(G.ball.d,0));G.ball.x=b.x;G.ball.h=b.h;
    G.trail.push({d:G.ball.d,x:b.x,h:b.h});if(G.trail.length>7)G.trail.shift();
    if(G.swing){
      G.swing.t+=dt;
      if(!G.swing.done&&G.swing.t>=G.swing.delay){G.swing.done=true;userContact();}
    }else if(G.plan&&G.plan.play&&G.ball.d<=1.0&&!G.plan.done){G.plan.done=true;aiContact();}
    if(G.phase==='flight'&&G.ball.d<=-.2)ballPassed();
  }else if(G.phase==='hit'){
    G.hit.t+=dt;
    const h=G.hit;
    if(h.fielder>=0&&G.field[h.fielder]){const f=G.field[h.fielder],k=clamp(h.t/(h.dur*.85),0,1),ex=h.endD*Math.sin(rad(h.th)),ed=h.endD*Math.cos(rad(h.th));f.x=lerp(f.hx,ex,k);f.d=lerp(f.hd,ed,k);}
    if(h.t>=h.dur)finishBall();
  }else if(G.phase==='post'){
    G.wait-=dt;if(G.wait<=0)proceed();
  }
}

/* ===== contacts ===== */
function userContact(){
  const del=G.del,sw=G.swing,d=G.ball.d;
  if(G.phase!=='flight'||d<=-.2){sw.missed=true;return;}
  const bt=curInn().order[curInn().striker],v=ballSpeed();
  const err=(d-1.0)/v,W=(.17+(bt.skill-.6)*.1)*DIFF[S.diff].win;
  if(Math.abs(err)>W){sw.missed=true;return;}
  const q=1-Math.pow(Math.abs(err)/W,1.3);
  sw.err=err;
  startHit(resolveShot({q,aim:sw.aim,loft:sw.loft,bx:G.ball.x,db:del.db},G.field),q);
}
function aiContact(){
  const p=G.plan,del=G.del;
  if(p.q<.08){G.swing={t:0,delay:0,done:true,missed:true,aim:0,loft:false};return;}
  G.swing={t:0,delay:0,done:true,aim:p.aim,loft:p.loft,ai:true};
  startHit(resolveShot({q:p.q,aim:p.aim,loft:p.loft,bx:G.ball.x,db:del.db},G.field),p.q);
}
function ballPassed(){
  const o=resolvePass(G.del,!!G.swing,S.diff);
  G.res=o;G.hit={t:0,dur:.5,th:180,endD:-10,fielder:-1,kind:'pass',loft:false,peak:0};
  G.phase='hit';
  if(o.wk==='bowled'){G.stumpsDown=1;G.shake=1;Snd.stumps();}
  else if(o.extra==='wd')Snd.wide();
  else Snd.edge();
}
function startHit(o,q){
  G.res=o;
  const th=o.th,endD=o.endD||15;
  G.hit={t:0,th,endD,fielder:o.fielder,loft:o.loft,peak:o.peak||0,kind:'shot',
    dur:.55+Math.min(endD,70)*.011+(o.loft?.35:0),boundary:o.boundary};
  if(o.wk==='bowled'){G.stumpsDown=1;G.shake=1;Snd.stumps();G.hit.dur=.8;}
  else if(o.edge)Snd.edge();else Snd.hit(q);
  G.lastShot={th,endD,boundary:o.boundary,t:0};
  G.phase='hit';
}

/* ===== ball outcome → scoring ===== */
function finishBall(){
  const o=G.res,inn=curInn();
  applyOutcome(o);
  const big=o.boundary===6?'six':o.boundary===4?'four':null;
  if(o.wk){toast('OUT','var(--ball)');Snd.out();}
  else if(o.extra==='wd'){toast('WIDE','var(--brass)');}
  else if(big==='six'){toast('SIX','var(--brass)');Snd.six();burst(26);}
  else if(big==='four'){toast('FOUR','var(--fg)');Snd.four();burst(12);}
  G.phase='post';
  G.wait=o.wk?1.5:(big?1.3:.85);
  hud();
}
function burst(n){
  for(let i=0;i<n;i++)G.fx.push({x:.5+rr(-.1,.1),y:.4,vx:rr(-.5,.5),vy:rr(-.8,-.1),g:1.2,life:rr(.8,1.5),t:0,c:pick(['#f0bf55','#e0412f','#fff','#35c2d6'])});
}
function logComm(txt,o){
  const inn=curInn(),b=inn.order[inn.striker],bw=G.bowler;
  const head=inn.over+'.'+Math.min(5,inn.balls%6===0&&inn.balls>0&&!o.extra?5:inn.balls%6);
  M.comm.push((o.wk?'OUT! ':o.boundary===6?'SIX! ':o.boundary===4?'FOUR! ':'')+bw.name.split(' ')[1]+' to '+b.name.split(' ')[1]+': '+txt);
  if(M.comm.length>40)M.comm.shift();
  renderComm();
}
function applyOutcome(o){
  const inn=curInn(),bt=inn.order[inn.striker],bw=inn.bs[inn.cur]||(inn.bs[inn.cur]={balls:0,runs:0,wk:0,wd:0});
  let txt=o.txt||'';
  if(o.extra==='wd'){
    inn.runs+=1;inn.extras+=1;bw.runs+=1;bw.wd++;inn.chips.push({t:'wd',c:'x'});
    logComm(txt,o);checkEnd();return;
  }
  const striker=inn.striker;
  inn.balls++;bw.balls++;bt.balls++;
  if(o.wk){
    inn.wk++;
    const fn=o.fielder>=0&&G.field[o.fielder]?G.field[o.fielder].name:'';
    const bn=G.bowler.name;
    bt.out=o.wk==='bowled'?'b '+bn:o.wk==='lbw'?'lbw b '+bn:o.wk==='caught behind'?'c keeper b '+bn:o.wk==='run out'?'run out':'c '+(fn||'fielder')+' b '+bn;
    if(o.wk!=='run out')bw.wk++;
    inn.fow.push(inn.runs+'/'+inn.wk+' ('+bt.name.split(' ')[1]+', '+oversText(inn.balls)+')');
    if(o.runs){inn.runs+=o.runs;bw.runs+=o.runs;bt.runs+=o.runs;}
    inn.chips.push({t:'W',c:'w'});
    if(M.practice){const p={i:inn.order.length,name:pick(FIRST)+' '+pick(LAST),skill:.72,runs:0,balls:0,f:0,s:0,out:null};inn.order.push(p);inn.striker=inn.order.length-1;inn.wk=0;}
    else if(inn.wk<10){inn.striker=inn.next++;}
  }else{
    const r=o.runs;inn.runs+=r;bt.runs+=r;bw.runs+=r;
    if(o.boundary===4)bt.f++;if(o.boundary===6)bt.s++;
    inn.chips.push({t:r===0?'•':String(r),c:o.boundary===6?'s':o.boundary===4?'f':''});
    if(r%2===1){const t=inn.striker;inn.striker=inn.non;inn.non=t;}
  }
  logComm(txt,o);
  if(inn.balls%6===0){const t=inn.striker;inn.striker=inn.non;inn.non=t;inn.prev=inn.cur;inn.overOpen=false;}
  checkEnd();
}
function checkEnd(){
  const inn=curInn();if(M.practice){return;}
  if(inn.wk>=10||inn.balls>=M.overs*6||(inn.idx===1&&inn.runs>M.target))inn.done=true;
}
function proceed(){
  const inn=curInn();
  if(inn.done){endInnings();return;}
  if(!inn.overOpen){beginOver();return;}
  setupBall();
}

/* ===== innings & match end ===== */
function endInnings(){
  const inn=curInn();
  if(inn.idx===0){M.target=inn.runs;G.phase='overlay';hud();showBreak();}
  else finishMatch();
}
function finishMatch(){
  const a=M.inn[0],b=M.inn[1];let res,userWon=null;
  const nm=i=>M.t[i].team.name;
  if(b.runs>a.runs){res=nm(b.batSide)+' won by '+(10-b.wk)+' wicket'+(10-b.wk===1?'':'s');userWon=b.batSide===0;}
  else if(b.runs<a.runs){res=nm(a.batSide)+' won by '+(a.runs-b.runs)+' run'+(a.runs-b.runs===1?'':'s');userWon=a.batSide===0;}
  else res='Match tied';
  M.result={text:res,userWon};
  const st=store.get('stats',{played:0,won:0,best:0});
  st.played++;if(userWon)st.won++;
  const mine=M.inn.find(i=>i.batSide===0);if(mine)st.best=Math.max(st.best,mine.runs);
  store.set('stats',st);
  G.phase='overlay';hud();showResult();
}
