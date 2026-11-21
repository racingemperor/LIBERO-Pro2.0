// Version-pinned public media, preserving the existing gallery coverage.
export const hfMediaRoot='https://huggingface.co/datasets/racingemperor/LIBERO-Pro-Videos/resolve/eeff29d265e62d6ea269fe75d5344b3cffc7b041/';
export const cloudroboMediaRoot='https://huggingface.co/datasets/racingemperor/LIBERO-Pro-Videos/resolve/7d1c811249101881ea5bf300ef38a06a4d12875d/';

export const pi0MediaRoot='https://huggingface.co/datasets/racingemperor/LIBERO-Pro-Videos/resolve/321de07e2922c2a8e837a6d6db8e6a3cf9d0ac23/';

export function rolloutMediaPaths(model, task, variant) {
  if(typeof model!=='string'||!/^[a-z0-9-]+$/.test(model)||
     typeof task!=='string'||!/^libero_(spatial|object|goal|10)-\d+$/.test(task)||
     typeof variant!=='string'||!/^(BASE|[SD]\d{2})$/.test(variant))return null;
  const directory=model==='pi0'?'pi0-test8-20261121':model==='pi0-5'&&variant!=='BASE'?'pi0-5-native640-20261029':model;
  const root=model==='pi0'?pi0MediaRoot:model==='cloudrobo-wm'?cloudroboMediaRoot:hfMediaRoot;
  const stem=`${root}assets/rollouts/models/${directory}/${task}/${variant}`;
  return {src:stem+'.mp4',poster:stem+'.webp'};
}
