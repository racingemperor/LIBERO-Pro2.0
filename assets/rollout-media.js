const supplementalRepositories={"fastwam":{"libero_10-8":5,"libero_10-5":6,"libero_goal-3":8,"libero_spatial-8":8,"libero_goal-6":7,"libero_spatial-0":6,"libero_object-8":5,"libero_object-1":7},"openvla-oft":{"libero_10-8":7,"libero_goal-3":8,"libero_10-5":6,"libero_goal-6":5,"libero_object-8":8,"libero_object-1":7,"libero_spatial-8":6,"libero_spatial-0":5}};
const supplementalRevisions={"7":"6bc96444b0c830f633bc502f5f073a63965f517a","8":"49e0a237002ec58239a3c095d816410392db4bfc","6":"858f04d02f8aa72a8f4483e475b80b8c8da41b96","5":"68c93046b49cb62f0efd15289bbe8c9697245e14"};
const supplementalLargeVideos={"fastwam":["libero_10-5","libero_10-8","libero_goal-3","libero_goal-6","libero_spatial-0","libero_spatial-8"],"openvla-oft":["libero_10-8"]};

// Keep the companion-hosted recordings explicit, preserving existing Base clips.
export function rolloutMediaPaths(model, task, variant) {
  if(typeof model!=='string'||!/^[a-z0-9-]+$/.test(model)||
     typeof task!=='string'||!/^libero_(spatial|object|goal|10)-\d+$/.test(task)||
     typeof variant!=='string'||!/^(BASE|[SD]\d{2})$/.test(variant))return null;
  const supplemental=supplementalRepositories[model]?.[task];
  if(supplemental&&variant!=='BASE'){
    const stem=`https://raw.githubusercontent.com/racingemperor/LIBERO-Pro-media-${supplemental}/${supplementalRevisions[supplemental]}/assets/rollouts/models/${model}/${task}/${variant}`;
    const large=variant==='S19'&&supplementalLargeVideos[model]?.includes(task);
    const src=large?`https://racingemperor.github.io/LIBERO-Pro-media-${supplemental}/assets/rollouts/models/${model}/${task}/${variant}.mp4`:stem+'.mp4';
    return {src,poster:stem+'.webp'};
  }
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
