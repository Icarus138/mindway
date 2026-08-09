/* Boot jsdom + régressions métier — MindWay V2 (méthode CLAUDE.md) */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs');
const path=require('path');
const FILE=process.argv[2]||path.join(__dirname,'..','index.html');
const html=fs.readFileSync(FILE,'utf8');

const errors=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push('jsdomError: '+e.message));
vc.on('error',(...a)=>errors.push('console.error: '+a.join(' ')));

const dom=new JSDOM(html,{
 url:'https://icarus138.github.io/mindway/',
 runScripts:'dangerously',
 pretendToBeVisual:true,
 virtualConsole:vc,
 beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.requestAnimationFrame=w.requestAnimationFrame||(cb=>setTimeout(()=>cb(0),16));
  w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollTo=function(){};
  w.AudioContext=undefined;w.webkitAudioContext=undefined;
 }
});

const w=dom.window,d=w.document;
const E=s=>w.eval(s);
const A=(name,cond)=>{const ok=!!cond;console.log((ok?'  ok ':'  FAIL ')+name);if(!ok)process.exitCode=1};

setTimeout(()=>{
 console.log('— BOOT —');
 A('zéro erreur jsdom', errors.length===0); if(errors.length)console.log(errors.slice(0,5));
 A('#inCTA rempli', d.getElementById('inCTA') && d.getElementById('inCTA').textContent.trim().length>0);
 A('classes ambiance sur #phone', /t-(dawn|day|dusk|night)/.test(d.getElementById('phone').className));

 console.log('— RÉGRESSION SCORING DÉMO —');
 const r1=E(`(()=>{const days=genDemo();let mism=0,checked=0;
  Object.values(days).forEach(dd=>{if(!dd.review||dd.off)return;checked++;
   const c=computeParts(dd,dd.review.estim);
   if(c.score!==dd.review.score||c.status!==dd.review.status)mism++});
  return{checked,mism}})()`);
 A('démo: '+r1.checked+' journées recalculées, 0 écart', r1.checked>0&&r1.mism===0);

 console.log('— INSIGHTS —');
 const r2=E(`(()=>{D.days=genDemo();D.settings.demo=true;const R=computeInsights();
  return{locked:R.locked,n:R.n,wins:R.wins,list:Array.isArray(R.list)}})()`);
 A('insights débloqués sur démo', r2.locked===false);
 A('structure insights (n, wins, list)', typeof r2.n==='number'&&typeof r2.wins==='number'&&r2.list);

 console.log('— FLOW COMPLET (secondaire >45 min via flowKeepSec) —');
 E(`D=blank();load&&0;D.rituals=[];D.backlog=[];startFlow()`);
 A('flow ouvert', E(`S.flow&&S.flow.step>=1`));
 E(`S.flow.items=[
  {id:'a1',title:'Priorité test',est:90,imp:3,urg:3},
  {id:'a2',title:'Secondaire classique',est:45,imp:2,urg:1},
  {id:'a3',title:'Grosse secondaire',est:75,imp:1,urg:2},
  {id:'a4',title:'Micro',est:10,imp:0,urg:0}];prepMit()`);
 A('MIT auto = plus haut score', E(`S.flow.mitId`)==='a1');
 E(`prepSec()`);
 A('prepSec conservateur (≤45 auto)', E(`S.flow.secIds.includes('a2')&&!S.flow.secIds.includes('a3')`));
 E(`flowKeepSec('a3')`);
 A('flowKeepSec: >45 min acceptée en secondaire', E(`S.flow.secIds.includes('a3')`));
 E(`S.flow.mindset={clarte:4,energie:4,ctx:[],note:''};finishFlow(false)`);
 A('journée construite: MIT + 2 secondaires (dont 75 min) + 1 micro',
   E(`(()=>{const d1=day(todayISO());return d1&&d1.mit&&d1.mit.id==='a1'&&d1.tasks.length===2&&d1.tasks.some(t=>t.est===75)&&d1.quick.length===1})()`));

 console.log('— AJOUT EN JOURNÉE >45 MIN (recommandation) —');
 E(`S.addT={est:60};dayTaskOpts({id:'x1',title:'Réorganisation lourde',est:60,done:false})`);
 A('sheet recommandation ouverte + option garder', d.getElementById('sheetbg').classList.contains('open')&&d.getElementById('sheet').innerHTML.includes('Ajouter quand même'));
 E(`keepDaySec()`);
 A('« Ajouter quand même » → 3e secondaire 60 min', E(`day(todayISO()).tasks.length===3&&day(todayISO()).tasks.some(t=>t.est===60)`));
 E(`S.addT={est:50,pending:{id:'x2',title:'Encore une',est:50,done:false}};keepDaySec()`);
 A('limite 3 secondaires toujours ferme', E(`day(todayISO()).tasks.length===3`));
 E(`pendToBacklog('tomorrow')`);
 A('pendToBacklog → backlog demain', E(`D.backlog.some(b=>b.id==='x2'&&b.when==='tomorrow')`));

 console.log('— TIMER START/FINISH —');
 E(`startTimer('m',day(todayISO()).mit.id)`);
 A('timer démarré sur MIT', E(`!!day(todayISO()).timer`));
 E(`finishTimer()`);
 A('MIT accomplie après finish', E(`day(todayISO()).mit.done===true&&!day(todayISO()).timer`));

 console.log('— DÉRIVE + FEEDBACK IF-THEN —');
 E(`day(todayISO()).plan={ifTxt:'Si je scrolle',thenTxt:'je reviens 5 minutes',uses:0};
    D.plans.push({id:'p1',ifTxt:'Si je scrolle',thenTxt:'je reviens 5 minutes',uses:0});
    commitDerive('plan')`);
 A('uses incrémenté', E(`day(todayISO()).plan.uses===1`));
 A('sheet feedback ouverte', d.getElementById('sheet').innerHTML.includes('Ça a aidé'));
 E(`deriveFb(true)`);
 A('tried/helped sur plan du jour', E(`day(todayISO()).plan.tried===1&&day(todayISO()).plan.helped===1`));
 A('tried/helped propagés à la bibliothèque', E(`D.plans.find(p=>p.id==='p1').tried===1&&D.plans.find(p=>p.id==='p1').helped===1`));
 E(`openDerive()`);
 A("stat « T'a aidé 1 fois sur 1 » affichée", d.getElementById('sheet').innerHTML.includes('aidé 1 fois sur 1'));

 console.log('— ANCRAGE / REPORT / SWAP MIT —');
 const defOk=E(`(()=>{const t0=day(todayISO()).tasks[0];deferTask('t',t0.id,'later');
  return D.backlog.some(b=>b.id===t0.id)&&day(todayISO()).tasks.length===2})()`);
 A('report → backlog, retiré du jour', defOk);
 const swapOk=E(`(()=>{const t1=day(todayISO()).tasks[0];swapSecToMit(t1.id);
  return day(todayISO()).mit.id===t1.id})()`);
 A('swap secondaire→MIT', swapOk);
 E(`D.rituals=[];saveRitual&&0`);
 A('ancrage: openAnchor/saveAnchor présents', E(`typeof openAnchor==='function'&&typeof saveAnchor==='function'`));

 console.log('— CLÔTURE + BACKUP —');
 E(`S.bilan={step:1,estim:'juste',note:'test'};showScore()`);
 A('review posée avec parts', E(`(()=>{const r=day(todayISO()).review;return r&&r.parts&&typeof r.score==='number'})()`));
 A('backup écrit à la clôture', !!w.localStorage.getItem('mindway_v2_bak'));

 console.log('— CORRECTION JOUR PASSÉ —');
 const edit=E(`(()=>{
  const y=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const pd=mkDay(y);
  pd.mit={id:'pm',title:'Priorité oubliée',est:60,imp:2,urg:2,done:false};
  pd.tasks=[{id:'pt',title:'Sec',est:30,imp:1,urg:1,done:false}];
  const c0=computeParts(pd,'juste');
  pd.review={score:c0.score,status:c0.status,parts:c0.parts,estim:'juste',note:'',closedAt:y};
  D.days[y]=pd;
  const before=pd.review.score;
  recapTog('m','pm',y);
  return{y,done:pd.mit.done,delta:pd.review.score-before,edited:pd.review.edited===true}})()`);
 A('toggle MIT passé → done', edit.done===true);
 A('score recalculé (+60) et flag edited', edit.delta===60&&edit.edited);
 A('sheet édition contient la note', d.getElementById('sheet').innerHTML.includes('rcNote'));
 E(`recapSave('${edit.y}')`);
 A('recapSave rouvre le récap corrigé', d.getElementById('sheet').innerHTML.includes('corrigée'));

 console.log('— RÉCUPÉRATION BACKUP (corruption) —');
 const iso=E(`todayISO()`);
 w.localStorage.setItem('mindway_v2','{corrompu!!!');
 E(`load()`);
 A('restauré depuis mindway_v2_bak', E(`!!(D&&D.days&&D.days['${iso}'])`));

 console.log('— POST-REVUE : SLOTS PLEINS & BOUTONS RÉPARÉS —');
 // ≤45 mais 3 secondaires prises → sheet de repli avec pendToBacklog fonctionnel
 E(`D=blank();D.rituals=[];D.backlog=[];
    const dd=mkDay(todayISO());dd.mit={id:'m9',title:'P',est:60,imp:2,urg:2,done:false};
    dd.tasks=[{id:'s1',title:'A',est:30,done:false},{id:'s2',title:'B',est:30,done:false},{id:'s3',title:'C',est:30,done:false}];
    dd.mindset={clarte:3,energie:3,ctx:[],note:''};D.days[todayISO()]=dd;save();
    S.addT={est:30};
    const inp=document.createElement('input');inp.id='adT';inp.value='Surnuméraire';document.body.appendChild(inp);
    addDayTask();inp.remove()`);
 A('slots pleins: pending posé, sheet sans JSON.stringify dans onclick',
   E(`S.addT.pending&&S.addT.pending.title==='Surnuméraire'`) &&
   !d.getElementById('sheet').innerHTML.includes('JSON.stringify') &&
   d.getElementById('sheet').innerHTML.includes('pendToBacklog'));
 E(`pendToBacklog('later')`);
 A('bouton réparé: la tâche part bien en backlog', E(`D.backlog.some(b=>b.title==='Surnuméraire'&&b.when==='later')`));
 // >45 ET slots pleins → recommandation avec raccourci MIT, sans « Ajouter quand même »
 E(`S.addT={est:90};dayTaskOpts({id:'x9',title:'Grosse tâche slots pleins',est:90,done:false})`);
 A('>45 + pleins: raccourci MIT présent, « Ajouter quand même » absent',
   d.getElementById('sheet').innerHTML.includes('En faire ma priorité') &&
   !d.getElementById('sheet').innerHTML.includes('Ajouter quand même') &&
   d.getElementById('sheet').innerHTML.includes('3 secondaires sont prises'));
 E(`dayTaskToMit()`);
 A('MIT remplacée, l’ancienne (60 min >45… non: 60>45) part en backlog demain',
   E(`day(todayISO()).mit.id==='x9'&&D.backlog.some(b=>b.id==='m9'&&b.when==='tomorrow')`));

 console.log('— POST-REVUE : NOTE PRÉSERVÉE & TOAST CONDITIONNEL —');
 const py=E(`(()=>{const y2='2000-01-02';const pd2=mkDay(y2);
  pd2.mit={id:'pm2',title:'X',est:30,imp:1,urg:1,done:false};
  pd2.tasks=[];pd2.quick=[];
  const c2=computeParts(pd2,'juste');
  pd2.review={score:c2.score,status:c2.status,parts:c2.parts,estim:'juste',note:'Note initiale',closedAt:y2};
  D.days[y2]=pd2;S.rcDirty=false;openDayEdit(y2);return y2})()`);
 E(`document.getElementById('rcNote').value='Note modifiée en cours de frappe'`);
 E(`recapTog('m','pm2','${py}')`);
 A('note en cours de frappe préservée après un toggle',
   E(`document.getElementById('rcNote').value`)==='Note modifiée en cours de frappe');
 E(`recapSave('${py}')`);
 A('note + toggle enregistrés, flag edited posé',
   E(`D.days['${py}'].review.note==='Note modifiée en cours de frappe'&&D.days['${py}'].review.edited===true`));
 A('Terminé sans changement ne repose pas edited', (()=>{
   E(`delete D.days['${py}'].review.edited;S.rcDirty=false;openDayEdit('${py}');recapSave('${py}')`);
   return E(`D.days['${py}'].review.edited`)===undefined;})());

 console.log('— POST-REVUE : STAT CUMULÉE & GARDES BACKUP —');
 E(`const dt=day(todayISO());dt.plan={ifTxt:'Si X',thenTxt:'alors Y',uses:0};
    D.plans.push({id:'pl9',ifTxt:'Si X',thenTxt:'alors Y',uses:5,tried:3,helped:2});save();openDerive()`);
 A('stat affichée depuis la bibliothèque (2 sur 3), pas le plan du jour',
   d.getElementById('sheet').innerHTML.includes('aidé 2 fois sur 3'));
 A('corruption: copie mindway_v2_corrupt préservée', (()=>{
   w.localStorage.setItem('mindway_v2','{re-corrompu');
   E(`store.mem={}`);                       // nouvelle session : la copie mémoire n'existe plus
   E(`load()`);
   return (w.localStorage.getItem('mindway_v2_corrupt')||'').startsWith('{re-corrompu');})());
 A('demoOff sans backup démo ne pollue pas mindway_v2_bak', (()=>{
   const before=w.localStorage.getItem('mindway_v2_bak');
   E(`D.settings.demo=true;demoOff()`);
   return w.localStorage.getItem('mindway_v2_bak')===before;})());

 console.log('— REVUE v2 : DONNÉES (critique + majeurs) —');
 // (critical) import d'un export fait en démo : ne doit jamais rejouer la boucle démo → blank
 const impDemo=E(`(()=>{
  D=blank();D.days['2026-01-02']=mkDay('2026-01-02');D.days['2026-01-02'].mit={id:'r1',title:'Réel',est:30,imp:1,urg:1,done:true};save();backupNow();
  const forged={version:2,settings:{theme:'light',demo:true},plans:[],days:{'2026-03-03':mkDay('2026-03-03')}};
  // simulation exacte du corps de importJSON
  backupNow();D=forged;normalize();D.settings.demo=false;save();
  return{demo:D.settings.demo,bakHasReal:!!(JSON.parse(store.get('mindway_v2_bak')).days['2026-01-02'])}})()`);
 A('import d’un export démo : flag démo neutralisé', impDemo.demo===false);
 A('import : backup contient les données PRÉCÉDENTES (pas le fichier importé)', impDemo.bakHasReal===true);
 E(`demoOff()`);
 A('demoOff sans BAK ne repart jamais de zéro', E(`Object.keys(D.days).length>0`));
 // (major) quota : set échoue mais get doit rendre la copie mémoire
 A('store.get sert la copie mémoire quand localStorage a échoué', (()=>{
   E(`store.mem['__probe']='memoire';`);
   try{w.localStorage.removeItem('__probe')}catch(e){}
   return E(`store.get('__probe')`)==='memoire';})());
 A('demoOn refuse de basculer si la copie n’est pas persistée', (()=>{
   E(`D=blank();D.days['2026-02-02']=mkDay('2026-02-02');D.settings.demo=false;save();
      store.__set=store.set;store.set=function(k,v){this.mem[k]=v};`);   // simule quota plein
   E(`demoOn()`);
   const stillReal=E(`!D.settings.demo&&!!D.days['2026-02-02']`);
   E(`store.set=store.__set;delete store.__set`);
   return stillReal;})());
 // (minor) load() : JSON valide mais pas un objet
 A('load(): "null" en base → restauration du backup, app vivante', (()=>{
   E(`D=blank();D.days['2026-04-04']=mkDay('2026-04-04');save();backupNow()`);
   w.localStorage.setItem('mindway_v2','null');
   E(`store.mem={}`);                       // nouvelle session
   E(`load()`);
   return E(`!!(D&&D.days&&D.days['2026-04-04'])`);})());
 A('backup rescapé réécrit dans mindway_v2', (()=>{
   const raw=w.localStorage.getItem('mindway_v2')||'';
   try{const p=JSON.parse(raw);return !!(p&&p.days&&p.days['2026-04-04'])}catch(e){return false}})());
 A('filet quotidien : backup au 1er save du jour', (()=>{
   w.localStorage.removeItem('mindway_v2_bak');
   E(`_bakDay=null;D.days['2026-05-05']=mkDay('2026-05-05');save()`);
   return !!w.localStorage.getItem('mindway_v2_bak');})());

 console.log('— REVUE v2 : FLOW & JOURNÉE —');
 E(`D=blank();D.rituals=[];D.backlog=[];startFlow();
    S.flow.items=[{id:'k1',title:'MIT',est:90,imp:3,urg:3},{id:'k2',title:'Longue gardée',est:75,imp:2,urg:2},{id:'k3',title:'Autre longue',est:80,imp:1,urg:1}];
    prepMit();prepSec();flowKeepSec('k2')`);
 A('flow: >45 gardée est mémorisée (keptLong)', E(`S.flow.keptLong.indexOf('k2')>=0&&S.flow.secIds.indexOf('k2')>=0`));
 E(`S.flow.mitId='k3';prepSec()`);
 A('flow: le choix >45 survit à un changement de priorité (prepSec)', E(`S.flow.secIds.indexOf('k2')>=0`));
 E(`togSec('k2')`);
 A('flow: décocher retire aussi de keptLong', E(`S.flow.keptLong.indexOf('k2')<0`));
 E(`S.flow.secIds=['a','b','c'];flowSecOpts({id:'k2',title:'Longue gardée',est:75})`);
 A('flow slots pleins: « Garder en secondaire » masqué + limite annoncée',
   !d.getElementById('sheet').innerHTML.includes('Garder en secondaire') &&
   d.getElementById('sheet').innerHTML.includes('3 secondaires sont prises'));
 E(`closeSheet();D=blank();D.rituals=[];D.backlog=[];
    const dz=mkDay(todayISO());dz.mindset={clarte:3,energie:3,ctx:[],note:''};D.days[todayISO()]=dz;save();
    S.addT={est:90};dayTaskOpts({id:'nm',title:'Grosse tâche',est:90,done:false})`);
 A('journée sans MIT: « En faire ma priorité du jour » proposé', d.getElementById('sheet').innerHTML.includes('priorité du jour'));
 A('journée: option « Découper » présente', d.getElementById('sheet').innerHTML.includes('Découper'));
 E(`dayTaskToMit()`);
 A('journée sans MIT: la tâche devient la priorité', E(`day(todayISO()).mit.id==='nm'`));

 console.log('— REVUE v2 : CORRECTION DU PASSÉ —');
 const rc=E(`(()=>{const y3='2001-03-03';const p3=mkDay(y3);
  p3.mit={id:"o'brien",title:'Titre avec apostrophe',est:60,imp:2,urg:2,done:false};
  const c3=computeParts(p3,'juste');
  p3.review={score:c3.score,status:c3.status,parts:c3.parts,estim:'juste',note:'Note ',closedAt:y3};
  D.days[y3]=p3;S.rcSnap=null;openDayEdit(y3);return y3})()`);
 A('id à apostrophe échappé dans le handler', d.getElementById('sheet').innerHTML.includes("\\'brien"));
 E(`recapTog('m',"o'brien",'${rc}')`);
 A('toggle sur id à apostrophe fonctionne', E(`D.days['${rc}'].mit.done===true`));
 E(`recapTog('m',"o'brien",'${rc}')`);
 A('toggle + re-toggle : journée NON marquée « corrigée »', E(`D.days['${rc}'].review.edited===undefined`));
 E(`recapSave('${rc}')`);
 A('Terminé sans changement net : pas de flag, pas de faux toast', E(`D.days['${rc}'].review.edited===undefined`));
 // fermeture par le fond : commit + render, pas d'écart écran/données
 const bd=E(`(()=>{const y4='2001-04-04';const p4=mkDay(y4);
  p4.mit={id:'m4',title:'P',est:60,imp:2,urg:2,done:true};
  const c4=computeParts(p4,'juste');
  p4.review={score:c4.score,status:c4.status,parts:c4.parts,estim:'juste',note:'',closedAt:y4};
  D.days[y4]=p4;S.rcSnap=null;openDayEdit(y4);
  const before=p4.review.score;
  recapTog('m','m4',y4);
  localStorage.removeItem('mindway_v2_bak');
  closeSheet();                      // fermeture par le fond
  return{before,after:D.days[y4].review.score,edited:D.days[y4].review.edited===true,
         bak:!!localStorage.getItem('mindway_v2_bak'),snap:S.rcSnap}})()`);
 // décocher la MIT retire les 60 pts MIT ET les 15 pts « secondaires » (aucune secondaire ce jour-là) : 100 → 25
 A('fermeture par le fond: score recalculé et persisté', bd.before===100&&bd.after===25);
 A('fermeture par le fond: flag « corrigée » posé', bd.edited);
 A('fermeture par le fond: backup écrit', bd.bak);
 A('fermeture par le fond: snapshot libéré', bd.snap===null);
 A('jour passé non clôturé: libellé « Journée non clôturée »', (()=>{
   E(`const y5='2001-05-05';const p5=mkDay(y5);p5.mit={id:'m5',title:'X',est:30,imp:1,urg:1,done:false};D.days[y5]=p5;openDayRecap(y5)`);
   return d.getElementById('sheet').innerHTML.includes('Journée non clôturée');})());

 console.log('— REVUE v2 : BILAN & STATS —');
 A('la scène de validation ne s’ouvre pas pendant le bilan', (()=>{
   E(`closeSheet();const db=mkDay(todayISO());db.tasks=[{id:'bt',title:'T',est:30,done:false}];db.mindset={clarte:3,energie:3,ctx:[],note:''};D.days[todayISO()]=db;save();
      vHide();S.bilan={step:0,estim:null,note:''};togTask('t','bt')`);
   const off=!d.getElementById('vwin').classList.contains('on');
   E(`S.bilan=null`);
   return off;})());
 A('stats If-Then forgées (chaîne) neutralisées à l’affichage', (()=>{
   E(`const dq=day(todayISO());dq.plan={ifTxt:'Si X',thenTxt:'alors Y',uses:0};
      D.plans=[{id:'px',ifTxt:'Si X',thenTxt:'alors Y',uses:1,tried:'<img src=x onerror=alert(1)>',helped:1}];
      openDerive()`);
   const h=d.getElementById('sheet').innerHTML;
   // compteur non numérique → aucune stat affichée, et surtout aucun balisage injecté
   return !h.includes('onerror')&&!h.includes('<img')&&h.includes('Si X')&&!h.includes('aidé');})());

 console.log('— CALIBRATION ENRICHIE, NOTE, SI ÉDITABLE —');
 E(`D=blank();D.rituals=[];D.backlog=[];startFlow();
    S.flow.items=[{id:'c1',title:'Priorité',est:60,imp:3,urg:3},{id:'c2',title:'Sec',est:30,imp:1,urg:1}];
    prepMit();prepSec();flowGo(5)`);
 A('4 dimensions présentes dans Calibrer', (()=>{const h=d.getElementById('flowIn').innerHTML;
   return /Clarté mentale/.test(h)&&/Énergie/.test(h)&&/Charge mentale/.test(h)&&/Élan/.test(h)})());
 A('champ note libre présent', d.getElementById('mdNote')!==null);
 A('mindset par défaut complet', E(`(()=>{const m=S.flow.mindset;
   return m.clarte===3&&m.energie===3&&m.charge===3&&m.elan===3&&m.note===''})()`));
 E(`S.flow.mindset.charge=5;S.flow.mindset.elan=2;S.flow.mindset.note='  Journée dense  ';afterMindset()`);
 A('charge/élan/note persistés dans la journée', E(`(()=>{const m=day(todayISO()).mindset;
   return m.charge===5&&m.elan===2&&/Journée dense/.test(m.note)})()`));
 A('note affichée dans la journée', (()=>{E(`render()`);
   return d.getElementById('phone').innerHTML.includes('Journée dense')})());
 A('chips Charge et Élan affichés', (()=>{const h=d.getElementById('phone').innerHTML;
   return /Charge <b>5\/5/.test(h)&&/Élan <b>2\/5/.test(h)})());
 // Si éditable
 E(`D=blank();D.rituals=[];D.backlog=[];startFlow();
    S.flow.items=[{id:'p1',title:'P',est:60,imp:3,urg:3}];prepMit();prepSec();
    S.flow.mindset={clarte:1,energie:1,charge:5,elan:1,ctx:[],note:''};afterMindset()`);
 A('étape Si-Alors atteinte avec champ Si éditable', E(`S.flow.step===6`)&&d.getElementById('planIf')!==null);
 E(`document.getElementById('planIf').value='Si je rouvre mes mails avant midi';
    document.getElementById('planIf').dispatchEvent(new window.Event('input'));
    [...document.querySelectorAll('#flowIn .flow-actions button')][0].click()`);
 A('le Si personnalisé est enregistré', E(`(()=>{const p=day(todayISO()).plan;
   return p&&p.ifTxt==='Si je rouvre mes mails avant midi'})()`));
 A('le Si personnalisé rejoint la bibliothèque', E(`D.plans.some(p=>p.ifTxt==='Si je rouvre mes mails avant midi')`));

 console.log('— CHEMIN EXPRESS —');
 E(`D=blank();D.rituals=[];D.backlog=[];startExpress()`);
 A('écran 1 ouvert', E(`S.exp&&S.exp.step===1`)&&d.getElementById('expRaw')!==null);
 E(`document.getElementById('expRaw').value="Finir la présentation\\n- Appeler la banque\\n2) Mail à Paul\\nCourses\\nRanger le bureau\\nRéserver le train\\nRelire le contrat\\nSauvegarder le projet\\nCommander les câbles\\nPréparer la réunion\\nLire le rapport";
    expParse()`);
 A('parsing: puces et numéros nettoyés', E(`S.exp.items[1].title==='Appeler la banque'&&S.exp.items[2].title==='Mail à Paul'`));
 A('structure proposée: 1 priorité, 3 secondaires, 5 micros, reste plus tard', E(`(()=>{const c=r=>S.exp.items.filter(x=>x.role===r).length;
   return c('mit')===1&&c('sec')===3&&c('micro')===5&&c('later')===2})()`));
 E(`expRole(S.exp.items[4].id)`);
 A('changer un rôle respecte le plafond des 3 secondaires', E(`S.exp.items.filter(x=>x.role==='sec').length<=3`));
 A('promouvoir en priorité rétrograde l’ancienne', (()=>{
   const before=E(`S.exp.items.find(x=>x.role==='mit').id`);
   E(`expRole(S.exp.items.filter(x=>x.role==='later')[0].id)`);   // une seule rotation : later → mit
   const st=E(`(()=>{const m=S.exp.items.filter(x=>x.role==='mit');return{n:m.length,id:m.length?m[0].id:null}})()`);
   return st.n===1&&st.id!==before;})());
 A('retirer la priorité bloque la construction sans planter', (()=>{
   const id=E(`S.exp.items.find(x=>x.role==='mit').id`);
   E(`expRole('${id}')`);                                          // plus aucune priorité
   const none=E(`S.exp.items.filter(x=>x.role==='mit').length===0`);
   E(`expBuild()`);
   const noDay=E(`day(todayISO())===null`);
   let guard=0;                                                    // on rétablit une priorité
   while(E(`S.exp.items.filter(x=>x.role==='mit').length===0`)&&guard++<5)E(`expRole('${id}')`);
   return none&&noDay&&E(`S.exp.items.filter(x=>x.role==='mit').length===1`);})());
 E(`const it=S.exp.items[0];const before=it.est;expEst(it.id);`);
 A('durée cyclable', E(`EXP_EST.indexOf(S.exp.items[0].est)>=0`));
 E(`expDel(S.exp.items[S.exp.items.length-1].id)`);
 A('suppression d’une ligne', E(`S.exp.items.length===10`));
 E(`expBuild()`);
 const ex=E(`(()=>{const dd=day(todayISO());return{mit:!!dd.mit,sec:dd.tasks.length,mic:dd.quick.length,bk:D.backlog.length,mind:dd.mindset,hour:dd.startedHour!=null}})()`);
 A('journée construite depuis l’express', ex.mit&&ex.sec<=3&&ex.mic<=5&&ex.hour);
 A('le surplus part au backlog', ex.bk>=1);
 A('aucune calibration inventée (mindset null)', ex.mind===null);
 A('insights tolèrent un jour sans calibration', E(`(()=>{try{computeInsights();return true}catch(e){return false}})()`));
 A('bouton « Calibrer mon état d’esprit » proposé', (()=>{E(`render()`);
   return d.getElementById('phone').innerHTML.includes('Calibrer mon')})());
 E(`openMindset();S.md.clarte=5;S.md.charge=2;
    document.getElementById('mdN').value='ajouté après coup';
    [...document.querySelectorAll('#sheet .chip')][0].click();   // un contexte au passage
    saveMindset()`);
 A('calibration ajoutée après coup', E(`(()=>{const m=day(todayISO()).mindset;
   return m&&m.clarte===5&&m.charge===2&&m.note==='ajouté après coup'&&m.ctx.length===1})()`));

 console.log('— RÉGRESSION : D REMPLACÉ SANS normalize (crash « push of undefined ») —');
 A('blank() renvoie une forme complète', E(`(()=>{const b=blank();
   return Array.isArray(b.days?[]:[])&&b.days&&Array.isArray(b.plans)&&Array.isArray(b.rituals)&&Array.isArray(b.backlog)})()`));
 A('après demoOn, backlog et rituals existent', E(`(()=>{
   D=blank();D.settings.demo=false;save();demoOn();
   return Array.isArray(D.backlog)&&Array.isArray(D.rituals)})()`));
 // le scénario exact du bug : démo active, aucune journée aujourd'hui, chemin express
 A('express depuis la démo ne plante plus', E(`(()=>{
   delete D.days[todayISO()];
   startExpress();
   document.getElementById('expRaw').value='Une\\nDeux\\nTrois\\nQuatre\\nCinq\\nSix\\nSept\\nHuit\\nNeuf\\nDix\\nOnze\\nDouze';
   expParse();
   try{expBuild()}catch(e){return 'CRASH: '+e.message}
   const dd=day(todayISO());
   return !!(dd&&dd.mit&&D.backlog.length>=2)})()`)===true);
 A('après réinitialisation, le flow complet ne plante plus', E(`(()=>{
   D=blank();normalize();save();
   startFlow();S.flow.items=[{id:'r1',title:'P',est:60,imp:3,urg:3},{id:'r2',title:'Longue',est:200,imp:1,urg:1}];
   prepMit();prepSec();S.flow.mindset=blankMindset();
   try{finishFlow(false)}catch(e){return 'CRASH: '+e.message}
   return D.backlog.length===1&&!!day(todayISO()).mit})()`)===true);
 A('express refuse d’écraser une journée déjà commencée', E(`(()=>{
   const dd=day(todayISO());const titre=dd.mit.title;
   dd.tasks.push({id:'x',title:'déjà là',est:30,imp:1,urg:1,done:true});save();
   startExpress();
   document.getElementById('expRaw').value='Autre chose';
   expParse();expBuild();
   const after=day(todayISO());
   return after.mit.title===titre&&after.tasks.some(t=>t.title==='déjà là')})()`));

 console.log('— INSIGHTS CONNAISSANCE DE SOI —');
 A('règle estimation: sous-estimation détectée', E(`(()=>{
   D=blank();const iso0=new Date();
   for(let i=1;i<=10;i++){const dt=new Date();dt.setDate(dt.getDate()-i);const k=dt.toISOString().slice(0,10);
    const dd=mkDay(k);dd.mit={id:'m'+i,title:'t',est:30,imp:2,urg:2,done:true,spent:48};
    dd.mindset={clarte:3,energie:3,charge:3,elan:3,ctx:[],note:''};
    const c=computeParts(dd,'juste');dd.review={score:c.score,status:c.status,parts:c.parts,estim:'juste',note:'',closedAt:k};
    D.days[k]=dd}
   const R=computeInsights();
   return !R.locked&&R.list.some(x=>/sous-estimes/.test(x.txt))})()`));
 A('règle évitement: tâches qui traînent', E(`(()=>{
   const old=new Date();old.setDate(old.getDate()-12);const k=old.toISOString().slice(0,10);
   D.backlog=[{id:'b1',title:'x',est:30,imp:2,urg:1,when:'later',from:k},{id:'b2',title:'y',est:30,imp:2,urg:1,when:'later',from:k}];
   const R=computeInsights();
   return R.list.some(x=>/attendent depuis plus d'une semaine/.test(x.txt))})()`));
 A('démo: aucune régression du scoring après nouvelles règles', E(`(()=>{
   const days=genDemo();let mism=0,n=0;
   Object.values(days).forEach(dd=>{if(!dd.review||dd.off)return;n++;
    const c=computeParts(dd,dd.review.estim);
    if(c.score!==dd.review.score||c.status!==dd.review.status)mism++});
   return n>0&&mism===0})()`));

 console.log('— ALARME DE FIN DE SESSION —');
 const notifs=[];
 w.Notification=function(t,o){notifs.push({title:t,body:(o||{}).body||''})};
 w.Notification.permission='granted';
 E(`D=blank();D.rituals=[];D.backlog=[];
    const da=mkDay(todayISO());
    da.mit={id:'am',title:'Bloc de travail',est:45,imp:2,urg:2,done:false};
    da.mindset={clarte:3,energie:3,ctx:[],note:''};D.days[todayISO()]=da;save();
    startTimer('m','am')`);
 A('réglage actif par défaut (stopAtEnd)', E(`stopAtEnd()===true`));
 A('timer démarré, non arrêté', E(`!!day(todayISO()).timer&&!day(todayISO()).timer.stopped`));
 // on force l'échéance : le chrono a démarré il y a plus que le temps prévu
 E(`const t=day(todayISO()).timer;t.start=Date.now()-(t.planned*60000+5000);save();paintTimer()`);
 const st=E(`(()=>{const t=day(todayISO()).timer;return{stopped:!!t.stopped,paused:!!t.paused,alarmed:!!t.alarmed,acc:t.acc,planned:t.planned}})()`);
 A('à échéance : chrono gelé (stopped + paused)', st.stopped&&st.paused);
 A('gelé exactement au temps prévu', st.acc===st.planned*60000);
 A('elapsed figé = temps prévu', E(`timerElapsed(day(todayISO()).timer)===day(todayISO()).timer.planned*60000`));
 A('notification système envoyée', notifs.length===1&&/Temps prévu atteint/.test(notifs[0].title)&&/Bloc de travail/.test(notifs[0].body));
 A('la tâche N’EST PAS cochée à la place de l’utilisateur', E(`day(todayISO()).mit.done===false`));
 A('carte MIT: « Temps écoulé » + Continuer + Terminé', (()=>{
   E(`render()`);const h=d.getElementById('phone').innerHTML;
   return h.includes('Temps écoulé')&&h.includes('resumeOver()')&&h.includes('Terminé');})());
 A('pause sans effet quand le chrono est arrêté', (()=>{
   E(`pauseTimer()`);return E(`day(todayISO()).timer.stopped===true&&day(todayISO()).timer.paused===true`);})());
 A('une seule alerte au total (pas de double carillon/notification)', notifs.length===1);
 // reprise en dépassement — puis on REPEINT, comme le fait le rAF de render()
 E(`resumeOver();paintTimer();paintTimer()`);
 const rv=E(`(()=>{const t=day(todayISO()).timer;return{stopped:!!t.stopped,paused:!!t.paused,el:timerElapsed(t),tot:t.planned*60000}})()`);
 A('Continuer : la session RESTE relancée après repaint (pas de re-gel)', !rv.stopped&&!rv.paused);
 A('Continuer : le décompte repart en dépassement', rv.el>=rv.tot);
 A('reprise: pas de seconde notification (alarmed conservé)', notifs.length===1);
 // le temps de dépassement continue de courir et n'est pas réécrit
 const ov1=E(`timerElapsed(day(todayISO()).timer)`);
 E(`const t=day(todayISO()).timer;t.start=t.start-4000;paintTimer()`);
 const ov2=E(`timerElapsed(day(todayISO()).timer)`);
 A('dépassement: le temps passé n’est jamais réécrit', ov2>=ov1+3500&&E(`!day(todayISO()).timer.stopped`));
 A('activer le réglage pendant un dépassement ne regèle pas', (()=>{
   E(`setStopAtEnd(true);paintTimer();paintTimer()`);
   return E(`!day(todayISO()).timer.stopped`);})());
 // seconde session avec le réglage désactivé : dépassement comme avant
 E(`finishTimer();D.settings.stopAtEnd=false;save();
    const db=day(todayISO());db.tasks=[{id:'as',title:'Secondaire',est:30,imp:1,urg:1,done:false}];save();
    startTimer('t','as');
    const t2=day(todayISO()).timer;t2.start=Date.now()-(t2.planned*60000+3000);save();paintTimer()`);
 A('réglage désactivé : le chrono continue (dépassement)', E(`!day(todayISO()).timer.stopped&&timerElapsed(day(todayISO()).timer)>day(todayISO()).timer.planned*60000`));
 A('réglage désactivé : alerte quand même envoyée', notifs.length===2);
 E(`setStopAtEnd(true)`);
 A('réactivation depuis les Réglages', E(`stopAtEnd()===true&&D.settings.stopAtEnd===true`));
 E(`abandonTimer()`);
 A('abandon : chrono retiré', E(`!day(todayISO()).timer`));

 console.log('— ÉCRAN « LE SYSTÈME » —');
 E(`D=blank();save();openSystem()`);
 const sysH=d.getElementById('sheet').innerHTML;
 A('contenu: priorité unique, durée sans importance', /Une seule tâche décide/.test(sysH)&&/durée n'entre pas en compte/.test(sysH));
 A('contenu: impact et urgence orientent, l’utilisateur décide', /t'orientent/.test(sysH)&&/ne décident pas à ta place/.test(sysH));
 A('contenu: 3 secondaires 45 min · 5 micros 10 min', /3 secondaires/.test(sysH)&&/45 minutes ou moins/.test(sysH)&&/5 micro-tâches/.test(sysH)&&/10 minutes ou moins/.test(sysH));
 A('contenu: tenir sur la durée sans s’user', /sans s'user/.test(sysH)&&/tenir sur la durée/.test(sysH));
 A('contenu: rien n’est figé, jamais corrigé à ta place', /Rien n'est figé/.test(sysH)&&/corrigé à ta place/.test(sysH));
 A('marque seenSystem posée', E(`D.settings.seenSystem===true`));
 // les affirmations chiffrées de l'écran doivent rester vraies contre computeParts
 A('vrai: la priorité pèse 60 points sur 100', E(`(()=>{
   const dd=mkDay('2030-01-01');dd.mit={id:'a',title:'x',est:30,imp:1,urg:1,done:true};
   const withMit=computeParts(dd,null).parts.mit;
   dd.mit.done=false;const without=computeParts(dd,null).parts.mit;
   return withMit===60&&without===0})()`));
 A('vrai: sans la priorité, aucune journée ne peut être gagnante', E(`(()=>{
   let max=0;
   [0,1,2,3].forEach(nt=>[0,5].forEach(nq=>['juste','court','rate',null].forEach(es=>{
     const dd=mkDay('2030-01-02');
     dd.mit={id:'a',title:'x',est:30,imp:1,urg:1,done:false};   // priorité NON faite
     for(let i=0;i<nt;i++)dd.tasks.push({id:'t'+i,title:'t',est:30,imp:1,urg:1,done:true});
     for(let i=0;i<nq;i++)dd.quick.push({id:'q'+i,title:'q',est:10,done:true});
     const c=computeParts(dd,es);
     if(c.score>max)max=c.score;
     if(c.status==='gagnante')max=999;
   })));
   return max===40})()`));
 A('accessible depuis les Réglages', (()=>{
   E(`closeSheet();openSettings()`);
   return d.getElementById('sheet').innerHTML.includes('openSystem()');})());
 A('lien « Comment ça marche » dans l’état vide', (()=>{
   E(`closeSheet();D=blank();save();render()`);
   return d.getElementById('phone').innerHTML.includes('Comment ça marche');})());
 A('firstRun() vrai au 1er lancement, faux ensuite', (()=>{
   const first=E(`D=blank();delete D.settings.seenSystem;save();firstRun()`);
   const again=E(`D.settings.seenSystem=true;save();firstRun()`);
   return first===true&&again===false;})());
 A('firstRun() faux en démo et si des jours existent', (()=>{
   const demo=E(`D=blank();delete D.settings.seenSystem;D.settings.demo=true;save();firstRun()`);
   const withDays=E(`D=blank();delete D.settings.seenSystem;D.days['2020-01-01']=mkDay('2020-01-01');save();firstRun()`);
   return demo===false&&withDays===false;})());
 // le point critique : l'écran ne doit JAMAIS se poser par-dessus le flow
 A('1er lancement: le CTA de l’intro mène au système, pas au flow', (()=>{
   E(`D=blank();delete D.settings.seenSystem;save()`);
   const label=E(`introCTA()[0]`);
   E(`S.flow=null;introCTA()[1]()`);
   return label==='Découvrir Mindway'&&E(`S.flow===null`);})());
 A('écran système premier lancement: CTA « Clarifier ma journée »', (()=>{
   E(`closeSheet();D=blank();delete D.settings.seenSystem;save();openSystem(true)`);
   return d.getElementById('sheet').innerHTML.includes('startFlow()');})());
 A('le flow lancé depuis le système n’est pas recouvert', (()=>{
   E(`[...document.querySelectorAll('#sheet button')].find(b=>/Clarifier/.test(b.textContent)).click()`);
   return E(`!!S.flow`)&&!d.getElementById('sheetbg').classList.contains('open');})());
 A('utilisateur existant: CTA normal, pas d’écran système imposé', (()=>{
   E(`closeFlow();D=blank();D.days[todayISO()]=mkDay(todayISO());D.days[todayISO()].mit={id:'z',title:'X',est:30,imp:1,urg:1,done:false};save()`);
   return E(`introCTA()[0]`)==='Continuer ma journée';})());
 A('rappels courts dans le flow (Choisir + Construire)', (()=>{
   const src=fs.readFileSync(FILE,'utf8');
   const choisir=src.includes("Sa durée n'entre pas en compte : faite, elle rend la journée gagnante");
   const construire=src.includes("Ces ordres de grandeur gardent la journée tenable")&&src.includes("sans t'user");
   return choisir&&construire;})());

 console.log('— STOCK DE CITATIONS —');
 const qs=E(`QUOTES`);
 A('stock élargi (≥130)', qs.length>=130);
 A('aucun id ni texte dupliqué', new Set(qs.map(q=>q.id)).size===qs.length&&new Set(qs.map(q=>q.text)).size===qs.length);
 A('les 21 « Mindway » restent exclues de tous les tirages', (()=>{
   const mind=qs.filter(q=>q.author==='Mindway').length;
   const pool=E(`QA.length`);
   return mind===21&&pool===qs.length-21;})());
 A('toute catégorie a un contexte dans Q_CTX', E(`[...new Set(QUOTES.map(q=>q.cat))].every(c=>!!Q_CTX[c])`));
 A('tout pattern déclaré est valide', E(`(()=>{const VP=['high_clarity_success','high_dispersion_low_mit','low_energy_mit_success','micro_tasks_over_mit','high_impact_avoidance','low_impact_productivity','antifragile_day','if_then_effective','if_then_used','strategy_helped_mit','strategy_used_high_dispersion','strategy_used_low_energy','optimisme_high'];
   return QUOTES.every(q=>(q.p||[]).every(p=>VP.indexOf(p)>=0))})()`));
 A('nouveaux auteurs présents (Hugo, Khadra, Taleb, Kahneman, Arendt)', (()=>{
   const a=new Set(qs.map(q=>q.author));
   return ['Victor Hugo','Yasmina Khadra','Nassim Nicholas Taleb','Daniel Kahneman','Hannah Arendt'].every(x=>a.has(x));})());
 A('les tirages ne renvoient jamais du Mindway', E(`(()=>{
   for(let i=0;i<60;i++){if(qIntro().author==='Mindway')return false;
    if(qValid().author==='Mindway')return false;
    if(qPick('focus').author==='Mindway')return false}
   return true})()`));
 A('qValid respecte la limite de 100 caractères', E(`(()=>{
   for(let i=0;i<80;i++)if(qValid().text.length>100)return false;return true})()`));
 A('qPick est déterministe pour un même jour', E(`qPick('focus').id===qPick('focus').id`));

 console.log('— SCÈNE DE VALIDATION —');
 A('durée 9000 ms', html.includes('setTimeout(vHide,9000)')&&!html.includes('setTimeout(vHide,3400)')&&!html.includes('setTimeout(vHide,6500)'));
 E(`vShow()`);
 A('vwin visible', d.getElementById('vwin').classList.contains('on'));
 E(`vHide()`);
 A('vHide (tap) ferme', !d.getElementById('vwin').classList.contains('on'));

 console.log(process.exitCode?'\n=== ÉCHECS DÉTECTÉS ===':'\n=== TOUT PASSE ===');
 dom.window.close();
 setTimeout(()=>process.exit(process.exitCode||0),50);
},1200);
