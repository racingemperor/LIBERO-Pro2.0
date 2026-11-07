// Keep the companion-hosted recordings explicit, preserving existing Base clips.
export function rolloutMediaPaths(model, task, variant) {
  if(typeof model!=='string'||!/^[a-z0-9-]+$/.test(model)||
     typeof task!=='string'||!/^libero_(spatial|object|goal|10)-\d+$/.test(task)||
     typeof variant!=='string'||!/^(BASE|[SD]\d{2})$/.test(variant))return null;
  const nativePi05=model==='pi0-5'&&variant!=='BASE';
  const repository=['openvla','openvla-oft-w'].includes(model)?'LIBERO-Pro-media-2':
    (['openvla-oft-plus','univla'].includes(model)||model==='pi0'&&variant!=='BASE')?'LIBERO-Pro-media-3':
    (['nora','worldvla'].includes(model)||nativePi05)?'LIBERO-Pro-media':'';
  const base=repository==='LIBERO-Pro-media-2'
    ?'https://raw.githubusercontent.com/racingemperor/LIBERO-Pro-media-2/1c262f27cdaad4ad786091704fd90ef91775840f/'
    :repository?`https://racingemperor.github.io/${repository}/`:'';
  const directory=nativePi05?'pi0-5-native640-20261029':model;
  const stem=`${base}assets/rollouts/models/${directory}/${task}/${variant}`;
  return {src:stem+'.mp4',poster:stem+'.webp'};
}
