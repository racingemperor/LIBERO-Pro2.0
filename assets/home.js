const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function homeFilm() {
  return `<section class="home-film" id="benchmark-video" aria-label="LIBERO-Pro2.0 benchmark video"><figure>
    <video data-home-video controls playsinline preload="none" width="1920" height="1080" poster="https://racingemperor.github.io/LIBERO-Pro-media/assets/promo/libero-pro2.0-overview-opening-20261022.webp" aria-label="LIBERO-Pro2.0: A Benchmark for Evaluating Robust Embodied Intelligence, 90-second overview"><source src="https://racingemperor.github.io/LIBERO-Pro-media/assets/promo/libero-pro2.0-overview-20261022.mp4" type="video/mp4"></video>
    <button class="home-film-play" data-home-film-play hidden aria-label="Play LIBERO-Pro2.0 video"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 5v14l11-7z"/></svg></span></button>
  </figure></section>`;
}

export function bindHomeFilm() {
  const video=document.querySelector('[data-home-video]');
  const button=document.querySelector('[data-home-film-play]');
  if(!video||!button)return;
  let warmed=false,observer;
  const warm=()=>{
    if(warmed||!video.isConnected)return;
    warmed=true;
    observer?.disconnect();
    video.preload='auto';
    // Loading a video already playing would reset its position and cancel play().
    if(video.paused&&video.readyState===0)video.load();
  };
  if('IntersectionObserver' in window&&!navigator.connection?.saveData){
    observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))warm();
    },{rootMargin:'800px 0px'});
    observer.observe(video);
  }
  const figure=video.closest('figure');
  figure.addEventListener('pointerenter',warm,{once:true});
  figure.addEventListener('focusin',warm,{once:true});
  video.addEventListener('play',warm,{once:true});
  const sync=()=>{
    if(!video.paused&&document.activeElement===button)video.focus({preventScroll:true});
    button.hidden=!video.paused;
    button.setAttribute('aria-label',video.ended?'Replay LIBERO-Pro2.0 video':'Play LIBERO-Pro2.0 video');
  };
  button.addEventListener('click',()=>{
    warm();
    if(video.ended)video.currentTime=0;
    video.play().catch(sync);
  });
  for(const event of ['play','pause','ended','error'])video.addEventListener(event,sync);
  sync();
  return ()=>{observer?.disconnect();video.pause();};
}

export function homeNews(entries) {
  const dateFormat = new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
  const link = entry => /^https?:\/\//.test(entry.link?.url||'') ? ` <a href="${escape(entry.link.url)}" target="_blank" rel="noopener">${escape(entry.link.label)}</a>` : '';
  return `<section class="section home-news" id="news" aria-labelledby="home-news-title"><div class="home-news-inner">
    <h2 id="home-news-title">News</h2>
    <div class="home-news-card"><div class="home-news-scroll" tabindex="0" role="region" aria-label="Project news, scroll for earlier updates"><ul class="home-news-timeline">${entries.map((entry,index)=>`<li class="home-news-item${index===0?' is-latest':''}">
      <time class="home-news-date" datetime="${escape(entry.date)}"><span>${dateFormat.format(new Date(entry.date+'T00:00:00Z'))}</span><small>${escape(entry.date.slice(0,4))}</small></time>
      <div class="home-news-body"><p>${escape(entry.title||entry.text)}${link(entry)}${escape(entry.textAfterLink||'')}</p></div>
    </li>`).join('')}</ul></div></div>
  </div></section>`;
}

export function bindHomeNews() {
  const scroller = document.querySelector('.home-news-scroll');
  if (!scroller) return;
  const card = scroller.closest('.home-news-card');
  const updateFade = () => card.classList.toggle('is-at-end',scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop<=2);
  scroller.addEventListener('scroll',updateFade,{passive:true});
  const resize = new ResizeObserver(updateFade);
  resize.observe(scroller);
  resize.observe(scroller.querySelector('ul'));
  updateFade();
  return ()=>resize.disconnect();
}

