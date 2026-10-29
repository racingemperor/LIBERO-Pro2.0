// Keep the companion-hosted recordings explicit, preserving existing Base clips.
export function rolloutMediaPaths(model, task, variant) {
  if(typeof model!=='string'||!/^[a-z0-9-]+$/.test(model)||
     typeof task!=='string'||!/^libero_(spatial|object|goal|10)-\d+$/.test(task)||
     typeof variant!=='string'||!/^(BASE|[SD]\d{2})$/.test(variant))return null;
  const nativePi05=model==='pi0-5'&&variant!=='BASE';
  const base=model==='nora'||nativePi05?'https://racingemperor.github.io/LIBERO-Pro-media/':'';
  const directory=nativePi05?'pi0-5-native640-20261029':model;
  const stem=`${base}assets/rollouts/models/${directory}/${task}/${variant}`;
  return {src:stem+'.mp4',poster:stem+'.webp'};
}
