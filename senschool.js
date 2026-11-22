const CLES={insc:'senschoolInscriptions',frais:'senschoolFrais',pai:'senschoolPaiements',dep:'senschoolDepenses'};
const $=id=>document.getElementById(id);
function lire(c){try{return JSON.parse(localStorage.getItem(CLES[c]))||[]}catch(e){return[]}}
function fcfa(n){return Number(n).toLocaleString('fr-FR')+' FCFA'}
function dateFr(d){return d?d.split('-').reverse().join('/'):''}
function ligne(tbody,cellules){const tr=document.createElement('tr');cellules.forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.appendChild(td)});tbody.appendChild(tr);return tr}
function remplir(select,valeurs){valeurs.forEach(v=>{const o=document.createElement('option');o.value=o.textContent=v;select.appendChild(o)})}
function lienWhatsApp(tel,msg){let n=String(tel||'').replace(/\D/g,'');if(n.length===9)n='221'+n;return 'https://wa.me/'+n+'?text='+encodeURIComponent(msg)}
function telParent(nom,annee){const e=lire('insc').find(i=>i.nom===nom&&(!annee||i.anneeScolaire===annee));return e?e.telParent||'':''}

const FIREBASE_CONFIG={apiKey:"AIzaSyBAUADiLK3dWfI3IZJQc1YmSY0Yug-hwiE",authDomain:"senschool-alislah.firebaseapp.com",projectId:"senschool-alislah",storageBucket:"senschool-alislah.firebasestorage.app",messagingSenderId:"299072829002",appId:"1:299072829002:web:d5ac79fb5f4d23c72658b3"};
const STYLE_CHAMP='width:100%;padding:12px;margin:6px 0;border:1px solid #bbb;border-radius:8px;box-sizing:border-box;font-size:1em';
const STYLE_BTN='width:100%;padding:14px;margin-top:8px;border:none;border-radius:8px;background:#14532d;color:#fff;font-weight:bold;font-size:1em;cursor:pointer';
let cloud=null;
const DIRECTEUR='francoarabealislah@gmail.com';
function estDirecteur(){return !!cloud&&cloud.user.email.toLowerCase()===DIRECTEUR}
function appliquerRoles(){document.querySelectorAll('.directeur').forEach(function(e){e.style.display=estDirecteur()?'':'none'})}
function effacerAvecConfirmation(){
  if(!estDirecteur()){alert('Réservé au directeur.');return}
  if(prompt('Pour supprimer TOUTES les données (définitif), écris EFFACER :')==='EFFACER')effacerTout();
}

function envoyer(c,s){
  if(!cloud)return Promise.reject(new Error('Pas de connexion à la base de données.'));
  return cloud.fs.setDoc(cloud.fs.doc(cloud.db,'donnees',c),{liste:s,par:cloud.user.email,le:new Date().toISOString()});
}
function ecrire(c,l){
  const s=JSON.stringify(l);
  localStorage.setItem(CLES[c],s);
  envoyer(c,s).catch(function(e){alert('⚠️ Erreur de sauvegarde en ligne : '+e.message)});
}
function effacerTout(){
  Promise.all(Object.keys(CLES).map(c=>envoyer(c,'[]'))).then(function(){
    Object.values(CLES).forEach(k=>localStorage.removeItem(k));location.reload();
  }).catch(function(e){alert('Erreur : '+e.message)});
}
function afficherBanniere(){
  if($('banniere'))return;
  const d=document.createElement('div');d.id='banniere';d.className='noprint';
  d.textContent='🔄 De nouvelles données sont disponibles. Touche ici pour actualiser.';
  d.style.cssText='position:fixed;top:0;left:0;right:0;background:#b8860b;color:#fff;padding:12px;text-align:center;font-weight:bold;z-index:9500;cursor:pointer';
  d.onclick=function(){location.reload()};
  document.body.appendChild(d);
}

const voile=document.createElement('div');
voile.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:#f3f1e8;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:Arial,sans-serif;overflow:auto';
voile.innerHTML='<div style="width:100%;max-width:360px;text-align:center"><h1 style="color:#14532d">SenSchool</h1><p>École Al Islah - Yeumbeul Nord</p><div id="zoneConnexion"><p>Chargement…</p></div></div>';
document.body.appendChild(voile);

