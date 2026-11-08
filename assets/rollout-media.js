// Keep the companion-hosted recordings explicit, preserving existing Base clips.
export function rolloutMediaPaths(model, task, variant) {
  if(typeof model!=='string'||!/^[a-z0-9-]+$/.test(model)||
     typeof task!=='string'||!/^libero_(spatial|object|goal|10)-\d+$/.test(task)||
     typeof variant!=='string'||!/^(BASE|[SD]\d{2})$/.test(variant))return null;
  const nativePi05=model==='pi0-5'&&variant!=='BASE';
  const relocated=['anchor-align','cosmos-policy','gr00t-n1-7','openvla-oft-m'].includes(model)?4:
    (['molmoact2','ript-vla','xvla'].includes(model)||['pi0','pi0-5'].includes(model)&&variant==='BASE')?2:0;
  const repository=relocated?`LIBERO-Pro-media-${relocated}`:model==='pi0-fast'?'LIBERO-Pro-media-4':
    ['openvla','openvla-oft-w'].includes(model)?'LIBERO-Pro-media-2':
    (['openvla-oft-plus','univla'].includes(model)||model==='pi0'&&variant!=='BASE')?'LIBERO-Pro-media-3':
    (['nora','worldvla'].includes(model)||nativePi05)?'LIBERO-Pro-media':'';
  const revision=relocated===2?'7aa1997986ba7d382d8defbf3069c8c9fdd37294':'a852bda9d58aa4615d74362cab168c18a716f8b9';
  const base=relocated?`https://raw.githubusercontent.com/racingemperor/${repository}/${revision}/`:
    repository==='LIBERO-Pro-media-2'
    ?'https://raw.githubusercontent.com/racingemperor/LIBERO-Pro-media-2/1c262f27cdaad4ad786091704fd90ef91775840f/'
    :repository==='LIBERO-Pro-media-4'
    ?'https://raw.githubusercontent.com/racingemperor/LIBERO-Pro-media-4/45056eabdebe226dfb0188732b26fd14593e9005/'
    :repository?`https://racingemperor.github.io/${repository}/`:'';
  const directory=nativePi05?'pi0-5-native640-20261029':model;
  const stem=`${base}assets/rollouts/models/${directory}/${task}/${variant}`;
  return {src:stem+'.mp4',poster:stem+'.webp'};
}