export function homeShowcase(catalogue) {
  // Reuse the public, correctly oriented clips. Repeated tiles are decorative,
  // and never represent additional tasks or demonstrations.
  const columns = [
    ['S01','D04','S15','D17'], ['D01','S13','D12','S22'],
    ['S17','D07','S02','D15'], ['D18','S06','D02','S19'],
    ['S10','D10','S18','D06'], ['D03','S16','D09','S11']
  ];
  const wall = columns.map((ids,index)=>`<div class="hero-wall-column" style="--column:${index}"><div class="hero-wall-track">${[0,1,2].map(()=>`<div class="hero-wall-group">${ids.map(id=>{
    const clip=homePreviewClip(id);
    return `<div class="hero-wall-tile"><video data-hero-clip data-src="${clip.src}" poster="${clip.poster}" width="256" height="256" muted loop playsinline preload="none" tabindex="-1" disablepictureinpicture></video></div>`;
  }).join('')}</div>`).join('')}</div></div>`).join('');
  return `<section class="home-showcase" aria-labelledby="home-title">
    <div class="hero-wall" aria-hidden="true">${wall}</div>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-content">
      <h1 id="home-title">LIBERO-Pro2.0</h1>
      <p class="hero-subtitle">A Benchmark for Evaluating Robust Embodied Intelligence</p>
      <dl class="hero-statistics" aria-label="Benchmark scale">
        <div><dt>Perturbation types</dt><dd>${catalogue.perturbations.length}</dd></div>
        <div><dt>Task–perturbation instances</dt><dd>1,646</dd></div>
        <div><dt>Demonstration trajectories</dt><dd>39,390</dd></div>
      </dl>
    </div>
  </section>`;
}

function homePreviewClip(id) {
  const base = `assets/rollouts/home/pi0-5/${id}`;
  return {src:`${base}.mp4`,poster:`${base}.webp`};
}

export function perturbationClip(id) {
  const base = `assets/rollouts/documents/${id}`;
  return {src:`${base}.mp4`,poster:`${base}.webp`};
}

export function homeGallery(catalogue, mode) {
  const entries = catalogue.perturbations.filter(p=>p.mode===mode);
  // One shuffled arrangement, interleaving tasks and scenes in the current
  // recordings. Each row also separates matching tasks across its loop seam.
  const order = {
    static: [
      ['S09','S08','S03','S06','S17','S01','S05','S16'],
      ['S15','S02','S18','S20','S22','S14','S12','S13'],
      ['S21','S10','S07','S11','S19','S04']
    ],
    dynamic: [
      ['D16','D18','D08','D19','D12','D09','D17'],
      ['D05','D01','D10','D03','D14','D06','D07'],
      ['D04','D15','D20','D02','D11','D13']
    ]
  };
  const card = (p, duplicate) => {
    const clip = homePreviewClip(p.id);
    return `<a class="gallery-item" href="docs.html?perturbation=${p.id}" ${duplicate?'tabindex="-1"':''} aria-label="${p.id}: ${escape(p.name)} — open perturbation design"><video class="gallery-video" data-src="${escape(clip.src)}" poster="${escape(clip.poster)}" width="256" height="256" muted loop playsinline preload="none" aria-hidden="true" disablepictureinpicture></video></a>`;
  };
  // Keep each perturbation once in the reading order. Two visual copies cover
  // the full viewport through the seam even for the shortest six-card row.
  const rows = order[mode].map((ids,i)=>{
    const items = ids.map(id=>entries.find(p=>p.id===id));
    return `<div class="gallery-viewport" data-gallery-row data-direction="${i===1?'left':'right'}" tabindex="0" role="region" aria-label="${mode} examples, row ${i+1}, scroll to explore"><div class="gallery-track">${[false,true,true].map(duplicate=>`<div class="gallery-group" ${duplicate?'aria-hidden="true"':''}>${items.map(p=>card(p,duplicate)).join('')}</div>`).join('')}</div></div>`;
  }).join('');
  return `<section class="section gallery-section" id="${mode}-gallery" data-gallery="${mode}"><div class="section-head"><h2>${mode==='static'?'Static shifts':'Dynamic interventions'}</h2></div><div class="gallery-rows">${rows}</div><a class="text-link gallery-all" href="docs.html#${mode}-perturbations">View all ${entries.length} ${mode} perturbations ↗</a></section>`;
}

