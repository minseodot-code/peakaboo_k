/* 책 사진: 꿈 페이지에 책마다 사진을 올려 둠 (밑줄 친 페이지, 책 표지, 읽은 자리 등)
   - 내가 올린 사진: 이 브라우저의 IndexedDB('peakaboo', 'photos')에 줄여서(긴 변 1600px, webp/jpeg) 저장
   - books.json 의 images: ["assets/photos/…"] 는 누구에게나 보이는 사진 (보기 전용 링크에서도 보임)
   - 보기 전용 링크에는 내가 올린 사진은 담기지 않음 (주소에 넣기엔 너무 큼) */
const PhotoDB=(()=>{
  let dbp=null;
  function db(){
    if (!dbp) dbp=new Promise((res,rej)=>{
      if (!('indexedDB' in window)) return rej(new Error('no idb'));
      const r=indexedDB.open('peakaboo',1);
      r.onupgradeneeded=()=>{ const s=r.result.createObjectStore('photos',{keyPath:'id',autoIncrement:true}); s.createIndex('slug','slug'); };
      r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn){ const d=await db(); return new Promise((res,rej)=>{ const t=d.transaction('photos',mode); const out=fn(t.objectStore('photos')); t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error); }); }
  return {
    list: slug=>tx('readonly', s=>s.index('slug').getAll(slug)).then(a=>(a||[]).sort((x,y)=>x.t-y.t)),
    add: (slug, blob, w, h)=>tx('readwrite', s=>s.add({slug, blob, w, h, t:Date.now()})),
    remove: id=>tx('readwrite', s=>s.delete(id)),
    clear: ()=>tx('readwrite', s=>s.clear()),
  };
})();
/* 큰 사진은 줄여서 저장 (휴대폰 사진은 수 MB라 그대로 두면 저장 공간이 금방 참) */
async function shrinkImage(file, max=1600){
  const url=URL.createObjectURL(file);
  try {
    const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const k=Math.min(1, max/Math.max(img.naturalWidth,img.naturalHeight)), w=Math.round(img.naturalWidth*k), h=Math.round(img.naturalHeight*k);
    const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h);
    let blob=await new Promise(r=>c.toBlob(r,'image/webp',.86));
    if (!blob || blob.type!=='image/webp') blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.86));
    return {blob,w,h};
  } finally { URL.revokeObjectURL(url); }
}
