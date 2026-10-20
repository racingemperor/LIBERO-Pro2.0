const mediaRoot='https://racingemperor.github.io/LIBERO-Pro-media/assets/rollouts/training';

export function trainingMediaPaths(task,perturbation='BASE') {
  if(!/^libero_(?:spatial|object|goal|10)-[0-9]$/.test(task)||!/^(?:BASE|S(?:0[1-9]|1[0-9]|2[0-2])|D(?:0[1-9]|1[0-9]|20))$/.test(perturbation))return null;
  const stem=perturbation==='BASE'?`${mediaRoot}/base/${task}`:`${mediaRoot}/perturbations/${perturbation}/${task}`;
  return {src:`${stem}.mp4`,poster:`${stem}.webp`};
}

export function trainingGallery(perturbation,clips,{escape,instruction}) {
  if(!clips?.length)return '';
  const rows=Array.from({length:5},(_,row)=>{
    const originals=clips.filter((_,index)=>index%5===row);
    // Keep all five rows when a perturbation has fewer than five previews.
    // Fallback rows are visual copies, never additional distinct tasks.
    const entries=originals.length?originals:[clips[row%clips.length]];
    const card=(clip,duplicate)=>`<figure class="gallery-item"><video class="gallery-video" data-src="${escape(clip.src)}" poster="${escape(clip.poster)}" width="256" height="256" controls muted loop playsinline preload="none" ${duplicate?'tabindex="-1"':''} aria-label="${escape(perturbation+': '+instruction(clip.task))}"></video></figure>`;
    // Eight cards cover the site's maximum content width, including on resize.
    // Each distinct task is exposed once to assistive technology.
    const copies=Math.max(3,Math.ceil(8/entries.length)+1);
    const groups=Array.from({length:copies},(_,copy)=>{
      const duplicate=copy>0||!originals.length;
      return `<div class="gallery-group" ${duplicate?'aria-hidden="true"':''}>${entries.map(clip=>card(clip,duplicate)).join('')}</div>`;
    }).join('');
    return `<div class="gallery-viewport" data-training-row data-direction="${row%2?'left':'right'}" tabindex="0" role="region" aria-label="Training demonstrations, row ${row+1}, scroll to explore"><div class="gallery-track">${groups}</div></div>`;
  }).join('');
  return `<div class="training-gallery gallery-rows" data-training-gallery>${rows}</div>`;
}

export function bindTrainingGallery() {
  const root=document.querySelector('[data-training-gallery]');
  if(!root)return;
  const controller=new AbortController(),options={signal:controller.signal};
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const rows=[...root.querySelectorAll('[data-training-row]')].map(view=>({view,visible:false,position:0,span:0,holdUntil:0}));
  const videos=[...root.querySelectorAll('video')].map(video=>({video,visible:false,userPaused:false,userStarted:false,pending:false,managedPlays:0,managedPauses:0}));
  let frame,last=0,disposed=false;
  const pause=item=>{if(!item.video.paused){item.managedPauses++;item.video.pause();}};
  const sync=()=>{
    for(const item of videos){
      const {video}=item;
      if(item.visible&&!video.getAttribute('src'))video.src=video.dataset.src;
      if(item.visible&&!document.hidden&&(!preference.matches||item.userStarted)&&!item.userPaused){
        if(item.pending||!video.paused)continue;
        video.muted=true;
        item.pending=true;
        // An aborted play promise settles before the queued pause event. Do
        // not retry here: the visitor's pause intent has not been read yet.
        const playback=video.play();
        if(!video.paused)item.managedPlays++;
        playback.catch(()=>{}).finally(()=>{item.pending=false;});
      }else pause(item);
    }
  };
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const item=videos.find(item=>item.video===entry.target);
      const row=rows.find(row=>row.view===entry.target);
      if(item)item.visible=entry.isIntersecting;
      if(row)row.visible=entry.isIntersecting;
    }
    sync();
  },{threshold:.05});
  const measure=row=>{
    const span=row.view.querySelector('.gallery-group').getBoundingClientRect().width;
    if(!span)return;
    row.position=row.span?row.position/row.span*span:(row.view.dataset.direction==='right'?span:0);
    row.span=span;row.view.scrollLeft=row.position;
  };
  const resize=new ResizeObserver(entries=>entries.forEach(entry=>measure(rows.find(row=>row.view===entry.target))));
  for(const item of videos){
    observer.observe(item.video);
    item.video.addEventListener('pause',()=>{
      if(item.managedPauses)item.managedPauses--;
      else {item.userPaused=true;item.userStarted=false;}
      // Media events are queued. A play requested before this pause was read
      // must also be stopped once the visitor's intent becomes known.
      if(!disposed)sync();
    },options);
    item.video.addEventListener('play',()=>{
      if(item.managedPlays)item.managedPlays--;
      else {item.userPaused=false;item.userStarted=true;}
      if(!disposed)sync();
    },options);
    item.video.addEventListener('canplay',sync,options);
  }
  for(const row of rows){
    measure(row);observer.observe(row.view);resize.observe(row.view);
    const hold=()=>{row.holdUntil=performance.now()+1800;};
    row.view.addEventListener('keydown',hold,options);
    row.view.addEventListener('pointerdown',hold,options);
    row.view.addEventListener('wheel',event=>{
      if(event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))hold();
    },{...options,passive:true});
  }
  document.addEventListener('visibilitychange',sync,options);
  preference.addEventListener('change',()=>{videos.forEach(item=>{item.userStarted=false;});sync();},options);
  const tick=now=>{
    if(disposed)return;
    const delta=last?Math.min(now-last,100):0;last=now;
    if(!document.hidden&&!preference.matches)for(const row of rows){
      if(!row.visible||now<row.holdUntil||row.view.matches(':hover,:focus-within')){row.position=row.view.scrollLeft;continue;}
      if(!row.span)continue;
      row.position=(row.position+delta*.022*(row.view.dataset.direction==='right'?-1:1)+row.span)%row.span;
      row.view.scrollLeft=row.position;
    }
    frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>{
    disposed=true;controller.abort();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
    videos.forEach(({video})=>{
      video.pause();
      if(!video.isConnected){video.removeAttribute('src');video.load();}
    });
  };
}