export function homeModels(models, upcoming, assets, modelUrl) {
  const tested = [...models].sort((a,b)=>(b.scores.overall??-1)-(a.scores.overall??-1));
  const planned = upcoming.filter(model=>!models.some(tested=>tested.id===model.id));
  const label = model => {
    const asset = assets[model.id];
    const image = asset.asset ? `<img src="assets/models/${escape(asset.asset)}" width="32" height="32" alt="" aria-hidden="true" title="${escape(asset.credit)}" loading="lazy">` : '<span class="home-model-logo-pending" aria-hidden="true"></span>';
    return `${image}<span>${escape(model.name)}</span>`;
  };
  return `<section class="section home-models" id="models">
    <div class="section-head"><h2 id="tested-models-heading">Tested models</h2></div>
    <ul class="home-model-list" aria-labelledby="tested-models-heading">${tested.map(model=>`<li><a class="home-model-chip" href="${modelUrl(model)}">${label(model)}</a></li>`).join('')}</ul>
    <div class="home-models-upcoming"><div class="section-head"><h2 id="upcoming-models-heading">Upcoming models</h2></div>
      ${planned.length?`<ul class="home-model-list" aria-labelledby="upcoming-models-heading">${planned.map(model=>`<li><span class="home-model-chip is-upcoming">${label(model)}</span></li>`).join('')}</ul>`:'<p class="home-models-empty">To be announced.</p>'}
    </div>
  </section>`;
}

export function bindHomePresentation() {
  if (!document.querySelector('.home-showcase')) return;
  const controller=new AbortController();
  let copyTimer,observer;
  const release=()=>{controller.abort();clearTimeout(copyTimer);observer?.disconnect();};
  const copy = document.querySelector('[data-copy-citation]');
  copy?.addEventListener('click', async () => {
    const text = document.querySelector('.citation-code code')?.textContent.trim();
    if (!text) return;
    const status = document.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(text);
      if(controller.signal.aborted)return;
      clearTimeout(copyTimer);
      copy.dataset.copied = 'true';
      copy.setAttribute('aria-label','Citations copied');
      copy.title = 'Copied';
      status.classList.remove('caption');
      status.classList.add('sr-only');
      status.textContent = 'Citations copied to clipboard.';
      copyTimer=setTimeout(() => {
        delete copy.dataset.copied;
        copy.setAttribute('aria-label','Copy BibTeX');
        copy.title = 'Copy BibTeX';
        status.textContent = '';
      }, 2500);
    } catch {
      if(controller.signal.aborted)return;
      clearTimeout(copyTimer);
      delete copy.dataset.copied;
      copy.setAttribute('aria-label','Copy BibTeX');
      copy.title = 'Copy BibTeX';
      status.classList.remove('sr-only');
      status.classList.add('caption');
      status.textContent = 'Select the citation text and copy it manually.';
    }
  },{signal:controller.signal});

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  // Content remains visible if motion is disabled or observation is unavailable.
  if (preference.matches || !('IntersectionObserver' in window)) return release;
  const blocks = [...document.querySelectorAll('.home-body > .section, .paper-intro > h2, .paper-meta')];
  const reveal = block => { block.classList.add('is-revealed'); observer.unobserve(block); };
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, {rootMargin: '0px 0px -40px 0px', threshold: 0});
  for (const block of blocks) {
    block.classList.add('home-reveal');
    observer.observe(block);
  }
  // Keyboard focus must never land on transparent content.
  document.querySelector('#content').addEventListener('focusin', event => {
    const block = event.target.closest('.home-reveal');
    if (block) reveal(block);
  },{signal:controller.signal});
  preference.addEventListener('change', event => {
    if (event.matches) { blocks.forEach(reveal); observer.disconnect(); }
  },{signal:controller.signal});
  return release;
}

