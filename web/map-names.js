const templates=new Set(['Cloud Kingdom','Neon District','Molten Canyon','Lost Islands','Crystal Industries','Neon Empire','Molten Industries','Bloom Industries','Meine Map']);
export const isTemplateName=name=>!String(name||'').trim()||templates.has(String(name).trim());
const words={
 tycoon:{
  sky:[['Prismen','Kristall','Quarz','Sternen','Opal','Mond','Glanz','Aurora'],['hafen','quell','spitze','garten','hain','bucht','krone','licht']],
  neon:[['Photonen','Pixel','Laser','Impuls','Plasma','Funken','Flux','Licht'],['hafen','kern','bogen','stadt','werk','quelle','tor','netz']],
  lava:[['Glut','Magma','Basalt','Asche','Feuer','Lava','Funken','Vulkan'],['schmiede','kern','krone','fels','quelle','hafen','tal','berg']],
  jungle:[['Blüten','Moos','Ranken','Farn','Smaragd','Wurzel','Tropen','Blatt'],['quell','hain','garten','hafen','krone','tal','oase','wald']]
 },
 obby:{
  sky:[['Wolken','Himmels','Sternen','Mond','Feder','Wind','Traum','Licht'],['sprung','pfad','reise','inseln','flug','bogen','steg','tor']],
  neon:[['Neon','Pixel','Laser','Impuls','Plasma','Funken','Flux','Licht'],['sprung','pfad','reise','stadt','flug','bogen','steg','tor']],
  lava:[['Glut','Magma','Basalt','Asche','Feuer','Lava','Funken','Vulkan'],['sprung','pfad','reise','inseln','flug','bogen','steg','tor']],
  jungle:[['Blüten','Moos','Ranken','Farn','Smaragd','Wurzel','Tropen','Blatt'],['sprung','pfad','reise','inseln','flug','bogen','steg','tor']]
 }
};
const hash=text=>{let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function proposeMapName(config,entropy=''){
 const mode=config.mode==='tycoon'?'tycoon':'obby',theme=Object.hasOwn(words[mode],config.theme)?config.theme:'sky';
 const [starts,ends]=words[mode][theme],labels=mode==='tycoon'?['Tycoon','Werke','Fabrik','Manufaktur']:['Obby','Parcours','Abenteuer'];
 const count=starts.length*ends.length*labels.length,initial=hash(`${mode}|${theme}|${config.seed}|${entropy}`)%count;
 for(let offset=0;offset<count;offset++){
  const index=(initial+offset)%count,name=starts[index%starts.length]+ends[Math.floor(index/starts.length)%ends.length]+' '+labels[Math.floor(index/(starts.length*ends.length))];
  if(name!==config.name)return name;
 }
 throw Error('Kein neuer Map-Name verfügbar.');
}
export function nameForGeneration(config,entropy=''){
 return {...config,...(config.autoName?{name:proposeMapName(config,entropy)}:{})};
}
