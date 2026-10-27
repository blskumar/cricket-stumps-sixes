
/* ===== HUD, toast, commentary ===== */
function toast(t,c){const e=$('toast');e.textContent=t;e.style.color=c||'var(--fg)';e.classList.remove('show');void e.offsetWidth;e.classList.add('show');}
function renderComm(){$('comm').innerHTML=(M?M.comm.slice(-3):[]).map(l=>'<div>'+esc(l)+'</div>').join('');}
const sh=n=>{const p=String(n).split(' ');return p[0][0]+'. '+p.slice(1).join(' ');};
function renderSB(inn){
  const el=$('sb');el.hidden=false;
  const st=inn.order[inn.striker],nn=inn.order[inn.non];
  const brow=(b,star)=>b?'<div class="r'+(star?' cur':'')+'"><span>'+esc(b.name)+(star?' *':'')+'</span><span>'+b.runs+' ('+b.balls+')</span></div>':'';
  const cb=inn.cur>=0?inn.bs[inn.cur]||{balls:0,runs:0,wk:0,wd:0}:null,bw=inn.cur>=0?M.t[inn.bowlSide].players[inn.cur]:null;
  const fig=s=>oversText(s.balls)+'-'+s.runs+'-'+s.wk;
  const others=Object.keys(inn.bs).filter(k=>+k!==inn.cur).map(k=>'<b>'+esc(sh(M.t[inn.bowlSide].players[k].name))+'</b> '+fig(inn.bs[k]));
  el.innerHTML='<div><div class="h"><span>Batting</span><span>Overs <b>'+oversText(inn.balls)+(M.practice?'':'/'+M.overs)+'</b></span></div>'+brow(st,true)+brow(nn,false)+'<div class="oth">4s <b>'+st.f+'</b> · 6s <b>'+st.s+'</b> · Extras <b>'+inn.extras+'</b>'+(inn.fow.length?' · Last wkt '+esc(inn.fow[inn.fow.length-1]):'')+'</div></div>'
   +'<div><div class="h"><span>Bowling</span><span>O-R-W</span></div>'+(bw&&cb?'<div class="r cur"><span>'+esc(bw.name)+'</span><span>'+fig(cb)+'</span></div>':'<div class="r"><span>Choosing bowler</span><span></span></div>')+'<div class="oth">'+(others.length?others.join(' · '):'No other bowlers yet')+'</div></div>';
}
function hud(){
  const inn=curInn();
  if(!inn){$('sb').hidden=true;$('tmName').textContent='Stumps & Sixes';$('runs').textContent='0';$('wkts').textContent='0';$('overs').textContent='0.0';$('info').textContent='';$('chips').innerHTML='';return;}
  const tm=M.t[inn.batSide].team;
  $('tmName').textContent=tm.id;$('runs').textContent=inn.runs;$('wkts').textContent=inn.wk;
  $('overs').textContent=oversText(inn.balls)+(M.practice?'':' / '+M.overs);
  const st=inn.order[inn.striker],bw=G.bowler,left=M.overs*6-inn.balls;
  let h='';
  if(M.practice)h='Practice nets · no wicket limit';
  else if(inn.idx===1){const need=M.target+1-inn.runs;h='Target <b>'+(M.target+1)+'</b> · need <b>'+Math.max(0,need)+'</b> off <b>'+Math.max(0,left)+'</b> · RRR <b>'+(left>0?(need/left*6).toFixed(1):'-')+'</b>';}
  else h='Run rate <b>'+(inn.balls?(inn.runs/inn.balls*6).toFixed(1):'0.0')+'</b> · '+(left>0?left+' balls left':'');
    $('info').innerHTML=h;
  const c=$('chips');c.innerHTML='<span class="lab">Over '+(inn.over+1)+'</span>'+inn.chips.map(x=>'<span class="chip '+x.c+'">'+x.t+'</span>').join('');
  renderSB(inn);
}
function setControls(mode){
  $('ctlBat').hidden=mode!=='bat';$('ctlBowl').hidden=mode!=='bowl';$('ctlWait').hidden=mode!=='wait';
  if(mode==='bowl')syncBowlUI();
}
function aimLabel(a){return a<-65?'Fine leg':a<-30?'Midwicket':a<-10?'Mid-on':a<=10?'Straight':a<=30?'Mid-off':a<=65?'Cover':'Point';}
function lineLabel(x){return x<-.6?'Down the leg side':x<-.15?'Leg stump':x<.15?'Middle stump':x<.5?'Off stump':x<1?'Outside off':'Wide outside off';}
function updateLineOut(){const x=+$('line').value/100;G.sel.line=x;$('lineOut').textContent=lineLabel(x);}
function syncBowlUI(){
  document.querySelectorAll('#segLen button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===G.sel.len));
  document.querySelectorAll('#segSpd button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===G.sel.spd));
  document.querySelectorAll('#segFld button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===G.sel.field));
  $('line').value=Math.round(G.sel.line*100);$('lineOut').textContent=lineLabel(G.sel.line);
}

/* ===== overlays ===== */
const ov=$('overlay');
let cardBack=null;
function overlay(html){ov.innerHTML=html;ov.hidden=false;const b=ov.querySelector('button');if(b)b.focus({preventScroll:true});}
function hideOverlay(){ov.hidden=true;ov.innerHTML='';}
function seg(k,vals,cur){return'<div class="seg">'+vals.map(v=>'<button type="button" data-act="set" data-k="'+k+'" data-v="'+v[0]+'" aria-pressed="'+(String(cur)===String(v[0]))+'">'+v[1]+'</button>').join('')+'</div>';}
function showMenu(){
  G.phase='menu';M=null;G.fx=[];G.stumpsDown=0;G.swing=null;G.hit=null;G.lastShot=null;G.field=makeField('bal');setControls('wait');hud();renderComm();
  $('ctlWait').firstElementChild.firstElementChild.textContent='Choose a mode to start playing.';
  const st=store.get('stats',{played:0,won:0,best:0});
  overlay('<div class="card"><h1>Stumps <em>&amp;</em> Sixes</h1><p>Bat, bowl and chase down the target. Works with touch, mouse and keyboard.</p>'
   +'<div><div class="lbl"><span>Overs per side</span></div>'+seg('overs',[[2,'2'],[5,'5'],[10,'10'],[20,'20']],S.overs)+'</div>'
   +'<div><div class="lbl"><span>Difficulty</span></div>'+seg('diff',[['easy','Easy'],['med','Medium'],['hard','Hard']],S.diff)+'</div>'
   +'<div><div class="lbl"><span>Your team</span></div><div class="sw">'+TEAMS.map((t,i)=>'<button type="button" class="team" data-act="team" data-i="'+i+'" aria-pressed="'+(S.team===i)+'"><i style="background:linear-gradient(90deg,'+t.c1+' 50%,'+t.c2+' 50%)"></i><b>'+t.id+'</b><span>'+t.name+'</span></button>').join('')+'</div></div>'
   +'<div class="row"><button type="button" class="btn primary" data-act="play" style="flex:2">Play match</button><button type="button" class="btn" data-act="nets" style="flex:1">Practice nets</button><button type="button" class="btn" data-act="help" style="flex:1">How to play</button></div>'
   +'<div class="statline"><span>Matches <b>'+st.played+'</b></span><span>Wins <b>'+st.won+'</b></span><span>Best score <b>'+st.best+'</b></span></div></div>');
}
function showHelp(){
  overlay('<div class="card"><h2>How to play</h2><ul class="help">'
   +'<li><b>Batting.</b> Press <b>Swing</b> (or tap the pitch, or <kbd>Space</kbd>) as the ball reaches the bat. Better timing means a better shot.</li>'
   +'<li><b>Aim.</b> Slide the aim control (or <kbd>←</kbd> <kbd>→</kbd>) to send the ball into a gap. The yellow wedge on the small field map shows where it will go.</li>'
   +'<li><b>Loft.</b> Turn Loft on (or <kbd>↑</kbd>) to hit over the top. Sixes need perfect timing, mistimed lofts get caught.</li>'
   +'<li><b>Bowling.</b> Choose length and line, set the field, then Bowl (<kbd>Space</kbd>). Yorkers and balls on the stumps are hardest to hit. Wide balls cost a run.</li>'
   +'<li><b>Keys while bowling.</b> <kbd>1</kbd>-<kbd>4</kbd> length, <kbd>←</kbd> <kbd>→</kbd> line, <kbd>F</kbd> field.</li>'
   +'<li><b>Scoring.</b> Four and six clear the rope. Ten wickets or the last over ends an innings. Chasing side wins by passing the target.</li>'
   +'</ul><button type="button" class="btn primary" data-act="back">Got it</button></div>');
}
function showPause(){
  overlay('<div class="card"><h2>Paused</h2><div class="row"><button type="button" class="btn primary" data-act="resume" style="flex:1">Resume</button></div>'
   +'<div class="row"><button type="button" class="btn" data-act="card" style="flex:1">Scorecard</button><button type="button" class="btn" data-act="helpback" style="flex:1">How to play</button><button type="button" class="btn" data-act="quit" style="flex:1">Quit to menu</button></div></div>');
}
function showToss(){
  G.phase='overlay';
  overlay('<div class="card"><h2>The toss</h2><p>'+esc(TEAMS[S.team].name)+' vs '+esc(M.t[1].team.name)+' · '+S.overs+' overs each · '+DIFF[S.diff].name+'</p><p>Call it in the air.</p>'
   +'<div class="row"><button type="button" class="btn primary" data-act="toss" data-v="heads" style="flex:1">Heads</button><button type="button" class="btn primary" data-act="toss" data-v="tails" style="flex:1">Tails</button></div></div>');
}
function doToss(call){
  const flip=rnd()<.5?'heads':'tails',won=flip===call;
  if(won){overlay('<div class="card"><h2>It is '+flip+'. You won the toss.</h2><p>What will you do?</p><div class="row"><button type="button" class="btn primary" data-act="choose" data-v="bat" style="flex:1">Bat first</button><button type="button" class="btn primary" data-act="choose" data-v="bowl" style="flex:1">Bowl first</button></div></div>');}
  else{const bat=rnd()<.45;overlay('<div class="card"><h2>It is '+flip+'. '+esc(M.t[1].team.name)+' won the toss.</h2><p>They chose to '+(bat?'bat':'bowl')+' first.</p><button type="button" class="btn primary" data-act="choose" data-v="'+(bat?'bowl':'bat')+'">Play</button></div>');}
}
function beginMatch(userBats){M.userBatsFirst=userBats;hideOverlay();startInnings(0,userBats?0:1);}
function showBowlerPicker(inn){
  const ok=new Set(eligible(inn).map(p=>p.i)),q=quota();
  const rows=bowlersOf(inn).map(p=>{
    const s=inn.bs[p.i]||{balls:0,runs:0,wk:0},od=oversBowled(inn,p.i),can=ok.has(p.i);
    const why=can?'':(od>=q?'Quota used':'Bowled last over');
    const fig=oversText(s.balls)+'-'+s.runs+'-'+s.wk;
    return'<button type="button" class="btn" '+(can?'data-act="bowler" data-i="'+p.i+'"':'disabled aria-disabled="true"')+' style="text-align:left;display:flex;justify-content:space-between;gap:10px;'+(can?'':'opacity:.5;cursor:default')+'"><span>'+esc(p.name)+' <span style="color:var(--mute)">('+p.bowl.type+')</span></span><span style="color:'+(can?'var(--brass)':'var(--mute)')+';text-align:right;white-space:nowrap;flex:none">'+(can?'★'.repeat(Math.round(p.bowl.skill*5))+' · ':esc(why)+' · ')+'<b>'+fig+'</b></span></button>';
  }).join('');
  overlay('<div class="card"><h2>Over '+(inn.over+1)+': pick your bowler</h2><p>'+esc(M.t[0].team.name)+' are in the field. '+oversText(inn.balls)+' overs bowled, '+inn.runs+'/'+inn.wk+'. Figures are overs-runs-wickets. Each bowler can bowl '+(M.practice?'any number of':q)+' over'+(q===1&&!M.practice?'':'s')+'.</p>'+rows+'</div>');
}
function teamLine(inn){return M.t[inn.batSide].team.name+' '+inn.runs+'/'+inn.wk+' ('+oversText(inn.balls)+')';}
function startSecond(){hideOverlay();startInnings(1,1-M.inn[0].batSide);}
function topPerf(inn){
  const bats=inn.order.filter(b=>b.balls||b.out).sort((x,y)=>y.runs-x.runs||x.balls-y.balls)[0];
  const bowls=Object.keys(inn.bs).map(k=>({n:M.t[inn.bowlSide].players[k].name,s:inn.bs[k]})).sort((x,y)=>y.s.wk-x.s.wk||x.s.runs-y.s.runs)[0];
  let h='';
  if(bats)h+='<div class="r"><span>Top scorer</span><span><b>'+esc(bats.name)+'</b> '+bats.runs+' ('+bats.balls+')</span></div>';
  if(bowls)h+='<div class="r"><span>Best bowler</span><span><b>'+esc(bowls.n)+'</b> '+oversText(bowls.s.balls)+'-'+bowls.s.runs+'-'+bowls.s.wk+'</span></div>';
  return h;
}
function showBreak(){
  const a=M.inn[0],userNext=a.batSide!==0;
  overlay('<div class="card"><h2>Innings break</h2><div class="big">'+esc(teamLine(a))+'</div>'
   +'<div style="display:grid;gap:4px;font-size:14px;color:var(--mute)">'+topPerf(a)+'</div>'
   +'<p>Target: <b style="color:var(--fg)">'+(a.runs+1)+'</b> runs from '+M.overs+' overs.</p>'
   +'<p>'+(userNext?'You chase. Get '+(a.runs+1)+' to win.':'You bowl. Defend '+a.runs+' to win.')+'</p>'
   +'<p>Take a breather. The match waits until you are ready.</p>'
   +'<div class="row"><button type="button" class="btn primary" data-act="next2" style="flex:2">Resume match</button><button type="button" class="btn" data-act="card" style="flex:1">Scorecard</button></div></div>');
}
function showResult(){
  const r=M.result,head=r.userWon===null?'Tied match':r.userWon?'You win!':'You lose';
  overlay('<div class="card"><h2>'+head+'</h2><div class="big">'+esc(r.text)+'</div><p>'+esc(teamLine(M.inn[0]))+'<br>'+esc(teamLine(M.inn[1]))+'</p>'
   +'<div class="row"><button type="button" class="btn primary" data-act="rematch" style="flex:1">Play again</button><button type="button" class="btn" data-act="card" style="flex:1">Scorecard</button><button type="button" class="btn" data-act="quit" style="flex:1">Menu</button></div></div>');
  cardBack=showResult;
}
function showCard(back){
  cardBack=back||null;
  let h='<div class="card"><h2>Scorecard</h2>';
  M.inn.forEach(inn=>{
    h+='<div><div class="big" style="font-size:26px">'+esc(teamLine(inn))+'</div><div class="scroll"><table><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr>';
    inn.order.forEach((b,i)=>{if(b.balls||b.out||i===inn.striker||i===inn.non)h+='<tr><td>'+esc(b.name)+'<br><span style="color:var(--mute);font-size:11px">'+esc(b.out||'not out')+'</span></td><td>'+b.runs+'</td><td>'+b.balls+'</td><td>'+b.f+'</td><td>'+b.s+'</td></tr>';});
    h+='</table></div><div class="scroll"><table><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Wd</th></tr>';
    Object.keys(inn.bs).forEach(k=>{const s=inn.bs[k];h+='<tr><td>'+esc(M.t[inn.bowlSide].players[k].name)+'</td><td>'+oversText(s.balls)+'</td><td>'+s.runs+'</td><td>'+s.wk+'</td><td>'+s.wd+'</td></tr>';});
    h+='</table></div><p>Extras '+inn.extras+(inn.fow.length?' · Fall of wickets: '+esc(inn.fow.join(', ')):'')+'</p></div>';
  });
  overlay(h+'<button type="button" class="btn primary" data-act="closecard">Close</button></div>');
}
ov.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');if(!t)return;Snd.init();Snd.click();
  const a=t.dataset.act,v=t.dataset.v;
  if(a==='set'){S[t.dataset.k]=t.dataset.k==='overs'?+v:v;store.set('settings',S);t.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===t));}
  else if(a==='team'){S.team=+t.dataset.i;store.set('settings',S);ov.querySelectorAll('.team').forEach(b=>b.setAttribute('aria-pressed',b===t));}
  else if(a==='play'){newMatch('match');showToss();}
  else if(a==='nets'){newMatch('nets');hideOverlay();startInnings(0,0);}
  else if(a==='help'){showHelp();}
  else if(a==='back'){M?hideOverlay():showMenu();}
  else if(a==='helpback'){showHelp();}
  else if(a==='toss'){doToss(v);}
  else if(a==='choose'){beginMatch(v==='bat');}
  else if(a==='bowler'){setBowler(M.t[0].players[+t.dataset.i]);}
  else if(a==='next2'){startSecond();}
  else if(a==='rematch'){newMatch('match');showToss();}
  else if(a==='card'){showCard(ov.querySelector('[data-act=resume]')?showPause:(M.result?showResult:showBreak));}
  else if(a==='closecard'){if(cardBack)cardBack();else hideOverlay();}
  else if(a==='resume'){hideOverlay();}
  else if(a==='quit'){showMenu();}
});