(async function(){
  try{
    const B='https://www.gstatic.com/firebasejs/10.12.2/';
    const [A,AU,FS]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
    const app=A.initializeApp(FIREBASE_CONFIG),auth=AU.getAuth(app),db=FS.getFirestore(app);
    let demarre=false;
    function formulaire(){
      $('zoneConnexion').innerHTML='<input id="lgEmail" type="email" placeholder="Adresse e-mail" style="'+STYLE_CHAMP+'"><input id="lgMdp" type="password" placeholder="Mot de passe" style="'+STYLE_CHAMP+'"><button id="lgBtn" style="'+STYLE_BTN+'">Se connecter</button><p id="lgErr" style="color:#b91c1c"></p>';
      $('lgBtn').onclick=function(){
        $('lgErr').textContent='';
        AU.signInWithEmailAndPassword(auth,$('lgEmail').value.trim(),$('lgMdp').value).catch(function(){$('lgErr').textContent='E-mail ou mot de passe incorrect.'});
      };
    }
    function boutonDeconnexion(){
      if($('btnDeco'))return;
      const b=document.createElement('button');b.id='btnDeco';b.className='noprint';b.textContent='Déconnexion';
      b.style.cssText='position:fixed;right:8px;bottom:8px;width:auto;padding:8px 12px;margin:0;font-size:.8em;background:#334155;color:#fff;border:none;border-radius:8px;z-index:9000';
      b.onclick=function(){AU.signOut(auth).then(function(){Object.values(CLES).forEach(k=>localStorage.removeItem(k));location.reload()})};
      document.body.appendChild(b);
    }
    function synchroniser(){
      const vus={};let change=false,pret=false;
      Object.keys(CLES).forEach(function(c){
        FS.onSnapshot(FS.doc(db,'donnees',c),function(snap){
          if(snap.metadata.hasPendingWrites||snap.metadata.fromCache)return;
          const loc=localStorage.getItem(CLES[c])||'[]';
          let diff=false;
          if(!snap.exists()){if(loc!=='[]')envoyer(c,loc)}
          else{const d=snap.data().liste;if(d!==loc){localStorage.setItem(CLES[c],d);diff=true}}
          if(!pret){vus[c]=true;if(diff)change=true;if(Object.keys(vus).length===4){pret=true;if(change)location.reload()}}
          else if(diff)afficherBanniere();
        },function(e){alert('⚠️ Accès refusé ou erreur : '+e.message)});
      });
    }
    AU.onAuthStateChanged(auth,function(user){
      if(!user){cloud=null;voile.style.display='flex';formulaire();return}
      cloud={db:db,fs:FS,user:user};
      voile.style.display='none';
      boutonDeconnexion();
      appliquerRoles();
      if(!demarre){demarre=true;synchroniser()}
    });
  }catch(e){
    $('zoneConnexion').innerHTML='<p>⚠️ Connexion internet requise.</p><button style="'+STYLE_BTN+'" onclick="location.reload()">Réessayer</button>';
  }
})();
/* ===== ÉTAPE 2 : identifiants permanents et archivage ===== */
function brut(c){try{return JSON.parse(localStorage.getItem(CLES[c]))||[]}catch(e){return[]}}
function lire(c){return brut(c).filter(function(r){return !r.archive})}
function nouvelId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function prochainNumero(liste,champ,prefixe){
  let m=0;
  liste.forEach(function(r){const n=parseInt(String(r[champ]||'').replace(/\D/g,''),10);if(n>m)m=n});
  return prefixe+String(m+1).padStart(4,'0');
}
function migrerEleves(){if(brut('insc').some(function(r){return !r.matricule}))ecrire('insc',lire('insc'))}
function ecrire(c,l){
  if(c==='pai')migrerEleves();
  const tout=brut(c),quand=new Date().toISOString(),qui=cloud?cloud.user.email:'';
  l.forEach(function(r){
    if(!r.id){r.id=nouvelId();r.cree=quand;r.creePar=qui}
    if(c==='insc'&&!r.matricule)r.matricule=prochainNumero(tout.concat(l),'matricule','AI-');
    if(c==='pai'){
      if(!r.numeroRecu)r.numeroRecu=prochainNumero(tout.concat(l),'numeroRecu','REC-');
      if(!r.matricule){const e=brut('insc').find(function(x){return x.nom===r.nomEleve&&x.anneeScolaire===r.anneeScolaire});if(e)r.matricule=e.matricule}
    }
  });
  const archives=tout.filter(function(r){return r.archive&&!l.some(function(x){return x.id===r.id})});
  const s=JSON.stringify(l.concat(archives));
  localStorage.setItem(CLES[c],s);
  envoyer(c,s).catch(function(e){alert('⚠️ Erreur de sauvegarde en ligne : '+e.message)});
}
(function(){const t=setInterval(function(){if(cloud){clearInterval(t);setTimeout(migrerEleves,4000)}},500)})();
/* ===== FRANÇAIS / ARABE ===== */
const AR={
"Tableau de bord de l'année 2026-2027":"لوحة القيادة للسنة الدراسية 2026-2027",
"Élèves inscrits":"التلاميذ المسجلون","Total encaissé":"إجمالي المبالغ المحصّلة","Total des dépenses":"إجمالي المصاريف","Solde en caisse (net)":"الرصيد الصافي في الصندوق",
"Nouvelle inscription":"تسجيل جديد","Liste des élèves":"قائمة التلاميذ","Frais scolaires":"الرسوم الدراسية","Enregistrer un paiement":"تسجيل دفعة",
"Retards de paiement":"المتأخرات","Imprimer un reçu":"طباعة وصل","Annonces aux parents":"إعلانات للأولياء","Enregistrer une dépense":"تسجيل مصروف",
"💾 Sauvegarder les données":"💾 حفظ البيانات","Tout effacer":"مسح الكل","Déconnexion":"تسجيل الخروج","⬅️ Retour au tableau de bord":"⬅️ العودة إلى لوحة القيادة",
"Adresse e-mail":"البريد الإلكتروني","Mot de passe":"كلمة المرور","Se connecter":"تسجيل الدخول",
"Inscriptions":"التسجيلات","Nom de l'élève":"اسم التلميذ","Téléphone WhatsApp du parent":"هاتف واتساب الولي","Année scolaire":"السنة الدراسية",
"Cursus pédagogique":"المسار التعليمي","Classe française":"القسم الفرنسي","Niveau arabe":"المستوى العربي","Régime scolaire":"النظام الدراسي",
"Inscrire l'élève":"تسجيل التلميذ","Voir la liste des élèves":"عرض قائمة التلاميذ",
"Choisir une année":"اختر السنة","Choisir un cursus":"اختر المسار","Choisir une classe":"اختر القسم","Choisir un niveau":"اختر المستوى","Choisir un régime":"اختر النظام",
"Franco-arabe":"فرنسي-عربي","Arabe uniquement":"عربي فقط","Standard":"عادي","Semi-internat":"نصف داخلي","Internat":"داخلي","Préscolaire":"التحضيري",
"Liste des élèves inscrits":"قائمة التلاميذ المسجلين","Matricule":"رقم التسجيل","Élève":"التلميذ","Nom, matricule ou classe":"الاسم أو رقم التسجيل أو القسم",
"Archiver":"أرشفة","Restaurer":"استرجاع","🗄️ Voir les élèves archivés":"🗄️ عرض التلاميذ المؤرشفين","⬅️ Revenir à la liste":"⬅️ الرجوع إلى القائمة",
"Élèves archivés":"التلاميذ المؤرشفون","Aucun élève":"لا يوجد تلاميذ",
"Frais d'inscription (une fois par an, FCFA)":"رسوم التسجيل (مرة في السنة، فرنك)","Mensualité (par mois, FCFA)":"القسط الشهري (بالفرنك)","Enregistrer les frais":"حفظ الرسوم",
"Année":"السنة","Cursus":"المسار","Régime":"النظام","Inscription":"التسجيل","Mensualité":"القسط الشهري","Autres frais":"رسوم أخرى","Supprimer":"حذف",
"Paiements scolaires":"المدفوعات المدرسية","Élève (inscrit)":"التلميذ (المسجل)","Choisir un élève":"اختر التلميذ","Type de paiement":"نوع الدفع","Choisir un type":"اختر النوع",
"Montant payé (FCFA)":"المبلغ المدفوع (فرنك)","Date du paiement":"تاريخ الدفع","Enregistrer le paiement":"تسجيل الدفعة","Date":"التاريخ","Type":"النوع","Montant":"المبلغ",
"Dépenses":"المصاريف","Motif":"السبب","Montant (FCFA)":"المبلغ (فرنك)","Enregistrer la dépense":"تسجيل المصروف",
"Reçus de paiement":"وصولات الدفع","Choisir un paiement":"اختر دفعة","Signé par":"موقّع من طرف","Directeur":"المدير","Comptable":"المحاسب",
"📤 Envoyer l'image (WhatsApp)":"📤 إرسال الصورة (واتساب)","⬇️ Télécharger l'image":"⬇️ تحميل الصورة","🖨️ Imprimer":"🖨️ طباعة",
"Envoyer le texte par WhatsApp":"إرسال النص عبر واتساب","⚙️ Configurer cachet et signatures":"⚙️ إعداد الختم والتوقيعات",
"Total des retards":"إجمالي المتأخرات","Reste à payer":"المتبقي للدفع","Relancer":"تذكير","Détail mois par mois":"التفصيل شهرا بشهر","Mois":"الشهر","Statut":"الحالة",
"Message":"الرسالة","Information":"معلومة","Événement":"حدث","Réunion":"اجتماع","Rappel":"تذكير",
"Envoyer dans un groupe ou un contact":"إرسال إلى مجموعة أو جهة اتصال","Ou un parent à la fois :":"أو ولي واحدا تلو الآخر:","Parent":"الولي","Pas de numéro":"لا يوجد رقم"
};
function langue(){return localStorage.getItem('ss_lang')==='ar'?'ar':'fr'}
function changerLangue(){localStorage.setItem('ss_lang',langue()==='ar'?'fr':'ar');location.reload()}
function traduireNoeud(n){
  if(n.nodeType===3){const k=n.nodeValue.trim();if(AR[k])n.nodeValue=n.nodeValue.replace(k,AR[k]);return}
  if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
  if(n.placeholder&&AR[n.placeholder])n.placeholder=AR[n.placeholder];
  n.childNodes.forEach(traduireNoeud);
}
function initLangue(){
  const b=document.createElement('button');b.id='btnLangue';b.className='noprint';
  b.textContent=langue()==='ar'?'Français':'العربية';
  b.style.cssText='position:fixed;left:8px;bottom:8px;width:auto;padding:8px 12px;margin:0;font-size:.85em;background:#b8860b;color:#fff;border:none;border-radius:8px;z-index:9000';
  b.onclick=changerLangue;document.body.appendChild(b);
  if(langue()!=='ar')return;
  document.documentElement.dir='rtl';document.documentElement.lang='ar';
  traduireNoeud(document.body);
  new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(traduireNoeud);if(m.type==='characterData')traduireNoeud(m.target)})}).observe(document.body,{childList:true,subtree:true,characterData:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initLangue);else initLangue();
/* ===== MESSAGES WHATSAPP BILINGUES ===== */
function versArabe(msg){
  const T={'Inscription':'التسجيل','Mensualité':'القسط الشهري','Autres frais':'رسوم أخرى'};
  if(msg.indexOf('*École Al Islah - Reçu ')===0){
    const g=function(k){const r=msg.match(new RegExp('\\n'+k+' : (.*)'));return r?r[1]:''};
    const num=(msg.match(/Reçu ([^*]+)\*/)||[])[1]||'';
    return '*مدرسة الإصلاح - وصل '+num+'*\nالتلميذ : '+g('Élève')+'\nالنوع : '+(T[g('Type')]||g('Type'))+'\nالمبلغ : '+g('Montant')+'\nالتاريخ : '+g('Date')+'\nشكرا لثقتكم.';
  }
  if(msg.indexOf('rappel de paiement pour ')>-1){
    const nom=(msg.match(/rappel de paiement pour (.*)\./)||[])[1]||'';
    const g=function(k){const r=msg.match(new RegExp(k+' : (.*)'));return r?r[1].replace(/\*/g,''):''};
    return 'السلام عليكم ورحمة الله،\n*مدرسة الإصلاح* : تذكير بالدفع للتلميذ '+nom+'.\nالمبلغ المستحق إلى اليوم : '+g('Montant dû à ce jour')+'\nالمدفوع : '+g('Déjà payé')+'\n*المتبقي للدفع : '+g('Reste à payer')+'*\nيُرجى تسديد القسط الشهري في أجل أقصاه الخامس من كل شهر. شكرا لتفهمكم.';
  }
  return '';
}
function lienWhatsApp(tel,msg){
  const ar=versArabe(msg);
  if(ar)msg=msg+'\n\n──────────\n\n'+ar;
  let n=String(tel||'').replace(/\D/g,'');if(n.length===9)n='221'+n;
  return 'https://wa.me/'+n+'?text='+encodeURIComponent(msg);
           }
/* ===== SAUVEGARDE : liens sur le tableau de bord ===== */
Object.assign(AR,{'📦 Sauvegarde et restauration':'📦 النسخ الاحتياطي والاستعادة','📄 Rapport financier':'📄 التقرير المالي','⚠️ Pense à faire une sauvegarde (aucune depuis plus de 7 jours).':'⚠️ تذكير: قم بنسخة احتياطية (لم تتم منذ أكثر من 7 أيام).'});
function initSauvegarde(){
  if(!$('solde'))return;
  const ancre=document.querySelector('button[onclick="exporterDonnees()"]');
  [['senschool-sauvegarde.html','📦 Sauvegarde et restauration'],['senschool-rapport.html','📄 Rapport financier']].forEach(function(x){
    const a=document.createElement('a');a.className='btn gris';a.href=x[0];a.textContent=x[1];ancre.parentNode.insertBefore(a,ancre)});
  const d=localStorage.getItem('ss_derniere_sauvegarde');
  if(!d||Date.now()-new Date(d).getTime()>7*86400000){
    const m=document.createElement('div');m.className='card';m.style.cssText='border:2px solid #b8860b';
    m.textContent='⚠️ Pense à faire une sauvegarde (aucune depuis plus de 7 jours).';
    document.querySelector('h1').after(m);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSauvegarde);else initSauvegarde();
/* ===== ARABE : sauvegarde, rapport et messages ===== */
Object.assign(AR,{
"Sauvegarde":"النسخ الاحتياطي",
"⬇️ Télécharger la sauvegarde":"⬇️ تحميل النسخة الاحتياطية",
"📄 Rapport financier (PDF)":"📄 التقرير المالي (PDF)",
"Restaurer une sauvegarde":"استعادة نسخة احتياطية",
"Remplace TOUTES les données actuelles par celles du fichier choisi. Une copie de l'état actuel est téléchargée d'abord.":"يستبدل كل البيانات الحالية ببيانات الملف المختار. يتم تحميل نسخة من الحالة الحالية أولا.",
"⚠️ Aucune sauvegarde faite sur ce téléphone.":"⚠️ لم تتم أي نسخة احتياطية على هذا الهاتف.",
"⬅️ Retour":"⬅️ رجوع",
"🖨️ Imprimer / Enregistrer en PDF":"🖨️ طباعة / حفظ بصيغة PDF",
"Dans la fenêtre d'impression, choisis « Enregistrer au format PDF ».":"في نافذة الطباعة، اختر «حفظ بصيغة PDF».",
"École Al Islah - Yeumbeul Nord":"مدرسة الإصلاح الفرنسية العربية",
"Dû":"المستحق","Payé":"المدفوع","Reste":"المتبقي",
"Frais attendus (année complète)":"الرسوم المنتظرة (السنة كاملة)",
"Encaissé : inscriptions":"المحصّل : التسجيلات",
"Encaissé : mensualités":"المحصّل : الأقساط الشهرية",
"Encaissé : autres frais":"المحصّل : رسوم أخرى",
"Reste à encaisser (frais scolaires)":"المتبقي للتحصيل (الرسوم الدراسية)",
"Dépenses de l'année":"مصاريف السنة",
"Solde de caisse (encaissé − dépenses)":"رصيد الصندوق (المحصّل − المصاريف)"
});
const FRAG={
"Dernière sauvegarde sur ce téléphone : ":"آخر نسخة احتياطية على هذا الهاتف : ",
"Rapport financier ":"التقرير المالي ",
" — édité le ":" — حُرّر بتاريخ ",
"élève(s) sans tarif défini : leur dû n'est pas compté.":"تلميذ بدون تعريفة محددة: مستحقاتهم غير محسوبة."
};
function traduireNoeud(n){
  if(n.nodeType===3){
    const k=n.nodeValue.trim();
    if(AR[k]){n.nodeValue=n.nodeValue.replace(k,AR[k]);return}
    let v=n.nodeValue,ch=false;
    Object.keys(FRAG).forEach(function(f){if(v.indexOf(f)>-1){v=v.split(f).join(FRAG[f]);ch=true}});
    if(ch)n.nodeValue=v;
    return;
  }
  if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
  if(n.placeholder&&AR[n.placeholder])n.placeholder=AR[n.placeholder];
  n.childNodes.forEach(traduireNoeud);
}
const MSG={
"Réservé au directeur.":"خاص بالمدير.",
"Fichier invalide.":"ملف غير صالح.",
"Ce fichier n'est pas une sauvegarde SenSchool.":"هذا الملف ليس نسخة احتياطية لـ SenSchool.",
"✅ Sauvegarde restaurée.":"✅ تمت استعادة النسخة الاحتياطية.",
"✅ Paiement enregistré.":"✅ تم تسجيل الدفعة.",
"✅ Tarif enregistré.":"✅ تم حفظ التعريفة.",
"✅ Élève inscrit.":"✅ تم تسجيل التلميذ.",
"Choisis un élève.":"اختر تلميذا.",
"Cet élève est déjà inscrit pour cette année.":"هذا التلميذ مسجل بالفعل لهذه السنة.",
"Supprimer ce tarif ?":"حذف هذه التعريفة؟",
"Un tarif existe déjà pour cette combinaison. Le remplacer ?":"توجد تعريفة لهذه الحالة. هل تريد استبدالها؟",
"Archiver cet élève ? Son historique de paiements est conservé.":"أرشفة هذا التلميذ؟ سجل مدفوعاته محفوظ.",
"Pour supprimer TOUTES les données (définitif), écris EFFACER :":"لحذف كل البيانات نهائيا، اكتب EFFACER :"
};
const MSGFRAG={
"Restaurer la sauvegarde du ":"استعادة النسخة الاحتياطية بتاريخ ",
" ? Contenu : ":" ؟ المحتوى : ",
"(élèves / tarifs / paiements / dépenses). Les données actuelles seront remplacées.":"(تلاميذ / تعريفات / مدفوعات / مصاريف). سيتم استبدال البيانات الحالية.",
"Ce montant dépasse le reste à payer de l'année (":"هذا المبلغ يتجاوز المتبقي للسنة (",
"). Continuer ?":"). هل تريد المتابعة؟",
"⚠️ Erreur de sauvegarde en ligne : ":"⚠️ خطأ في الحفظ على الإنترنت : ",
"Erreur : ":"خطأ : "
};
function trMsg(s){
  if(MSG[s])return MSG[s];
  Object.keys(MSGFRAG).forEach(function(f){s=s.split(f).join(MSGFRAG[f])});
  return s;
}
(function(){
  if(langue()!=='ar')return;
  const a=window.alert,c=window.confirm,p=window.prompt;
  window.alert=function(m){return a.call(window,trMsg(String(m)))};
  window.confirm=function(m){return c.call(window,trMsg(String(m)))};
  window.prompt=function(m,d){return p.call(window,trMsg(String(m)),d)};
})();
