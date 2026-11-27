'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script); // syntax check
const start = script.indexOf('  const TUNING_SCHEMA');
const end = script.indexOf('  const tuning = defaultTuning();');
const target = script.match(/  function calcOverdriveTarget\(stage, curve = tuning.odCurve\) \{[\s\S]*?\n  \}/)[0];
const shuffle = script.match(/  function shuffle\(array, rng = Math.random\) \{[\s\S]*?\n  \}/)[0];
const api = new Function(script.slice(start,end)+ '\nconst tuning = defaultTuning();\n'+target+'\n'+shuffle+'\nreturn {TUNING_SCHEMA, defaultTuning,validateTuning,calcOverdriveTarget,shuffle};')();
assert.deepEqual(api.defaultTuning(), {tacSlots:4,odSlots:6,odCurve:4.5,probMult:1,speedMult:1,assistRate:65,initBurstLv:4,refillLvInc:1});
const bad = api.validateTuning(JSON.parse('{"probMult":"oops","tacSlots":99,"odCurve":"4.7","assistRate":-1,"refillLvInc":null,"speedMult":true,"initBurstLv":[],"__proto__":{"x":1},"unknown":3}'));
assert.deepEqual(bad.values,{tacSlots:12,odCurve:4.5,assistRate:0});
assert.equal(bad.ignored.length,6); assert.equal(bad.adjusted.length,3);
assert.equal(api.validateTuning([]).invalidRoot,true);
assert.equal(api.validateTuning(null).invalidRoot,true);
assert.deepEqual(api.validateTuning({speedMult:'1.2',probMult:'2e0'}).values,{speedMult:1.2,probMult:2});
assert.equal(api.validateTuning({probMult:' ',speedMult:Infinity,odSlots:'0x10'}).ignored.length,3);
for(const curve of [2,4.5,8]) for(let stage=1;stage<=30;stage++){
  const expected=Math.round(420*curve**Math.floor((stage-1)/3)*[1,1.7,2.6][(stage-1)%3]/10)*10;
  assert.equal(api.calcOverdriveTarget(stage,curve),expected);
}
const original=[1,2,3]; assert.deepEqual(api.shuffle(original,()=>0),[2,3,1]); assert.deepEqual(original,[1,2,3]);
assert.deepEqual(api.shuffle(original,()=>0.999),original);
for(const key of Object.keys(api.TUNING_SCHEMA)){
  const [initial,min,max,step,id]=api.TUNING_SCHEMA[key];
  assert.ok(initial>=min&&initial<=max&&step>0);
  assert.ok(html.includes('id="'+id+'"'));
}
for(const fn of ['debugUnlockAll','debugAddCoins','debugSkipStage','regenCurrentStage']) assert.ok(script.includes('window.'+fn+' = function() {\n    if (!debugEnabled) return;'));
assert.ok(html.includes('id="debugBench" hidden'));
assert.ok(script.includes("get('debug') === '1'"));
assert.ok(script.includes('if (droplets.length >= 80) return;'));
assert.ok(script.includes('state.waveMult = 2.5;')&&script.includes('state.waveMult = 5.0;')&&script.includes('state.waveMult = 10.0;')&&script.includes('state.waveMult = 20.0;')&&script.includes('state.waveMult *= 2.0;'));
assert.ok(script.includes('state.rerollCost = 2;')&&script.includes('state.rerollCost++;'));
assert.ok(!script.includes('sort(() => Math.random() - 0.5)'));
assert.ok(!html.includes('user-scalable=no'));
assert.ok(html.includes('aria-live="polite"'));
assert.equal((html.match(/<script(?:\s|>)/g)||[]).length,1);
assert.ok(!/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(html));
console.log('PASS: tuning validation, target formula (90 cases), shuffle, debug guards and static invariants');