function bindHeroBackdrop(root) {
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=preference.matches;
  const compact=matchMedia('(max-width:760px)');
  const connection=navigator.connection;
  const controller=new AbortController();
  const options={signal:controller.signal};
  const items=[...root.querySelectorAll('[data-hero-clip]')].map(video=>({video,visible:false,requested:false}));
  let visible=false;
  const sync=()=>{
    const moving=visible&&!document.hidden&&!reduced&&!connection?.saveData;
    root.dataset.moving=String(moving);
    // Bound simultaneous decoders, especially on phones. Remaining tiles keep
    // their posters while the wall moves; no extra media files are generated.
    const playing=moving?items.filter(item=>item.visible)
      .map(item=>({item,left:item.video.getBoundingClientRect().left}))
      .sort((a,b)=>b.left-a.left).slice(0,compact.matches?4:8).map(entry=>entry.item):[];
    for(const item of items){
      if(playing.includes(item)){
        if(item.requested)continue;
        item.requested=true;
        if(!item.video.getAttribute('src'))item.video.src=item.video.dataset.src;
        item.video.muted=true;
        item.video.play()?.catch(()=>{item.requested=false;});
      }else{
        item.requested=false;
        item.video.pause();
      }
    }
  };
  if(!('IntersectionObserver' in window))return;
  const sectionObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});
  const clipObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)items.find(item=>item.video===entry.target).visible=entry.isIntersecting&&entry.intersectionRatio>.05;
    sync();
  },{root,threshold:[0,.05]});
  sectionObserver.observe(root);
  items.forEach(item=>clipObserver.observe(item.video));
  const onPreference=event=>{reduced=event.matches;sync();};
  document.addEventListener('visibilitychange',sync,options);
  preference.addEventListener('change',onPreference);
  compact.addEventListener('change',sync);
  connection?.addEventListener('change',sync,options);
  return ()=>{
    controller.abort();sectionObserver.disconnect();clipObserver.disconnect();
    preference.removeEventListener('change',onPreference);
    compact.removeEventListener('change',sync);
    root.dataset.moving='false';items.forEach(item=>item.video.pause());
  };
}

