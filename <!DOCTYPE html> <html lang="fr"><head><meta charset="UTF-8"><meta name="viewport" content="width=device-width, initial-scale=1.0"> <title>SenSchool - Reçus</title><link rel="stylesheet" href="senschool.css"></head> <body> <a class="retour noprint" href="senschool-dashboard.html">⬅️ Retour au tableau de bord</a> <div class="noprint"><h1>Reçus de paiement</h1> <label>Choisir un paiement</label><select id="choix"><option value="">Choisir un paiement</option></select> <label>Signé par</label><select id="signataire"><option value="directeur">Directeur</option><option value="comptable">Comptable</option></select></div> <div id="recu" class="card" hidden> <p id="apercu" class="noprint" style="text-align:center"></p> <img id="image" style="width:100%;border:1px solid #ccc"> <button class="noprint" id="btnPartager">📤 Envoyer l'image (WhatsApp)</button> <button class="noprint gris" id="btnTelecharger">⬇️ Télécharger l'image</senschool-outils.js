function quandPret(f){const t=setInterval(function(){if(typeof cloud!=='undefined'&&cloud){clearInterval(t);f()}},200)}
async function lireReglages(){const s=await cloud.fs.getDoc(cloud.fs.doc(cloud.db,'donnees','reglages'));return s.exists()?s.data():{}}
function ecrireReglages(o){return cloud.fs.setDoc(cloud.fs.doc(cloud.db,'donnees','reglages'),o,{merge:true})}
function reduireImage(fichier,larg){
  return new Promise(function(ok,ko){
    const img=new Image();
    img.onload=function(){
      const r=Math.min(1,larg/img.width),c=document.createElement('canvas');
      c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);
      const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);
      const d=x.getImageData(0,0,c.width,c.height),p=d.data;
      for(let i=0;i<p.length;i+=4){
        const l=(p[i]+p[i+1]+p[i+2])/3;
        p[i+3]=l>215?0:(l>170?Math.round((215-l)/45*255):255);
      }
      x.putImageData(d,0,0);ok(c.toDataURL('image/png'));
    };
    img.onerror=ko;img.src=URL.createObjectURL(fichier);
  });
}
function chargerImage(src){return new Promise(function(ok){if(!src)return ok(null);const i=new Image();i.onload=function(){ok(i)};i.onerror=function(){ok(null)};i.src=src})}
async function genererRecu(p,numero,signataire,rg){
  const W=800,H=1000,c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  x.strokeStyle='#14532d';x.lineWidth=8;x.strokeRect(20,20,W-40,H-40);
  x.textAlign='center';x.fillStyle='#14532d';
  x.font='bold 36px Arial';x.fillText('École Al Islah - Yeumbeul Nord',W/2,100);
  x.fillStyle='#222';x.font='bold 30px Arial';x.fillText('REÇU DE PAIEMENT',W/2,160);
  x.font='28px Arial';x.fillText('وصل دفع',W/2,205);
  x.textAlign='left';x.font='26px Arial';
  const l=[['N° du reçu',numero],['Élève',p.nomEleve],['Année scolaire',p.anneeScolaire],['Type',p.typePaiement],['Montant',fcfa(p.montant)],['Date',dateFr(p.datePaiement)]];
  l.forEach(function(r,i){const y=290+i*80;x.fillStyle='#666';x.font='26px Arial';x.fillText(r[0],70,y);x.fillStyle='#000';x.font='bold 28px Arial';x.fillText(String(r[1]),330,y)});
  const cachet=await chargerImage(rg.cachet),sig=await chargerImage(signataire==='comptable'?rg.sigComptable:rg.sigDirecteur);
  function poser(img,bx,by,bw,bh){if(!img)return;const s=Math.min(bw/img.width,bh/img.height);x.drawImage(img,bx+(bw-img.width*s)/2,by+(bh-img.height*s)/2,img.width*s,img.height*s)}
  poser(cachet,70,720,280,170);poser(sig,450,720,280,170);
  x.fillStyle='#666';x.font='22px Arial';x.textAlign='center';
  x.fillText("Cachet de l'école",210,925);
  x.fillText('Signature : '+(signataire==='comptable'?'Comptable':'Directeur'),590,925);
  return new Promise(function(ok){c.toBlob(ok,'image/png')});
}
