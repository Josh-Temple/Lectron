'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const injected=script.replace('  else boot();\n})();','  else boot();\n  window.test={state,tuning,preferences,records,AudioSys,getGrid:()=>grid,drawBoard,loop,hitCell,burstCell,onGameOver,openShop,spawnDroplet,getDroplets:()=>droplets,triggerEscalationRefill,generateShopOffers,getOffers:()=>shopOffers,getMode:()=>mode,getRoute:()=>tacticalRoute,selectTacticalCard,resolveTacticalEvent,chooseTacticalBlessing,onStageClear,finishTurn,makeDrop,createEmptyBoard,getBumpers:()=>bumpers,activateCell,applyTacticalAnomalies,saveRunState};\n})();');
assert.ok(injected!==script);
function launch({search='',saved=new Map(),blocked=false,reduced=false,rng=()=>0.5}={}){
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
function selectNormal(run) {
  const id = run.t.getRoute().open.find(id => id.startsWith('normal-'));
  assert.ok(id);
  run.t.selectTacticalCard(id);
}
const a=launch();
assert.equal(a.t.getMode(),'tactical');assert.equal(a.t.state.taps,10);assert.equal(a.el('debugBench').hidden,true);
a.w.debugAddCoins();a.w.debugUnlockAll();a.w.debugSkipStage();a.w.regenCurrentStage();
assert.equal(a.t.state.coins,4);assert.equal(a.t.state.stage,1);assert.equal(a.t.state.inv.tactical.owned.length,0);
selectNormal(a);
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
for(const [wave,size,lv,mult] of [[2,6,5,2.5],[3,7,5,5],[4,7,6,10],[5,8,7,20],[6,8,8,40]]){debug.t.triggerEscalationRefill();assert.deepEqual([debug.t.state.wave,debug.t.state.gridSize,debug.t.state.burstLv,debug.t.state.waveMult],[wave,size,lv,mult]);}
assert.ok(debug.t.state.hitstop>=0.02&&debug.t.state.hitstop<=0.035);
const redEnv=launch({reduced:true});redEnv.w.switchMode('overdrive');redEnv.t.triggerEscalationRefill();assert.equal(redEnv.t.state.hitstop,0);
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
const touch=launch();selectNormal(touch);
const cv=touch.el('board'),tc=pick(touch.t.getGrid());
const point={isPrimary:true,button:0,pointerId:1,clientX:(tc.c+.5)*340/6,clientY:(tc.r+.5)*340/6};
cv.emit('pointerdown',point);cv.emit('pointercancel',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerdown',{...point,isPrimary:false,pointerId:2});cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,9);
console.log('PASS: mocked DOM boot, keyboard/pointer, preferences, debug, wave progression, beam cap, shop, autosave, records, help and synth');

const runKey = 'lectron.run.v1:/Lectron/';
const routeRun = launch();
assert.equal(routeRun.t.getRoute().open.length, 3);
assert.equal(routeRun.t.getRoute().deck.length, 5);
assert.match(routeRun.el('routeMeta').textContent, /AREA 1 · 残カード 8 · BOSS: 凍結要塞/);
assert.equal(routeRun.el('routeActions').children.length, 3);
assert.equal(routeRun.el('boardWrap').hidden, true);
assert.equal(routeRun.el('loadoutSheet').inert, false);
const startingCards = [...routeRun.t.getRoute().open, ...routeRun.t.getRoute().deck];
assert.equal(new Set(startingCards).size, 8);
assert.equal(startingCards.filter(id => id.startsWith('normal-')).length, 3);
for (const id of ['shop', 'lab', 'supply']) assert.ok(startingCards.includes(id));
const missing = startingCards.slice(3).find(id => id !== 'boss');
routeRun.t.selectTacticalCard(missing);
routeRun.t.selectTacticalCard('boss');
assert.equal(routeRun.t.getRoute().phase, 'cards');
const originalOpen = routeRun.t.getRoute().open.slice();
const normal = originalOpen.find(id => id.startsWith('normal-'));
routeRun.el('routeActions').children[originalOpen.indexOf(normal)].click();
assert.equal(routeRun.t.getRoute().phase, 'stage');
assert.equal(routeRun.el('boardWrap').hidden, false);
assert.equal(routeRun.el('loadoutSheet').inert, true);
assert.equal(routeRun.t.state.tappedThisStage, false);
const stageRestored = launch({ saved: routeRun.saved });
assert.deepEqual(stageRestored.t.getRoute().open, originalOpen);
assert.equal(stageRestored.t.getRoute().active, normal);
stageRestored.t.onStageClear();
assert.equal(stageRestored.t.state.coins, 7);
assert.equal(stageRestored.t.state.taps, 12);
assert.equal(stageRestored.t.state.stage, 2);
assert.deepEqual(stageRestored.t.getRoute().open, [...originalOpen.filter(id => id !== normal), startingCards[3]]);
const routeRestored = launch({saved: stageRestored.saved});
assert.deepEqual(routeRestored.t.getRoute(), stageRestored.t.getRoute());

function scenario(id, opts = {}) {
  const boot = launch(opts);
  const route = boot.t.getRoute();
  route.open = id === 'boss' ? [] : [id];
  route.deck = [];
  boot.t.selectTacticalCard(id);
  return boot;
}

const supplier = scenario('supply');
const supplierRestored = launch({saved:supplier.saved});
assert.equal(supplierRestored.t.getRoute().phase, 'supply');
supplierRestored.t.resolveTacticalEvent('capacity');
assert.equal(supplierRestored.t.state.maxTaps, 17);
assert.equal(launch({saved:supplierRestored.saved}).t.state.maxTaps, 17);
const heal = scenario('supply');
heal.t.state.taps = 13;
heal.t.resolveTacticalEvent('heal');
assert.equal(heal.t.state.taps, 15);

const lab = scenario('lab');
lab.t.resolveTacticalEvent('rare');
assert.equal(lab.t.state.taps, 7);
assert.equal(lab.t.state.inv.tactical.owned.length, 1);
assert.equal(lab.t.state.inv.tactical.equipped.length, 1);
const sale = scenario('lab');
sale.t.state.inv.tactical.owned = ['thaw_wave'];
sale.t.resolveTacticalEvent('sell');
assert.equal(sale.t.state.coins, 10);
assert.deepEqual(sale.t.state.inv.tactical.owned, []);
const noSale = scenario('lab');
noSale.t.state.inv.tactical.owned = ['thaw_wave'];
noSale.t.state.inv.tactical.equipped = ['thaw_wave'];
noSale.t.resolveTacticalEvent('sell');
assert.equal(noSale.t.getRoute().phase, 'lab');
noSale.t.resolveTacticalEvent('leave');
assert.equal(noSale.t.getRoute().phase, 'cards');

const tacShop = scenario('shop');
assert.equal(tacShop.el('shopExit').textContent, '立ち去る');
tacShop.w.rerollShop();
const openedShop = launch({saved:tacShop.saved});
assert.equal(openedShop.t.getRoute().phase, 'shop');
assert.equal(openedShop.t.state.rerollCost, 3);
assert.deepEqual(openedShop.t.getOffers(), tacShop.t.getOffers());
openedShop.w.nextStageFromShop();
assert.equal(openedShop.t.state.stage, 1);
assert.equal(openedShop.t.getRoute().open.length, 0);
assert.match(openedShop.el('routeActions').children[0].innerHTML, /凍結要塞/);

const fx = scenario('freeze');
const occupied = run => run.t.getGrid().flat().filter(Boolean);
assert.ok(occupied(fx).filter(d => d.frozen).length >= Math.ceil(occupied(fx).length/2));
assert.match(fx.el('tacBoardMeta').textContent, /絶対零度の静寂/);
const fxSave = launch({saved:fx.saved});
assert.equal(fxSave.t.getRoute().active, 'freeze');
assert.deepEqual(occupied(fxSave).map(d=>d.frozen), occupied(fx).map(d=>d.frozen));
const firstFree = occupied(fx).find(d=>!d.frozen);
fx.t.state.spentPulseThisTurn = true;
fx.t.finishTurn();
assert.equal(firstFree.frozen, true);
const thaw = scenario('freeze');
thaw.t.state.inv.tactical.owned = ['thaw_wave'];
thaw.w.toggleLoadoutSheet();
thaw.el('benchList').children[0].querySelector('button').click();
const frozenBefore = occupied(thaw).filter(d=>d.frozen).length;
const targetThaw = thaw.t.getGrid()[5][5];
targetThaw.frozen = false;
targetThaw.lv = 1;
const preTurnIce = occupied(thaw).filter(d=>d.frozen).length;
thaw.t.activateCell(5,5);
assert.ok(frozenBefore >= preTurnIce);
assert.equal(occupied(thaw).filter(d=>d.frozen).length, preTurnIce - 1);

const armor = scenario('armor');
assert.ok(armor.t.getGrid()[3].every(d=>d.armor === 'UD'));
const shield = armor.t.getGrid()[3][2];
const shieldLv = shield.lv;
armor.t.hitCell(3,2,0,1);
assert.equal(shield.lv, shieldLv);
const mirror = scenario('mirror');
assert.ok(mirror.t.getBumpers().flat().filter(Boolean).length >= 5);
assert.ok(occupied(mirror).every(d=>[5,6].includes(d.burstLv)));
const mirrorCell = pick(mirror.t.getGrid());
mirror.t.burstCell(mirrorCell.r,mirrorCell.c);
assert.ok(mirror.t.getDroplets().every(d=>d.bouncesLeft === 2));
const cooled = scenario('cooling');
cooled.t.getGrid()[0][0] = cooled.t.makeDrop(3,4);
cooled.t.finishTurn();
assert.equal(cooled.t.getGrid()[0][0].lv,1);
const gap = scenario('gap');
assert.ok(gap.t.getGrid()[3].every(d=>d === null));
assert.ok(gap.t.getGrid().every(row=>row[3] === null));
assert.ok(gap.t.getBumpers()[3].every(d=>d === null));
assert.ok(gap.t.getBumpers().every(row=>row[3] === null));
const damp = scenario('damping', {reduced:true});
damp.t.createEmptyBoard(6);
damp.t.getGrid()[2][4] = damp.t.makeDrop(1, 4);
damp.t.spawnDroplet(2,0,1,0,{pierce:true});
damp.t.spawnDroplet(1,0,1,0,{pierce:true});
assert.ok(damp.t.getDroplets()[0].rangeLeft < damp.t.getDroplets()[1].rangeLeft);
for (let i = 1; i <= 60; i++) damp.t.loop(i * 16);
assert.equal(damp.t.getDroplets().length,0);
assert.equal(damp.t.getGrid()[2][4].lv,1);

const boss = scenario('boss');
assert.ok(boss.t.getGrid()[3].every(d=>d.armor === 'UD'));
assert.ok(occupied(boss).filter(d => d.frozen).length >= Math.ceil(occupied(boss).length/2));
boss.t.onStageClear();
assert.equal(boss.t.state.coins,14);
assert.equal(boss.t.getRoute().phase, 'blessing');
assert.equal(new Set(boss.t.getRoute().choices).size, 3);
const bossResume = launch({saved:boss.saved});
assert.deepEqual(bossResume.t.getRoute().choices,boss.t.getRoute().choices);
const chosen = bossResume.t.getRoute().choices[0];
bossResume.t.chooseTacticalBlessing(chosen);
assert.equal(bossResume.t.getRoute().area,2);
assert.equal(bossResume.t.getRoute().blessings[chosen],1);
assert.equal(bossResume.t.state.inv.tactical.equipped.length,0);
assert.deepEqual(launch({saved:bossResume.saved}).t.getRoute().blessings,{[chosen]:1});

const perks = launch();
perks.t.getRoute().area = 7;
perks.t.getRoute().blessings = {reserve:1,ice:1,walls:1,discount:1,chain:1,clear:1};
perks.t.getRoute().open = ['freeze','shop'];
perks.t.getRoute().deck = [];
perks.t.selectTacticalCard('freeze');
assert.equal(perks.t.state.taps,11);
perks.t.getGrid()[0][0] = perks.t.makeDrop(2,4,{frozen:true});
perks.t.hitCell(0,0,1,0);
assert.equal(perks.t.getGrid()[0][0].lv,3);
assert.equal(perks.t.getGrid()[0][0].frozen,false);
perks.t.state.chainCount = 2;
perks.t.burstCell(0,0);
assert.equal(perks.t.state.taps,13);
assert.ok(perks.t.getDroplets().every(d=>d.bouncesLeft === 1));
perks.t.onStageClear();
assert.equal(perks.t.state.coins,12);
perks.t.selectTacticalCard('shop');
const firstOffer = perks.t.getOffers()[0];
perks.el('shopItems').children[0].querySelector('button').click();
assert.equal(perks.t.state.coins,12 - Math.round(firstOffer.item.cost * .8));
assert.ok(perks.t.state.inv.tactical.owned.includes(firstOffer.item.id));
const boughtShop = launch({saved:perks.saved});
assert.equal(boughtShop.t.getOffers()[0].bought,true);
boughtShop.w.nextStageFromShop();
assert.equal(boughtShop.t.getRoute().open.length,0);

const deep = launch();
for (let area = 1; area <= 8; area++) {
  const route = deep.t.getRoute();
  assert.equal(route.area,area);
  for (let i = 0; i < 8; i++) {
    const id = route.open[0];
    assert.ok(id);
    deep.t.selectTacticalCard(id);
    if (id === 'shop') deep.w.nextStageFromShop();
    else if (id === 'supply') deep.t.resolveTacticalEvent(deep.t.state.taps < 10 ? 'heal' : 'capacity');
    else if (id === 'lab') deep.t.resolveTacticalEvent('leave');
    else deep.t.onStageClear();
    assert.equal(route.open.length, Math.min(3,7-i));
  }
  deep.t.selectTacticalCard('boss');
  deep.t.onStageClear();
  assert.equal(route.choices.length,3);
  deep.t.chooseTacticalBlessing(route.choices[0]);
}
assert.match(deep.el('routeMeta').textContent,/深層 6/);
assert.equal(launch({saved:deep.saved}).t.getRoute().area,9);

const damaged = JSON.parse(deep.saved.get(runKey));
damaged.tacticalRoute.open[1] = damaged.tacticalRoute.open[0];
const reset = launch({saved:new Map([[runKey,JSON.stringify(damaged)]])});
assert.equal(reset.t.getRoute().area,1);
assert.equal(reset.t.getRoute().deck.length,5);
const legacyStage = launch();
selectNormal(legacyStage);
const oldStage = JSON.parse(legacyStage.saved.get(runKey));
delete oldStage.tacticalRoute;
const migrated = launch({saved:new Map([[runKey,JSON.stringify(oldStage)]])});
assert.equal(migrated.t.getRoute().active,'legacy');
migrated.t.onStageClear();
assert.equal(migrated.t.getRoute().open.length,3);
assert.equal(migrated.t.getRoute().deck.length,5);

console.log('PASS: TACTICAL card retention, events, six anomalies, combined boss, blessings, endless depth and save migration');
