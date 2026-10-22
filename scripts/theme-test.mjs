// State contract for the early initializer; run with node --test scripts/theme-test.mjs.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source = readFileSync(new URL('../assets/theme.js', import.meta.url), 'utf8');
function setup({saved=null, dark=false, reduce=false, denied=false, snapshots=false, broken=false}={}) {
  const listeners = {}, media = {}, store = new Map(saved === null ? [] : [['libero-theme',saved]]);
  const root = {dataset:{},style:{},classList:new Set()};
  root.classList.remove = root.classList.delete;
  const button = {attrs:{},setAttribute(k,v){this.attrs[k]=v;},getBoundingClientRect:()=>({left:100,right:144,top:20,bottom:64})};
  const meta = {setAttribute(k,v){this[k]=v;}};
  const timers = new Map();let timerId=0;
  const document = {
    documentElement:root,
    querySelector:()=>meta,
    querySelectorAll:()=>[button],
    addEventListener:(name,fn)=>{listeners[name]=fn;}
  };
  const transitions=[];
  if(snapshots)document.startViewTransition=update=>{
    if(broken)throw Error('Snapshot unavailable');
    let ready,failReady,finish,failFinish;
    const transition={
      ready:new Promise((resolve,reject)=>{ready=resolve;failReady=reject;}),
      finished:new Promise((resolve,reject)=>{finish=resolve;failFinish=reject;}),
      skipped:false,
      skipTransition(){this.skipped=true;finish();},
      update(){update();ready();},
      finish,
      fail(){failReady(Error('Snapshot interrupted'));failFinish(Error('Snapshot interrupted'));}
    };
    transitions.push(transition);return transition;
  };
  vm.runInNewContext(source, {
    document,window:{addEventListener:(name,fn)=>{listeners[name]=fn;}},
    matchMedia:query=>(media[query]={matches:query.includes('color-scheme')?dark:reduce,addEventListener:(_,fn)=>{media[query].change=fn;}}),
    localStorage:{getItem:k=>{if(denied)throw Error('Blocked');return store.get(k)??null;},setItem:(k,v)=>{if(denied)throw Error('Blocked');store.set(k,v);}},
    setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)
  });
  return {root,button,meta,store,media,timers,transitions,
    click:event=>listeners.click(event||{target:{closest:()=>button}}),
    storage:value=>listeners.storage({key:'libero-theme',newValue:value}),
    system(value){const m=media['(prefers-color-scheme: dark)'];m.matches=value;m.change();},
    reduced(){const m=media['(prefers-reduced-motion: reduce)'];m.matches=true;m.change();}
  };
}

test('First paint follows the system; a valid saved choice overrides it',()=>{
  assert.equal(setup({dark:true}).root.dataset.theme,'dark');
  assert.equal(setup({dark:false}).root.dataset.theme,'light');
  assert.equal(setup({dark:true,saved:'light'}).root.dataset.theme,'light');
  assert.equal(setup({dark:false,saved:'dark'}).root.style.colorScheme,'dark');
  assert.equal(setup({dark:true,saved:'invalid'}).root.dataset.theme,'dark');
});
test('Manual choice persists and takes priority over later system changes',()=>{
  const s=setup();s.click();s.system(false);
  assert.equal(s.store.get('libero-theme'),'dark');
  assert.equal(s.root.dataset.theme,'dark');
  assert.equal(s.button.attrs['aria-label'],'Switch to light theme');
  assert.equal(s.meta.content,'#121619');
  s.click();assert.equal(s.meta.content,'#ffffff');
});
test('System changes and other tabs sync until a manual preference exists',()=>{
  const s=setup();s.system(true);assert.equal(s.root.dataset.theme,'dark');
  s.storage('light');s.system(true);assert.equal(s.root.dataset.theme,'light');
  s.storage(null);assert.equal(s.root.dataset.theme,'dark');
});
test('Blocked storage still permits switching themes',()=>{
  const s=setup({denied:true});s.click();assert.equal(s.root.dataset.theme,'dark');
  s.click();assert.equal(s.root.dataset.theme,'light');
});
test('Fallback switches immediately without creating per-element color animations',()=>{
  const s=setup();s.click();s.click();s.click();
  assert.equal(s.timers.size,0);assert(!s.root.classList.has('theme-changing'));
  assert.equal(s.root.dataset.theme,'dark');assert.equal(s.store.get('libero-theme'),'dark');
});
test('Reduced motion bypasses transitions and cancels an in-flight effect',()=>{
  const s=setup({reduce:true,snapshots:true});s.click();
  assert.equal(s.timers.size,0);assert.equal(s.root.dataset.theme,'dark');
  assert.equal(s.transitions.length,0);
  const t=setup({snapshots:true});t.click();t.reduced();
  assert(t.transitions[0].skipped);assert(!t.root.classList.has('theme-transition'));assert.equal(t.root.dataset.theme,'dark');
  t.transitions[0].update();assert.equal(t.root.dataset.theme,'dark');
});

test('Native snapshots capture the final palette and release the transition class',async()=>{
  const s=setup({snapshots:true});assert.equal(s.transitions.length,0);
  s.click();assert.equal(s.store.get('libero-theme'),'dark');
  assert.equal(s.root.dataset.theme,'light');assert(s.root.classList.has('theme-transition'));
  s.transitions[0].update();assert.equal(s.root.dataset.theme,'dark');
  s.transitions[0].finish();await Promise.resolve();
  assert(!s.root.classList.has('theme-transition'));
});
test('Rapid snapshot switches ignore stale callbacks and cleanup from older transitions',async()=>{
  const s=setup({snapshots:true});s.click();s.transitions[0].update();
  s.click();assert(s.transitions[0].skipped);
  s.transitions[0].finish();await Promise.resolve();
  assert(s.root.classList.has('theme-transition'));
  s.transitions[1].update();assert.equal(s.root.dataset.theme,'light');
  s.click();s.transitions[1].update();assert.equal(s.root.dataset.theme,'light');
  s.transitions[2].update();assert.equal(s.root.dataset.theme,'dark');
  assert.equal(s.store.get('libero-theme'),'dark');
  s.transitions[2].finish();await Promise.resolve();assert(!s.root.classList.has('theme-transition'));
});
test('Cross-tab updates cancel a pending snapshot without replaying a stale choice',()=>{
  const s=setup({snapshots:true});s.click();s.storage('light');
  assert(s.transitions[0].skipped);assert.equal(s.root.dataset.theme,'light');
  s.transitions[0].update();assert.equal(s.root.dataset.theme,'light');
  assert(!s.root.classList.has('theme-transition'));
});
test('A click on the snapshot over the theme control cancels it; other locations do not toggle',()=>{
  const s=setup({snapshots:true});s.root.closest=()=>null;
  s.click();s.transitions[0].update();
  s.click({target:s.root,button:0,clientX:20,clientY:20});
  assert.equal(s.store.get('libero-theme'),'dark');assert(!s.transitions[0].skipped);
  s.click({target:s.root,button:0,clientX:122,clientY:42});
  assert.equal(s.store.get('libero-theme'),'light');assert(s.transitions[0].skipped);
});
test('Snapshot failures fall back to the chosen palette without unhandled rejections',async()=>{
  const s=setup({snapshots:true,broken:true});s.click();
  assert.equal(s.root.dataset.theme,'dark');assert(!s.root.classList.has('theme-transition'));
  const t=setup({snapshots:true});t.click();t.transitions[0].fail();
  await Promise.resolve();assert.equal(t.root.dataset.theme,'dark');assert(!t.root.classList.has('theme-transition'));
});
