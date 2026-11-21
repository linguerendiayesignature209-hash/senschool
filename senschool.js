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