/* ===== input ===== */
function userSwing(){
  if(!M||!userBatting()||(G.phase!=='runup'&&G.phase!=='flight')||G.swing)return;
  G.swing={t:0,delay:.12,aim:+$('aim').value,loft:G.loft,done:false};Snd.whoosh();
}
function setAim(v){v=clamp(v,-90,90);$('aim').value=v;G.aim=v;$('aimOut').textContent=aimLabel(v);}
function toggleLoft(){G.loft=!G.loft;$('loft').setAttribute('aria-pressed',G.loft);}
$('aim').addEventListener('input',()=>setAim(+$('aim').value));
$('loft').addEventListener('click',()=>{Snd.init();toggleLoft();});
$('swing').addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();userSwing();});
cv.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();userSwing();});
$('bowl').addEventListener('click',()=>{Snd.init();startBowl();});
$('line').addEventListener('input',updateLineOut);
function segClick(id,key){$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;Snd.init();G.sel[key]=b.dataset.v;syncBowlUI();});}
segClick('segLen','len');segClick('segSpd','spd');segClick('segFld','field');
$('btnCard').addEventListener('click',()=>{if(M&&M.inn.length)showCard(()=>hideOverlay());});
$('btnMenu').addEventListener('click',()=>{Snd.init();if(M)showPause();else showMenu();});
$('btnMute').addEventListener('click',()=>{Snd.init();Snd.on=!Snd.on;$('btnMute').textContent=Snd.on?'Sound on':'Sound off';$('btnMute').setAttribute('aria-pressed',!Snd.on);});
document.addEventListener('keydown',e=>{
  if(!ov.hidden){if(e.key==='Escape'&&M&&!ov.querySelector('[data-act=toss],[data-act=choose],[data-act=bowler],[data-act=next2],[data-act=rematch]'))hideOverlay();return;}
  const k=e.key;Snd.init();
  if(k==='Escape'){if(M)showPause();return;}
  if(!M)return;
  if(userBatting()){
    if(k===' '||k==='Enter'){e.preventDefault();userSwing();}
    else if(k==='ArrowLeft'||k==='a'){setAim(+$('aim').value-8);}
    else if(k==='ArrowRight'||k==='d'){setAim(+$('aim').value+8);}
    else if(k==='ArrowUp'||k==='w'||k==='ArrowDown'||k==='s'){e.preventDefault();toggleLoft();}
  }else if(G.phase==='ready'){
    if(k===' '||k==='Enter'){e.preventDefault();startBowl();}
    else if(k>='1'&&k<='4'){G.sel.len=['yorker','full','good','short'][+k-1];syncBowlUI();}
    else if(k==='ArrowLeft'||k==='a'){G.sel.line=clamp(G.sel.line-.1,-1,1.4);syncBowlUI();}
    else if(k==='ArrowRight'||k==='d'){G.sel.line=clamp(G.sel.line+.1,-1,1.4);syncBowlUI();}
    else if(k==='f'||k==='F'){const o=['att','bal','def'];G.sel.field=o[(o.indexOf(G.sel.field)+1)%3];syncBowlUI();}
  }
});

/* ===== boot ===== */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(ov.hidden)update(dt);
  render();requestAnimationFrame(frame);
}
new ResizeObserver(resize).observe($('stage'));
window.addEventListener('resize',resize);
resize();setAim(0);showMenu();requestAnimationFrame(frame);
