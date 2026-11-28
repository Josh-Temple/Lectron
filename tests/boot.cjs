'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const injected=script.replace('  else boot();\n})();','  else boot();\n  window.test={state,tuning,preferences,records,AudioSys,getGrid:()=>grid,drawBoard,loop,hitCell,burstCell,onGameOver,openShop,spawnDroplet,getDroplets:()=>droplets,triggerEscalationRefill,generateShopOffers,getOffers:()=>shopOffers,getMode:()=>mode,onStageClear,startStage,activateCell,createEmptyBoard,makeDrop,getBumpers:()=>bumpers,stepChain,playbackTempo,rollOverdriveRelics,shopPrice,OVERDRIVE_RELICS};\n})();');
assert.ok(injected!==script);
function launch({search='',saved=new Map(),blocked=false,reduced=false,rng=Math.random}={}){
  const byId=new Map();let document,clip='';
  const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{};}});
  function element(id=''){
    const flags=new Set(),listeners={};
    return {id,value:'',textContent:'',style:{setProperty(){}},children:[],attributes:{},
      classList:{add(...x){x.forEach(v=>flags.add(v))},remove(...x){x.forEach(v=>flags.delete(v))},contains:x=>flags.has(x),toggle(x,v){if(v===undefined)v=!flags.has(x);v?flags.add(x):flags.delete(x);return v}},
      addEventListener(type,fn){(listeners[type]??=[]).push(fn)},emit(type,e={}){for(const fn of listeners[type]||[])fn({preventDefault(){},...e})},
      setAttribute(k,v){this.attributes[k]=v},appendChild(c){this.children.push(c)},querySelector(){return this.button??=element()},contains(x){return this===x||this.children.includes(x)},
      focus(){document.activeElement=this;this.emit('focus')},click(){this.onclick?.({detail:0})},getContext(){return ctx},getBoundingClientRect(){return {left:0,top:0,width:340,height:340}},
      set innerHTML(v){this._html=v;this.children=[]},get innerHTML(){return this._html||''},clientWidth:360,clientHeight:450,offsetWidth:1};
  }
  for(const m of html.matchAll(/\bid="([^"]+)"/g))byId.set(m[1],element(m[1]));
  document={body:element('body'),activeElement:null,readyState:'complete',getElementById:id=>{assert.ok(byId.has(id),'Missing element: '+id);return byId.get(id)},createElement:()=>element(),querySelector:()=>null,addEventListener(){}};
  const w={document,Math:Object.assign(Object.create(Math),{random:rng}),location:{pathname:'/Lectron/',search},innerWidth:390,innerHeight:800,devicePixelRatio:2,
    navigator:{clipboard:{writeText:txt=>{clip=txt;return {then:fn=>fn()};}}},
    URLSearchParams:globalThis.URLSearchParams||class{constructor(s){this.s=s}get(k){return this.s.slice(1).split('&').map(x=>x.split('=')).find(x=>x[0]===k)?.[1]??null}},
    matchMedia:()=>({matches:reduced,addEventListener(){}}),addEventListener(){},
    localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return saved.get(k)??null},setItem:(k,v)=>{if(blocked)throw Error('blocked');saved.set(k,v)},removeItem:k=>{if(blocked)throw Error('blocked');saved.delete(k)}},
    setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}};
  new Function('window','with(window){'+injected+'}')(w);
  return {w,t:w.test,el:id=>document.getElementById(id),saved,getClip:()=>clip};
}
function pick(g){for(let r=0;r<g.length;r++)for(let c=0;c<g.length;c++)if(g[r][c])return {r,c};throw Error('empty grid')}
const a=launch();
assert.equal(a.t.getMode(),'tactical');assert.equal(a.t.state.taps,10);assert.equal(a.el('debugBench').hidden,true);
a.w.debugAddCoins();a.w.debugUnlockAll();a.w.debugSkipStage();a.w.regenCurrentStage();
assert.equal(a.t.state.coins,4);assert.equal(a.t.state.stage,1);assert.equal(a.t.state.inv.tactical.owned.length,0);
const cell=pick(a.t.getGrid()),canvas=a.el('board');canvas.focus();
for(let i=0;i<cell.r;i++)canvas.emit('keydown',{key:'ArrowDown'});
for(let i=0;i<cell.c;i++)canvas.emit('keydown',{key:'ArrowRight'});
assert.ok(a.el('boardCell').textContent.includes((cell.r+1)+'行 '+(cell.c+1)+'列'));
canvas.emit('keydown',{key:'Enter'});assert.equal(a.t.state.taps,9);a.t.drawBoard(1000);
a.w.switchMode('overdrive');assert.equal(a.t.state.taps,5);assert.equal(a.t.state.targetScore,420);
a.el('jsonBox').value='{"probMult":"no","odCurve":99,"tacSlots":"7","unknown":1}';a.w.importTuneJson();
assert.equal(a.t.tuning.odCurve,8);assert.equal(a.t.tuning.probMult,1);assert.equal(a.t.tuning.tacSlots,7);
assert.ok(a.el('toast').textContent.includes('無視 2件'));assert.ok(a.el('toast').textContent.includes('補正 1件'));
a.el('jsonBox').value='[';a.w.importTuneJson();assert.ok(a.el('toast').textContent.includes('構文'));
a.el('jsonBox').value='null';a.w.importTuneJson();assert.ok(a.el('toast').textContent.includes('設定値'));
a.w.toggleMute();a.el('prefNumbers').emit('change',{target:{checked:true}});a.el('prefMotion').emit('change',{target:{checked:true}});
const restored=launch({saved:a.saved});
assert.equal(restored.t.tuning.odCurve,8);assert.equal(restored.t.tuning.tacSlots,7);assert.equal(restored.t.AudioSys.muted,true);
assert.equal(restored.t.preferences.numbers,true);assert.equal(restored.t.preferences.reduceMotion,true);
assert.equal(restored.t.state.stage,1);assert.equal(restored.t.state.taps,10);restored.t.drawBoard(2000);
restored.w.resetPreferences();assert.equal(restored.t.tuning.odCurve,4.5);assert.equal(restored.t.preferences.numbers,false);
const blocked=launch({blocked:true});blocked.w.toggleMute();assert.ok(blocked.el('toast').textContent.includes('保存できません'));
const corrupt=launch({saved:new Map([['lectron.preferences.v1:/Lectron/','not json'],['lectron.run.v1:/Lectron/','{bad']])});assert.equal(corrupt.t.tuning.odCurve,4.5);assert.equal(corrupt.t.state.stage,1);
const debug=launch({search:'?debug=1'});assert.equal(debug.el('debugBench').hidden,false);debug.w.debugAddCoins();assert.equal(debug.t.state.coins,54);
debug.w.debugUnlockAll();assert.equal(debug.t.state.inv.tactical.owned.length,8);debug.w.debugSkipStage();assert.equal(debug.t.state.stage,2);
// Verify Stage 2 autosave restores on reload and restartRun discards it
const resumed=launch({saved:debug.saved});
assert.equal(resumed.t.state.stage,2);assert.equal(resumed.t.state.coins,54);assert.equal(resumed.t.state.inv.tactical.owned.length,8);
resumed.w.restartRun();
const afterReset=launch({saved:resumed.saved});
assert.equal(afterReset.t.state.stage,1);assert.equal(afterReset.t.state.coins,4);
debug.w.switchMode('overdrive');
for(const [wave,size,lv,mult] of [[2,6,5,2.5],[3,7,5,5],[4,7,6,10],[5,8,8,20],[6,8,10,40]]){debug.t.triggerEscalationRefill();assert.deepEqual([debug.t.state.wave,debug.t.state.gridSize,debug.t.state.burstLv,debug.t.state.waveMult],[wave,size,lv,mult]);}
assert.ok(debug.t.state.hitstop>=0.02&&debug.t.state.hitstop<=0.035);
const redEnv=launch({reduced:true});redEnv.t.triggerEscalationRefill();assert.equal(redEnv.t.state.hitstop,0);
for(let i=0;i<100;i++)debug.t.spawnDroplet(0,0,1,0);assert.equal(debug.t.getDroplets().length,80);
debug.t.generateShopOffers();const offers=debug.t.getOffers().filter(o=>o.kind==='relic');assert.equal(offers.length,3);assert.equal(new Set(offers.map(o=>o.item.id)).size,3);
// Verify Shop autosave, role tags, BEST records, NEW BEST badge & Share copy
debug.t.state.stageCleared=true;debug.t.openShop(4,2);
assert.ok(debug.el('shopItems').children[0].innerHTML.includes('role-tag'));
const shopResumed=launch({saved:debug.saved});
assert.equal(shopResumed.t.getMode(),'overdrive');assert.ok(shopResumed.el('shopOverlay').classList.contains('open'));
shopResumed.t.state.runScore=1280;shopResumed.t.state.maxChainRun=14;shopResumed.t.onGameOver();
assert.equal(shopResumed.t.records.overdrive.score,1280);assert.equal(shopResumed.t.records.overdrive.chain,14);
assert.ok(shopResumed.el('resBody').innerHTML.includes('NEW BEST'));
shopResumed.w.copyRunShare();assert.ok(shopResumed.getClip().includes('Lectron [OVERDRIVE]'));
// Help modal + Escape close + Synth API presence
shopResumed.w.openHelp();assert.ok(shopResumed.el('helpOverlay').classList.contains('open'));
shopResumed.el('helpOverlay').emit('keydown',{key:'Escape'});assert.ok(!shopResumed.el('helpOverlay').classList.contains('open'));
for(const fn of ['excite','pop','reflect','shatter','armorBlock','fanfare','mechClick'])assert.equal(typeof shopResumed.t.AudioSys[fn],'function');
const touch=launch(),cv=touch.el('board'),tc=pick(touch.t.getGrid());
const point={isPrimary:true,button:0,pointerId:1,clientX:(tc.c+.5)*340/6,clientY:(tc.r+.5)*340/6};
cv.emit('pointerdown',point);cv.emit('pointercancel',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerdown',{...point,isPrimary:false,pointerId:2});cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,9);
console.log('PASS: mocked DOM boot, keyboard/pointer, preferences, debug, wave progression, beam cap, shop, autosave, records, help and synth');

function overdrive(relics = [], rng = () => 0.5) {
  const run = launch({ rng });
  run.w.switchMode('overdrive');
  run.t.state.inv.overdrive.owned = relics.slice();
  run.t.state.inv.overdrive.equipped = relics.slice();
  return run;
}

// Interest uses the pre-clear balance. Normal clears pay no residual-pulse bonus.
for (const [coins, interest] of [[4,0],[5,1],[24,4],[25,5],[60,5]]) {
  const run = overdrive();
  run.t.state.coins = coins;
  run.t.onStageClear();
  run.t.onStageClear();
  assert.equal(run.t.state.coins, coins + 4 + interest);
  assert.ok(run.el('cutin').textContent.includes(`利子 +${interest}🪙`));
}
const saving = overdrive(['saver_wallet', 'compound_interest', 'pulse_cashout']);
saving.t.state.coins = 55;
saving.t.onStageClear();
assert.equal(saving.t.state.coins, 55 + 4 + 10 + 2 * 5);
saving.t.openShop(4, 10, 10);
const recovered = launch({ saved: saving.saved });
assert.match(recovered.el('shopSummary').textContent, /利子 \+10.*換金 \+10/);
assert.match(recovered.el('btnShopNext').textContent, /倹約 \+7/);
recovered.w.nextStageFromShop();
recovered.w.nextStageFromShop();
assert.equal(recovered.t.state.coins, 86);
for (const spend of ['purchase', 'reroll']) {
  const run = overdrive();
  run.t.state.coins = 50;
  run.t.openShop();
  if (spend === 'purchase') run.el('shopItems').children[0].querySelector('button').click();
  else run.w.rerollShop();
  assert.doesNotMatch(run.el('btnShopNext').textContent, /倹約/);
  const next = launch({ saved: run.saved });
  next.w.nextStageFromShop();
  assert.equal(next.t.state.coins, run.t.state.coins);
}
const lowGold = overdrive();
lowGold.t.state.coins = 0;
lowGold.t.openShop();
lowGold.w.rerollShop();
lowGold.el('shopItems').children[0].querySelector('button').click();
lowGold.w.nextStageFromShop();
assert.equal(lowGold.t.state.coins, 3);

const market = overdrive(['black_market'], () => 0.1);
market.t.openShop();
const marketCatalog = market.t.OVERDRIVE_RELICS;
const marketOffers = market.t.getOffers();
const mythic = marketOffers.find(o => o.item.rarity === 'mythic');
assert.ok(mythic);
assert.equal(marketOffers.filter(o => o.item.rarity === 'mythic').length, 1);
assert.ok(market.el('shopItems').children[2].innerHTML.includes('MYTHIC'));
assert.ok(market.el('shopItems').children[2].className.includes('rarity-mythic'));
assert.equal(market.t.shopPrice(mythic), Math.ceil(mythic.item.cost * 1.25));
assert.equal(market.t.shopPrice(marketOffers.at(-1)), 4);
const marketRestored = launch({ saved: market.saved });
assert.deepEqual(marketRestored.t.getOffers().map(marketRestored.t.shopPrice), marketOffers.map(market.t.shopPrice));
const ordinaryCatalog = overdrive().t;
assert.equal(marketCatalog.length, 23);
for (const item of marketCatalog) {
  const [min,max] = {common:[4,6],rare:[10,14],mythic:[22,30]}[item.rarity || 'common'];
  assert.ok(item.cost >= min && item.cost <= max && item.role);
}
for (const [roll, expected] of [[0.07,true],[0.08,false],[0.1,false]]) {
  assert.equal(ordinaryCatalog.rollOverdriveRelics(marketCatalog, () => roll).some(r => r.rarity === 'mythic'), expected);
}
assert.equal(market.t.rollOverdriveRelics(marketCatalog, () => 0.16).some(r => r.rarity === 'mythic'), false);

const waves = overdrive(['overload_reactor', 'wave_dividend', 'extreme_inflation']);
const initialRefill = waves.t.state.coins;
const count = (t, predicate) => t.getGrid().flat().filter(d => d && predicate(d)).length;
waves.t.triggerEscalationRefill();
assert.equal(count(waves.t, d => d.frozen), 4);
assert.equal(count(waves.t, d => d.armor), 0);
assert.equal(waves.t.state.waveMult, 3.25);
waves.t.triggerEscalationRefill();
assert.equal(waves.t.state.coins, initialRefill + 5);
assert.equal(waves.t.state.reactorMult, 1.25 ** 2);
assert.equal(waves.t.state.waveMult, 7);
const wave3Ice = count(waves.t, d => d.frozen);
const wave3Armor = count(waves.t, d => d.armor);
waves.t.triggerEscalationRefill();
assert.ok(count(waves.t, d => d.frozen) > wave3Ice);
assert.ok(count(waves.t, d => d.armor) > wave3Armor);
waves.t.triggerEscalationRefill();
assert.ok(count(waves.t, () => true) < 64 && waves.t.getBumpers().flat().some(Boolean));
assert.equal(waves.t.state.burstLv, 8);
assert.equal(waves.t.state.coins, initialRefill + 5);
waves.t.openShop();
assert.equal(launch({ saved: waves.saved }).t.state.reactorMult, 1.25 ** 4);
const range = overdrive([], () => 0.1);
range.t.state.wave = 5;
range.t.createEmptyBoard(6);
range.t.spawnDroplet(2,0,1,0,{ pierce: true });
assert.ok(Number.isFinite(range.t.getDroplets()[0].rangeLeft));
range.t.stepChain(0.02, 0.01);
assert.ok(range.t.getDroplets()[0].rangeLeft > 0);
for (let i = 0; i < 40 && range.t.getDroplets().length; i++) range.t.stepChain(0.02, 0.02);
assert.equal(range.t.getDroplets().length, 0);

const tempo = overdrive();
tempo.t.state.busy = true;
for (const [refills, speed] of [[0,1],[2,1.6],[4,2.4],[6,3.2],[10,3.2]]) {
  tempo.t.state.refillsThisTap = refills;
  assert.equal(tempo.t.playbackTempo(), speed);
}
const tempoBoard = tempo.el('board');
tempoBoard.emit('pointerdown', point);
assert.equal(tempo.t.playbackTempo(), 3.2 * 3);
tempoBoard.emit('pointercancel', point);
assert.equal(tempo.t.playbackTempo(), 3.2);
tempoBoard.emit('pointerdown', point);
tempoBoard.emit('pointerup', point);
assert.equal(tempo.t.playbackTempo(), 3.2);

const fast = overdrive();
fast.t.createEmptyBoard(6);
fast.t.getGrid()[3][1] = fast.t.makeDrop(1, 7);
fast.t.getGrid()[3][5] = fast.t.makeDrop(1, 7);
fast.t.tuning.speedMult = 2.5;
fast.t.state.refillsThisTap = 6;
fast.t.state.chainCount = 60;
fast.t.state.busy = true;
fast.t.spawnDroplet(3, 0, 1, 0);
fast.el('board').emit('pointerdown', point);
fast.t.loop(40);
assert.equal(fast.t.getGrid()[3][1].lv, 2);
assert.equal(fast.t.getGrid()[3][5].lv, 1);

const pulse = overdrive(['one_shot_pulse']);
pulse.t.startStage();
assert.equal(pulse.t.state.taps, 2);
pulse.t.getGrid()[0][0] = pulse.t.makeDrop(1, 5);
pulse.t.activateCell(0, 0);
assert.equal(pulse.t.getGrid()[0][0], null);
assert.equal(pulse.t.state.taps, 1);
pulse.t.state.stage = 9;
pulse.t.startStage();
assert.equal(pulse.t.state.taps, 1);

const mining = overdrive(['ion_mining']);
for (let i = 0; i < 9; i++) {
  mining.t.getGrid()[0][0] = mining.t.makeDrop(3, 4);
  mining.t.burstCell(0,0);
}
mining.t.openShop();
const mineRestored = launch({ saved: mining.saved });
assert.equal(mineRestored.t.state.miningProgress, 9);
mineRestored.t.getGrid()[0][0] = mineRestored.t.makeDrop(3, 4);
mineRestored.t.burstCell(0,0);
assert.equal(mineRestored.t.state.coins, 5);
assert.equal(mineRestored.t.state.miningProgress, 0);

const gambler = overdrive(['golden_excitation','quantum_gambler'], () => 0.15);
gambler.t.state.coins = 20;
gambler.t.tuning.probMult = 2;
gambler.t.getGrid()[0][0] = gambler.t.makeDrop(3, 4);
gambler.t.burstCell(0,0);
assert.equal(gambler.t.state.score, 270);
assert.equal(gambler.t.state.coins, 21);
const echo = overdrive(['chain_echo'], () => 0);
for (let i = 0; i < 12; i++) {
  echo.t.getDroplets().length = 0;
  echo.t.getGrid()[0][0] = echo.t.makeDrop(3, 4);
  echo.t.burstCell(0, 0);
  assert.equal(echo.t.getDroplets().length, i < 8 ? 8 : 4);
}

for (const reflector of ['wall', 'bumper']) {
  const reflected = overdrive(['reflection_singularity']);
  reflected.t.createEmptyBoard(6);
  const target = reflector === 'wall' ? [1,1] : [2,1];
  if (reflector === 'bumper') reflected.t.getBumpers()[1][1] = '\\';
  reflected.t.getGrid()[target[0]][target[1]] = reflected.t.makeDrop(2, 4);
  reflected.t.spawnDroplet(1,0,reflector === 'wall' ? -1 : 1,0,{ bouncesLeft: 1 });
  for (let i = 0; i < 32 && reflected.t.state.score === 0; i++) reflected.t.stepChain(0.02, 0.02);
  assert.equal(reflected.t.state.score, 18, reflector);
}
console.log('PASS: OVERDRIVE economy, saved shop, rarity and markup, relic effects, refill hazards and turbo');
