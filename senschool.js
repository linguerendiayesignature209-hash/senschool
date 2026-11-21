const CLES={insc:'senschoolInscriptions',frais:'senschoolFrais',pai:'senschoolPaiements',dep:'senschoolDepenses'};
const $=id=>document.getElementById(id);
function lire(c){try{return JSON.parse(localStorage.getItem(CLES[c]))||[]}catch(e){return[]}}
function ecrire(c,l){localStorage.setItem(CLES[c],JSON.stringify(l))}
function fcfa(n){return Number(n).toLocaleString('fr-FR')+' FCFA'}
function dateFr(d){return d?d.split('-').reverse().join('/'):''}
function ligne(tbody,cellules){const tr=document.createElement('tr');cellules.forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.appendChild(td)});tbody.appendChild(tr);return tr}
function remplir(select,valeurs){valeurs.forEach(v=>{const o=document.createElement('option');o.value=o.textContent=v;select.appendChild(o)})}
function lienWhatsApp(tel,msg){let n=String(tel||'').replace(/\D/g,'');if(n.length===9)n='221'+n;return 'https://wa.me/'+n+'?text='+encodeURIComponent(msg)}
function telParent(nom,annee){const e=lire('insc').find(i=>i.nom===nom&&(!annee||i.anneeScolaire===annee));return e?e.telParent||'':''}