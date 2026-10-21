// State contract for the early initializer; run with node --test scripts/theme-test.mjs.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source = readFileSync(new URL('../assets/theme.js', import.meta.url), 'utf8');
function setup({saved=null, dark=false, reduce=false, denied=false}={}) {
  const listeners = {}, media = {}, store = new Map(saved === null ? [] : [['libero-theme',saved]]);
  const root = {dataset:{},style:{},classList:new Set()};
  root.classList.remove = root.classList.delete;
  const button = {attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
  const meta = {setAttribute(k,v){this[k]=v;}};
  const timers = new Map();let timerId=0;
  const document = {
    documentElement:root,
    querySelector:()=>meta,
    querySelectorAll:()=>[button],
    addEventListener:(name,fn)=>{listeners[name]=fn;}
  };
  vm.runInNewContext(source, {
    document,window:{addEventListener:(name,fn)=>{listeners[name]=fn;}},
    matchMedia:query=>(media[query]={matches:query.includes('color-scheme')?dark:reduce,addEventListener:(_,fn)=>{media[query].change=fn;}}),
    localStorage:{getItem:k=>{if(denied)throw Error('Blocked');return store.get(k)??null;},setItem:(k,v)=>{if(denied)throw Error('Blocked');store.set(k,v);}},
    setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)
  });
  return {root,button,meta,store,media,timers,
    click:()=>listeners.click({target:{closest:()=>button}}),
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
test('Rapid clicks apply the latest choice immediately and replace the cleanup timer',()=>{
  const s=setup();s.click();s.click();s.click();
  assert.equal(s.timers.size,1);assert(s.root.classList.has('theme-changing'));
  assert.equal(s.root.dataset.theme,'dark');assert.equal(s.store.get('libero-theme'),'dark');
  [...s.timers.values()][0]();assert(!s.root.classList.has('theme-changing'));
  assert.equal(s.root.dataset.theme,'dark');
});
test('Reduced motion bypasses transitions and cancels an in-flight effect',()=>{
  const s=setup({reduce:true});s.click();
  assert.equal(s.timers.size,0);assert.equal(s.root.dataset.theme,'dark');
  assert(!s.root.classList.has('theme-changing'));
  const t=setup();t.click();t.reduced();
  assert.equal(t.timers.size,0);assert(!t.root.classList.has('theme-changing'));assert.equal(t.root.dataset.theme,'dark');
});
