
/* ===== rendering ===== */
const cv=$('cv'),cx=cv.getContext('2d');
const V={W:300,H:300,dpr:1,yH:90,yB:270,sc:40};
let crowd=[];
function resize(){
  const r=cv.getBoundingClientRect();V.dpr=Math.min(2,window.devicePixelRatio||1);
  V.W=Math.max(100,r.width);V.H=Math.max(100,r.height);
  cv.width=Math.round(V.W*V.dpr);cv.height=Math.round(V.H*V.dpr);cx.setTransform(V.dpr,0,0,V.dpr,0,0);
  V.yH=V.H*.3;V.yB=V.H*.9;V.sc=Math.min(V.W*.15,V.H*.2);
  const R=mulberry(7);crowd=[];const n=Math.round(V.W/3);
  for(let i=0;i<n*4;i++)crowd.push({x:R(),y:R(),c:['#f0bf55','#e0412f','#35c2d6','#eef1fb','#9bdc6a','#c46bd8'][Math.floor(R()*6)]});
}
function P(x,d,h){const s=1/(1+Math.max(d,-6)/9);return{x:V.W/2+x*V.sc*s,y:V.yH+(V.yB-V.yH)*s-(h||0)*V.sc*s,s};}
function line(a,b,w,c){cx.strokeStyle=c;cx.lineWidth=w;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();}
function figure(x,d,shirt,pants,helm,pose){
  const p=P(x,d,0),u=V.sc*p.s;if(p.y-u*2>V.H+20||p.s<=0)return;
  cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(p.x,p.y,.42*u,.1*u,0,0,6.3);cx.fill();
  cx.lineCap='round';
  line({x:p.x-.1*u,y:p.y-.85*u},{x:p.x-.14*u,y:p.y},Math.max(1.5,.14*u),pants);
  line({x:p.x+.1*u,y:p.y-.85*u},{x:p.x+.14*u,y:p.y},Math.max(1.5,.14*u),pants);
  cx.fillStyle=shirt;cx.beginPath();cx.roundRect?cx.roundRect(p.x-.25*u,p.y-1.6*u,.5*u,.8*u,.1*u):cx.rect(p.x-.25*u,p.y-1.6*u,.5*u,.8*u);cx.fill();
  cx.fillStyle='#d9a47a';cx.beginPath();cx.arc(p.x,p.y-1.75*u,.15*u,0,6.3);cx.fill();
  cx.fillStyle=helm;cx.beginPath();cx.arc(p.x,p.y-1.8*u,.16*u,3.14,6.28);cx.fill();
  if(pose==='arm'){line({x:p.x+.2*u,y:p.y-1.5*u},{x:p.x+.3*u,y:p.y-2.1*u},Math.max(1.5,.1*u),shirt);}
}
function drawWorld(){
  const W=V.W,H=V.H;
  // sky
  let g=cx.createLinearGradient(0,0,0,V.yH);g.addColorStop(0,'#1b2461');g.addColorStop(.55,'#6a4a96');g.addColorStop(1,'#f08a5c');
  cx.fillStyle=g;cx.fillRect(0,0,W,V.yH+2);
  // floodlight glows
  [[.1,.55],[.9,.55],[.3,.35],[.7,.35]].forEach(a=>{const x=W*a[0],y=V.yH*a[1],gr=cx.createRadialGradient(x,y,0,x,y,V.sc*1.6);gr.addColorStop(0,'rgba(255,248,214,.9)');gr.addColorStop(.25,'rgba(255,236,170,.35)');gr.addColorStop(1,'rgba(255,236,170,0)');cx.fillStyle=gr;cx.fillRect(x-V.sc*2,y-V.sc*2,V.sc*4,V.sc*4);
    cx.fillStyle='#1a1f3f';cx.fillRect(x-1.5,y,3,V.yH-y+V.H*.03);});
  // stands + crowd
  const y0=P(0,78,0).y,sy=V.yH-V.H*.07;
  cx.fillStyle='#161c42';cx.fillRect(0,sy,W,y0-sy+2);
  const bh=y0-sy;
  for(const c of crowd){cx.fillStyle=c.c;cx.globalAlpha=.75;cx.fillRect(c.x*W,sy+c.y*bh,2,2);}
  cx.globalAlpha=1;
  // grass stripes
  for(let d=-8,i=0;d<80;d+=6,i++){
    const a=P(0,d,0).y,b=P(0,d+6,0).y;if(b>a)continue; // far strips have smaller y
    cx.fillStyle=i%2?'#2a8049':'#2f8e52';
    const top=Math.max(b,y0),bot=Math.min(a,H+4);if(bot>top)cx.fillRect(0,top,W,bot-top+1);
  }
  // boundary rope
  cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=2;cx.beginPath();let pen=false;
  for(let a=0;a<=360;a+=4){const x=RB*Math.sin(rad(a)),d=CD+RB*Math.cos(rad(a));if(d<-4){pen=false;continue;}const p=P(x,d,0);if(!pen){cx.moveTo(p.x,p.y);pen=true;}else cx.lineTo(p.x,p.y);}
  cx.stroke();
  // pitch
  const c1=P(-1.52,-1.6,0),c2=P(1.52,-1.6,0),c3=P(1.52,21.8,0),c4=P(-1.52,21.8,0);
  cx.fillStyle='#cdb584';cx.beginPath();cx.moveTo(c1.x,c1.y);cx.lineTo(c2.x,c2.y);cx.lineTo(c3.x,c3.y);cx.lineTo(c4.x,c4.y);cx.closePath();cx.fill();
  [1.22,PITCH-1.22].forEach(d=>line(P(-1.8,d,0),P(1.8,d,0),Math.max(1,.04*V.sc*P(0,d).s*3),'rgba(255,255,255,.9)'));
  line(P(-1.52,-1.6,0),P(-1.52,21.8,0),1,'rgba(255,255,255,.35)');line(P(1.52,-1.6,0),P(1.52,21.8,0),1,'rgba(255,255,255,.35)');
}
function stumps(d,fallen){
  const lw=Math.max(1.4,.05*V.sc*P(0,d).s*1.6);
  for(const x of[-.09,0,.09]){
    const a=P(x,d,0);let top=P(x,d,.71);
    if(fallen){const k=Math.min(1,G.hit?G.hit.t*3:1);top={x:a.x+(x*3+.25)*V.sc*a.s*k,y:a.y-.71*V.sc*a.s*(1-.75*k)};}
    line(a,top,lw,'#f4eedc');
  }
  if(!fallen){line(P(-.1,d,.73),P(.1,d,.73),lw*.8,'#e0412f');}
  else{const a=P(.3,d,.1+(G.hit?Math.min(.5,G.hit.t):0));cx.fillStyle='#e0412f';cx.fillRect(a.x,a.y,Math.max(3,lw*2),Math.max(1.5,lw*.6));}
}
function ballDraw(x,d,h,r){
  const p=P(x,d,h),sh=P(x,d,0),rad_=Math.max(2.4,r*V.sc*p.s);
  cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(sh.x,sh.y,rad_*1.2,rad_*.4,0,0,6.3);cx.fill();
  cx.fillStyle='#e0412f';cx.beginPath();cx.arc(p.x,p.y,rad_,0,6.3);cx.fill();
  cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=Math.max(.6,rad_*.18);cx.beginPath();cx.arc(p.x,p.y,rad_*.7,.5,2.4);cx.stroke();
}
function hitBallPos(){
  const h=G.hit;if(!h||h.kind!=='shot')return null;
  const u=clamp(h.t/h.dur,0,1),e=1-(1-u)*(1-u),dist=h.endD*e;
  let ht;
  if(h.loft)ht=.9*(1-u)+h.peak*4*u*(1-u);
  else ht=.12+Math.abs(Math.sin(u*9.4))*.3*(1-u);
  return{x:.1+dist*Math.sin(rad(h.th)),d:.8+dist*Math.cos(rad(h.th)),h:ht,u};
}
function render(){
  const W=V.W,H=V.H;
  cx.save();
  if(G.shake>0)cx.translate((rnd()-.5)*8*G.shake,(rnd()-.5)*8*G.shake);
  drawWorld();
  const inn=curInn();
  const batTeam=inn?M.t[inn.batSide].team:TEAMS[S.team],bowlTeam=inn?M.t[inn.bowlSide].team:TEAMS[(S.team+1)%4];
  // far stumps
  stumps(PITCH,false);
  // fielders sorted far to near
  const fl=G.field.slice().sort((a,b)=>b.d-a.d);
  for(const f of fl)figure(f.x,f.d,bowlTeam.c1,'#f2f2f2',bowlTeam.c2);
  // umpire + bowler
  figure(-1.9,PITCH+1.3,'#e8e8e8','#222','#222');
  let bd=26,pose='';
  if(G.phase==='runup')bd=lerp(26,20.9,clamp(G.t/RUNUP,0,1));
  else if(G.phase==='flight'||G.phase==='hit'||G.phase==='post'){bd=20.6;pose='arm';}
  figure(.6,bd,bowlTeam.c1,'#f2f2f2',bowlTeam.c2,pose);
  // bounce hint
  if(inn&&userBatting()&&DIFF[S.diff].hint&&G.del&&(G.phase==='runup'||G.phase==='flight')&&!G.del.hasBounced){
    const p=P(G.del.xb,G.del.db,0),pr=1+.15*Math.sin(performance.now()/120);
    cx.strokeStyle='rgba(255,255,255,.8)';cx.lineWidth=2;cx.beginPath();cx.ellipse(p.x,p.y,.34*V.sc*p.s*pr,.12*V.sc*p.s*pr,0,0,6.3);cx.stroke();
  }
  // near stumps
  stumps(0,G.stumpsDown>0);
  // ball
  if(G.phase==='flight'){
    G.trail.forEach((t,i)=>{cx.globalAlpha=(i+1)/G.trail.length*.35;ballDraw(t.x,t.d,t.h,.11);});cx.globalAlpha=1;
    ballDraw(G.ball.x,G.ball.d,G.ball.h,.13);
  }else if(G.phase==='hit'||G.phase==='post'){
    const bp=hitBallPos();
    if(bp&&bp.u<1)ballDraw(bp.x,bp.d,bp.h,.13);
    else if(G.hit&&G.hit.kind==='pass'&&G.hit.t<.2){ballDraw(G.ball.x,Math.max(G.ball.d,0),G.ball.h,.13);}
  }
  // batter + bat
  const ist=inn?M.t[inn.batSide].team:batTeam;
  figure(-.62,0,ist.c1,'#f2f2f2',ist.c2);
  {
    const hand=P(-.45,.1,1.0),u=V.sc;let k=0,ang=-1.95;
    const sw=G.swing;
    if(sw){const T=.26;k=clamp((sw.ai?(G.hit?G.hit.t+.05:.05):sw.t)/T,0,1);ang=lerp(-2.2,.7,k);}
    else if(G.phase==='runup'||G.phase==='flight')ang=-1.95+Math.sin(performance.now()/260)*.04;
    const L=1.0*u;
    line(hand,{x:hand.x+Math.cos(ang)*L,y:hand.y+Math.sin(ang)*L},Math.max(4,.11*u),'#caa066');
    line(hand,{x:hand.x+Math.cos(ang)*L*.25,y:hand.y+Math.sin(ang)*L*.25},Math.max(3,.07*u),'#3a2a1a');
  }
  // particles
  for(const p of G.fx){cx.globalAlpha=clamp(1-p.t/p.life,0,1);cx.fillStyle=p.c;cx.fillRect(p.x*W,p.y*H,5,5);}
  cx.globalAlpha=1;
  drawMini();
  cx.restore();
}
function drawMini(){
  const size=Math.min(V.W*.3,120),x0=V.W-size-8,y0=8,k=size/2/(RB+6),cxm=x0+size/2,cym=y0+size/2;
  const mx=x=>cxm+x*k,my=d=>cym-(d-CD)*k;
  cx.save();
  cx.fillStyle='rgba(10,18,40,.55)';cx.beginPath();cx.arc(cxm,cym,size/2,0,6.3);cx.fill();
  cx.fillStyle='rgba(46,139,87,.75)';cx.beginPath();cx.arc(cxm,cym,RB*k,0,6.3);cx.fill();
  cx.strokeStyle='rgba(255,255,255,.7)';cx.lineWidth=1;cx.stroke();
  cx.fillStyle='#cdb584';cx.fillRect(mx(-1.5),my(PITCH),3*k,PITCH*k);
  const inn=curInn(),bt=inn?M.t[inn.bowlSide].team:TEAMS[1];
  // aim cone while batting
  if(inn&&userBatting()&&(G.phase==='runup'||G.phase==='flight')){
    const a=G.aim,len=RB*.9;
    cx.fillStyle='rgba(240,191,85,.28)';cx.beginPath();cx.moveTo(mx(0),my(0));
    cx.lineTo(mx(len*Math.sin(rad(a-9))),my(len*Math.cos(rad(a-9))));cx.lineTo(mx(len*Math.sin(rad(a+9))),my(len*Math.cos(rad(a+9))));cx.closePath();cx.fill();
    cx.strokeStyle='#f0bf55';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(mx(0),my(0));cx.lineTo(mx(len*Math.sin(rad(a))),my(len*Math.cos(rad(a))));cx.stroke();
  }
  if(G.lastShot&&G.phase!=='ready'){
    const s=G.lastShot,e=Math.min(1,G.phase==='hit'&&G.hit?G.hit.t/G.hit.dur:1);
    cx.strokeStyle=s.boundary===6?'#f0bf55':s.boundary===4?'#fff':'rgba(255,255,255,.7)';cx.lineWidth=2;cx.beginPath();cx.moveTo(mx(0),my(0));
    cx.lineTo(mx(s.endD*e*Math.sin(rad(s.th))),my(s.endD*e*Math.cos(rad(s.th))));cx.stroke();
  }
  for(const f of G.field){cx.fillStyle=bt.c1;cx.beginPath();cx.arc(mx(f.x),my(f.d),2.6,0,6.3);cx.fill();}
  cx.fillStyle=bt.c1;cx.fillRect(mx(KEEPER.x)-2,my(KEEPER.d)-2,4,4);
  cx.fillStyle='#fff';cx.beginPath();cx.arc(mx(0),my(0),2,0,6.3);cx.fill();
  cx.restore();
}