export function bindHomeMotion() {
  const root = document.querySelector('.home-showcase');
  if (!root) return;
  const releaseBackdrop=bindHeroBackdrop(root);
  if (!('IntersectionObserver' in window)) return releaseBackdrop;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  // Keep the frame loop independent of live media-query reads. Chromium can
  // consume the pending change when matches is polled during an animation.
  let reduced=preference.matches;
  const compact = matchMedia('(max-width:760px)');
  const connection = navigator.connection;
  const controller = new AbortController();
  const options = {signal:controller.signal};
  let last=0, frame=0, resumeTimer;
  const rows = [...document.querySelectorAll('[data-gallery-row]')].map(view=>({
    view,visible:false,position:0,span:0,holdUntil:0,hovered:false,focused:false,
    videos:[...view.querySelectorAll('video')].map(video=>({video,visible:false,ratio:0,requested:false}))
  }));
  const videos=rows.flatMap(row=>row.videos);
  const rowByElement=new Map(rows.map(row=>[row.view,row]));
  const videoByElement=new Map(videos.map(item=>[item.video,item]));
  const motionAllowed=()=>!reduced&&!document.hidden&&!connection?.saveData;
  const availableRows=()=>motionAllowed()?rows.filter(row=>row.visible&&!row.hovered&&!row.focused):[];
  const syncMotion=()=>{
    clearTimeout(resumeTimer);
    const now=performance.now(), available=availableRows();
    if(available.some(row=>now>=row.holdUntil)){
      if(!frame){last=0;frame=requestAnimationFrame(tick);}
    }else{
      cancelAnimationFrame(frame);frame=0;last=0;
      if(available.length)resumeTimer=setTimeout(syncMotion,Math.min(...available.map(row=>row.holdUntil))-now+1);
    }
  };
  const syncVideos = () => {
    const playing=new Set();
    if(motionAllowed()){
      // Share a fixed decoder budget across visible rows, including when both
      // sections meet in the viewport. Other tiles retain their still posters.
      const buckets=rows.filter(row=>row.visible).map(row=>row.videos.filter(item=>item.visible)
        .sort((a,b)=>b.ratio-a.ratio||Number(b.requested)-Number(a.requested)));
      const limit=compact.matches?6:12;
      for(let i=0;playing.size<limit&&buckets.some(bucket=>i<bucket.length);i++){
        for(const bucket of buckets){
          if(bucket[i])playing.add(bucket[i]);
          if(playing.size===limit)break;
        }
      }
    }
    for (const item of videos) {
      const play = playing.has(item);
      if (play && !item.requested) {
        item.requested=true;
        if (!item.video.getAttribute('src')) item.video.src=item.video.dataset.src;
        item.video.muted=true;
        item.video.play()?.catch(()=>{item.requested=false;});
      } else if (!play) {
        item.requested=false;item.video.pause();
      }
    }
    syncMotion();
  };
  const observer = new IntersectionObserver(entries=>{
    for (const entry of entries) {
      const row=rowByElement.get(entry.target);
      if(row)row.visible=entry.isIntersecting;
      const item=videoByElement.get(entry.target);
      if(item){item.visible=entry.isIntersecting&&entry.intersectionRatio>.1;item.ratio=entry.intersectionRatio;}
    }
    syncVideos();
  },{threshold:[0,.1,.5,1]});
  const measure = row => {
    const span=row.view.querySelector('.gallery-group').getBoundingClientRect().width;
    if(!span)return;
    row.position=row.span?row.position/row.span*span:(row.view.dataset.direction==='right'?span:0);
    row.span=span;row.view.scrollLeft=row.position;
  };
  const resize=new ResizeObserver(entries=>entries.forEach(entry=>measure(rowByElement.get(entry.target))));
  videos.forEach(item=>observer.observe(item.video));
  for(const row of rows) {
    measure(row);observer.observe(row.view);resize.observe(row.view);
    // Hold only the row being browsed, then resume automatically. Videos
    // keep playing; vertical page scrolling does not interrupt either loop.
    const hold=()=>{row.holdUntil=performance.now()+1800;syncMotion();};
    row.view.addEventListener('scroll',()=>{
      if(row.hovered||row.focused||performance.now()<row.holdUntil)row.position=row.view.scrollLeft;
    },{...options,passive:true});
    row.view.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){row.hovered=true;syncMotion();}},options);
    row.view.addEventListener('pointerleave',()=>{row.hovered=false;syncMotion();},options);
    row.view.addEventListener('focusin',()=>{row.focused=true;syncMotion();},options);
    row.view.addEventListener('focusout',event=>{row.focused=row.view.contains(event.relatedTarget);syncMotion();},options);
    row.view.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))hold();},options);
    row.view.addEventListener('wheel',event=>{if(event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))hold();},{...options,passive:true});
    let gesture=null;
    row.view.addEventListener('pointerdown',event=>{gesture={x:event.clientX,y:event.clientY};},{...options,passive:true});
    row.view.addEventListener('pointermove',event=>{
      if(gesture&&Math.abs(event.clientX-gesture.x)>12&&Math.abs(event.clientX-gesture.x)>Math.abs(event.clientY-gesture.y))hold();
    },{...options,passive:true});
    for(const event of ['pointerup','pointercancel','pointerleave'])row.view.addEventListener(event,()=>{gesture=null;},{...options,passive:true});
  }
  const onPreference=event=>{reduced=event.matches;syncVideos();};
  document.addEventListener('visibilitychange',syncVideos,options);
  preference.addEventListener('change',onPreference);
  compact.addEventListener('change',syncVideos);
  connection?.addEventListener('change',syncVideos,options);
  const tick = now => {
    const dt = last ? Math.min(now-last,100) : 0;last=now;
    const active=availableRows().filter(row=>now>=row.holdUntil);
    for(const row of active) {
      if(!row.span)continue;
      row.position+=dt*.022*(row.view.dataset.direction==='right'?-1:1);
      row.position=(row.position+row.span)%row.span;
      row.view.scrollLeft=row.position;
    }
    if(active.length)frame=requestAnimationFrame(tick);
    else{frame=0;syncMotion();}
  };
  syncVideos();
  return ()=>{
    releaseBackdrop?.();
    controller.abort();clearTimeout(resumeTimer);
    preference.removeEventListener('change',onPreference);
    compact.removeEventListener('change',syncVideos);
    cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();
    videos.forEach(item=>item.video.pause());
  };
}
