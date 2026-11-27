'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const injected=script.replace('  else boot();\n})();','  else boot();\n  window.test={state,tuning,preferences,AudioSys,getGrid:()=>grid,drawBoard,spawnDroplet,getDroplets:()=>droplets,triggerEscalationRefill,generateShopOffers,getOffers:()=>shopOffers,getMode:()=>mode};\n})();');
assert.ok(injected!==script);
function launch({search='',saved=new Map(),blocked=false,reduced=false}={}){
  const byId=new Map();let document;
  const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{};}});
  function element(id=''){
    const flags=new Set(),listeners={};
    return {id,value:'',textContent:'',style:{setProperty(){}},children:[],attributes:{},
      classList:{add(...x){x.forEach(v=>flags.add(v))},remove(...x){x.forEach(v=>flags.delete(v))},contains:x=>flags.has(x),toggle(x,v){if(v===undefined)v=!flags.has(x);v?flags.add(x):flags.delete(x);return v}},
      addEventListener(type,fn){(listeners[type]??=[]).push(fn)},emit(type,e={}){for(const fn of listeners[type]||[])fn({preventDefault(){},...e})},
      setAttribute(k,v){this.attributes[k]=v},appendChild(c){this.children.push(c)},querySelector(){return element()},contains(x){return this===x||this.children.includes(x)},
      focus(){document.activeElement=this;this.emit('focus')},click(){this.onclick?.({detail:0})},getContext(){return ctx},getBoundingClientRect(){return {left:0,top:0,width:340,height:340}},
      set innerHTML(v){this._html=v;this.children=[]},get innerHTML(){return this._html||''},clientWidth:360,clientHeight:450,offsetWidth:1};
  }
  for(const m of html.matchAll(/\bid="([^"]+)"/g))byId.set(m[1],element(m[1]));
  document={body:element('body'),activeElement:null,readyState:'complete',getElementById:id=>{assert.ok(byId.has(id),'Missing element: '+id);return byId.get(id)},createElement:()=>element(),querySelector:()=>null,addEventListener(){}};
  const w={document,location:{pathname:'/Lectron/',search},innerWidth:390,innerHeight:800,devicePixelRatio:2,
    URLSearchParams:globalThis.URLSearchParams||class{constructor(s){this.s=s}get(k){return this.s.slice(1).split('&').map(x=>x.split('=')).find(x=>x[0]===k)?.[1]??null}},
    matchMedia:()=>({matches:reduced,addEventListener(){}}),addEventListener(){},
    localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return saved.get(k)??null},setItem:(k,v)=>{if(blocked)throw Error('blocked');saved.set(k,v)}},
    setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}};
  new Function('window','with(window){'+injected+'}')(w);
  return {w,t:w.test,el:id=>document.getElementById(id),saved};
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
const corrupt=launch({saved:new Map([['lectron.preferences.v1:/Lectron/','not json']])});assert.equal(corrupt.t.tuning.odCurve,4.5);
const debug=launch({search:'?debug=1'});assert.equal(debug.el('debugBench').hidden,false);debug.w.debugAddCoins();assert.equal(debug.t.state.coins,54);
debug.w.debugUnlockAll();assert.equal(debug.t.state.inv.tactical.owned.length,8);debug.w.debugSkipStage();assert.equal(debug.t.state.stage,2);
debug.w.switchMode('overdrive');
for(const [wave,size,lv,mult] of [[2,6,5,2.5],[3,7,5,5],[4,7,6,10],[5,8,7,20],[6,8,8,40]]){debug.t.triggerEscalationRefill();assert.deepEqual([debug.t.state.wave,debug.t.state.gridSize,debug.t.state.burstLv,debug.t.state.waveMult],[wave,size,lv,mult]);}
for(let i=0;i<100;i++)debug.t.spawnDroplet(0,0,1,0);assert.equal(debug.t.getDroplets().length,80);
debug.t.generateShopOffers();const offers=debug.t.getOffers().filter(o=>o.kind==='relic');assert.equal(offers.length,3);assert.equal(new Set(offers.map(o=>o.item.id)).size,3);
const touch=launch(),cv=touch.el('board'),tc=pick(touch.t.getGrid());
const point={isPrimary:true,button:0,pointerId:1,clientX:(tc.c+.5)*340/6,clientY:(tc.r+.5)*340/6};
cv.emit('pointerdown',point);cv.emit('pointercancel',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerdown',{...point,isPrimary:false,pointerId:2});cv.emit('pointerup',point);assert.equal(touch.t.state.taps,10);
cv.emit('pointerdown',point);cv.emit('pointerup',point);assert.equal(touch.t.state.taps,9);
console.log('PASS: mocked DOM boot, keyboard/pointer, preferences, debug, wave progression, beam cap and shop');
