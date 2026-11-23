/* SenSchool - calculs financiers centraux (v1) */
const FIN=(function(){
  const CAL={debutMois:9,jourLimite:5,nbMensualites:12,annees:['2026-2027','2027-2028']};
  const MOIS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const p2=function(n){return String(n).padStart(2,'0')};
  const iso=function(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
  const nombre=function(x){x=Number(x);return x>0?x:0};
  function anneeDebut(a){return Number(String(a).split('-')[0])}

  /* ---- Calendrier unique ---- */
  function mois(annee){
    const a=anneeDebut(annee),r=[];
    for(let k=0;k<CAL.nbMensualites;k++){
      const d=new Date(a,CAL.debutMois+k,CAL.jourLimite);
      r.push({n:k+1,date:d,cle:d.getFullYear()+'-'+p2(d.getMonth()+1),libelle:MOIS[d.getMonth()]+' '+d.getFullYear()});
    }
    return r;
  }
  function moisEchus(annee,auj){auj=auj||new Date();return mois(annee).filter(function(m){return m.date<=auj}).length}
  function periode(annee){
    const a=anneeDebut(annee);
    return {debut:iso(new Date(a,CAL.debutMois,1)),fin:iso(new Date(a,CAL.debutMois+CAL.nbMensualites,1))};
  }
  function dansAnnee(annee,dateIso){const p=periode(annee);return !!dateIso&&dateIso>=p.debut&&dateIso<p.fin}

  /* ---- Cas social : un seul format {type, reducInscription, reducMensualite} ---- */
  function typeAide(v){
    const s=String(v||'').trim().toLowerCase();
    if(s.indexOf('grat')===0||s.indexOf('exon')===0)return 'Gratuit';
    if(s.indexOf('r')===0&&s.indexOf('duc')>0)return 'Réduction';
    return 'Normal';
  }
  function aideDe(e){
    const a=e.aide||{};
    const brutType=[a.type,e.statutAide,e.statutSocial].find(function(v){return String(v||'').trim()!==''});
    let ri=nombre(a.reducInscription!==undefined?a.reducInscription:e.reducInscription);
    let rm=nombre(a.reducMensualite!==undefined?a.reducMensualite:(e.reducMensualite!==undefined?e.reducMensualite:e.reduction));
    let type=brutType!==undefined?typeAide(brutType):((ri||rm)?'Réduction':'Normal');
    if(type!=='Réduction'){ri=0;rm=0}
    return {type:type,reducInscription:ri,reducMensualite:rm};
  }

  /* ---- Tarifs : année + classe (+ régime en option) ---- */
  function classeDe(e){return e.cursus==='Arabe uniquement'?'Arabe uniquement':(e.classeFrancaise||'')}
  function tarifBase(e){
    const c=classeDe(e);if(!c)return null;
    const l=lire('frais').filter(function(x){return x.classe&&x.anneeScolaire===e.anneeScolaire&&x.classe===c});
    return l.find(function(x){return x.regime&&x.regime!=='Tous'&&x.regime===e.regime})||l.find(function(x){return !x.regime||x.regime==='Tous'})||null;
  }
  function tarifPour(e){
    const a=aideDe(e),b=tarifBase(e);
    if(a.type==='Gratuit')return {inscription:0,mensualite:0,base:b,aide:a};
    if(!b)return null;
    return {inscription:Math.max((b.inscription||0)-a.reducInscription,0),mensualite:Math.max((b.mensualite||0)-a.reducMensualite,0),base:b,aide:a};
  }

  /* ---- Paiements valides, rattachés par identifiant, puis matricule ---- */
  function valides(){return lire('pai').filter(function(p){return !p.annule&&!p.archive})}
  function estDe(p,e){
    if(p.anneeScolaire!==e.anneeScolaire)return false;
    if(p.eleveId)return p.eleveId===e.id;
    if(p.matricule)return p.matricule===e.matricule;
    return p.nomEleve===e.nom;
  }
  function paiementsDe(e,type){return valides().filter(function(p){return estDe(p,e)&&(!type||p.typePaiement===type)})}
  function somme(l){return l.reduce(function(s,p){return s+(Number(p.montant)||0)},0)}

  /* ---- Situation d'un élève ---- */
  function situation(e,auj){
    const t=tarifPour(e);if(!t)return null;
    const ms=mois(e.anneeScolaire),n=moisEchus(e.anneeScolaire,auj),m=t.mensualite;
    const pi=somme(paiementsDe(e,'Inscription')),pm=somme(paiementsDe(e,'Mensualité'));
    let reste=pm,payes=0;
    const detail=ms.map(function(x,i){
      const o=Object.assign({},x,{montant:m,paye:0});
      if(m===0)o.statut='exonere';
      else if(reste>=m){o.statut='paye';o.paye=m;reste-=m;payes++}
      else if(reste>0){o.statut='partiel';o.paye=reste;reste=0}
      else o.statut=i<n?'retard':'avenir';
      return o;
    });
    const rIns=Math.max(t.inscription-pi,0);
    return {
      tarif:t,mensualite:m,nbEchus:n,
      inscription:{du:t.inscription,paye:pi,reste:rIns},
      duJour:t.inscription+n*m,duAnnee:t.inscription+ms.length*m,
      paye:pi+pm,payeMens:pm,moisPayes:payes,
      resteJour:rIns+Math.max(n*m-pm,0),
      resteAnnee:rIns+Math.max(ms.length*m-pm,0),
      detail:detail
    };
  }

  /* Mois couverts par un futur paiement de mensualité */
  function moisCouverts(e,montant){
    const t=tarifPour(e);if(!t||!t.mensualite)return {cles:[],libelles:[]};
    const ms=mois(e.anneeScolaire),m=t.mensualite,pm=somme(paiementsDe(e,'Mensualité'));
    const a=Math.floor(pm/m),b=Math.ceil((pm+Number(montant||0))/m);
    const sel=ms.slice(a,Math.min(b,ms.length));
    return {cles:sel.map(function(x){return x.cle}),libelles:sel.map(function(x){return x.libelle})};
  }

  /* ---- Résumé d'une année (rapport) ---- */
  function resumeAnnee(annee){
    const eleves=lire('insc').filter(function(e){return e.anneeScolaire===annee});
    const pais=valides().filter(function(p){return p.anneeScolaire===annee});
    const parType=function(t){return somme(pais.filter(function(p){return p.typePaiement===t}))};
    const deps=lire('dep').filter(function(d){return dansAnnee(annee,d.date)});
    let attendu=0,reste=0;const lignes=[],sansTarif=[];
    eleves.forEach(function(e){
      const s=situation(e);
      if(!s){sansTarif.push(e.id||e.matricule);lignes.push({eleve:e,situation:null});return}
      attendu+=s.duAnnee;reste+=s.resteAnnee;lignes.push({eleve:e,situation:s});
    });
    const enc=somme(pais),dep=somme(deps);
    return {nbEleves:eleves.length,attendu:attendu,reste:reste,
      inscriptions:parType('Inscription'),mensualites:parType('Mensualité'),autres:parType('Autres frais'),
      encaisse:enc,depenses:dep,solde:enc-dep,sansTarif:sansTarif,lignes:lignes};
  }

  return {CAL:CAL,mois:mois,moisEchus:moisEchus,periode:periode,dansAnnee:dansAnnee,aideDe:aideDe,classeDe:classeDe,
    tarifBase:tarifBase,tarifPour:tarifPour,valides:valides,paiementsDe:paiementsDe,somme:somme,
    situation:situation,moisCouverts:moisCouverts,resumeAnnee:resumeAnnee};
})();
