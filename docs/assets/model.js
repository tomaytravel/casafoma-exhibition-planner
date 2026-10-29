import { FLOORPLANS } from './room-data.js';
import { artworkDimensions } from './catalog.js';
export const ROOM_META={main:{index:0,label:'본관',base:1.12,tx:0,ty:0},annex:{index:1,label:'별관',base:0,tx:.3427,ty:13.4921}};
export const modelClone=o=>JSON.parse(JSON.stringify(o));
export const modelClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const modelSnap=(v,step=.05)=>Number((Math.round(v/step)*step).toFixed(6));
export function localToWorld(room,x,y,z=0,view=2){const r=ROOM_META[room],shift=view===2;return [x+(shift?r.tx:0),y+(shift?r.ty:0),r.base+z];}
export function worldToLocal(room,x,y,view=2){const r=ROOM_META[room],shift=view===2;return [x-(shift?r.tx:0),y-(shift?r.ty:0)];}
export function modelInside(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function modelSegmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?modelClamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l,0,1):0;return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);}
function modelCross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function modelSegmentsIntersect(a,b,c,d){return modelCross(a,b,c)*modelCross(a,b,d)<-1e-9&&modelCross(c,d,a)*modelCross(c,d,b)<-1e-9;}
export function modelFootprint(item,padding=0){const w=item.type==='table'?item.w:item.type==='human'?.32:artworkDimensions(item).outerW,d=item.type==='table'?item.d:item.type==='human'?.32:.08,a=(item.angle||0)*Math.PI/180;return [[-w/2-padding,-d/2-padding],[w/2+padding,-d/2-padding],[w/2+padding,d/2+padding],[-w/2-padding,d/2+padding]].map(([x,y])=>[item.x+x*Math.cos(a)-y*Math.sin(a),item.y+x*Math.sin(a)+y*Math.cos(a)]);}
function modelPolygonsOverlap(a,b){for(const poly of [a,b])for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length,axis=[-(poly[j][1]-poly[i][1]),poly[j][0]-poly[i][0]],pa=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),pb=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);if(Math.max(...pa)<=Math.min(...pb)+.001||Math.max(...pb)<=Math.min(...pa)+.001)return false;}return true;}
export function roomWalls(room){const p=FLOORPLANS[ROOM_META[room].index];return p.walls.map((w,index)=>{const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],length=Math.hypot(dx,dy);let normal=[-dy/length,dx/length],mid=[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2],inside=modelInside([mid[0]+normal[0]*.15,mid[1]+normal[1]*.15],p.outline);if(!inside)normal=normal.map(n=>-n);const orientation=Math.abs(dx)>Math.abs(dy)?'가로 벽':'세로 벽';return {...w,id:room+'-w'+index,index,length,normal,tangent:[dx/length,dy/length],label:`${orientation} ${index+1} · ${length.toFixed(2)}m`};}).filter(w=>w.kind!=='glass'&&w.length>=.30);}
export function getWall(item){return roomWalls(item.room).find(w=>w.id===item.wallId);}
export function wallArtPose(item,view=2){const wall=getWall(item);if(!wall)return null;const normal=wall.normal.map(n=>n*(item.side===-1?-1:1)),t=wall.tangent,offset=.09+(item.depth||.04)/2;const x=wall.a[0]+t[0]*item.offset+normal[0]*offset,y=wall.a[1]+t[1]*item.offset+normal[1]*offset;return {center:localToWorld(item.room,x,y,item.centerHeight,view),tangent:t,normal,wall};}
export function modelDefaultItems(){let id=1,items=[];for(const room of ['main','annex']){const p=FLOORPLANS[ROOM_META[room].index];for(const [i,t] of (p.tables||[]).entries())items.push({id:id++,type:'table',room,name:'시음대 '+(i+1),x:t.x+t.w/2,y:t.y+t.d/2,w:t.w,d:t.d,h:t.h,angle:0});for(const person of p.people)items.push({id:id++,type:'human',room,name:person.kind==='female'?'여성형 160cm':'남성형 180cm',kind:person.kind,height:person.h,x:person.x,y:person.y,angle:0});}return items;}
export function modelValidate(item,items,ceiling=2.7){
 if(!ROOM_META[item.room])return '공간을 선택하세요.';if(!['table','art','human'].includes(item.type))return '알 수 없는 항목입니다.';
 if(item.type==='art'){
  if(item.roll!==undefined&&(!Number.isFinite(item.roll)||Math.abs(item.roll/90-Math.round(item.roll/90))>1e-6))return '액자 회전은 90도 단위여야 합니다.';
  let d;try{d=artworkDimensions(item);}catch(e){return e.message;}if(![d.width,d.height,d.outerW,d.outerH,item.centerHeight,item.depth,item.frame].every(Number.isFinite)||d.width<.1||d.height<.1||d.outerW>4||d.outerH>4||item.frame<0||item.frame>.15||item.depth<=0||item.depth>.3)return '작품·프레임 치수가 유효하지 않습니다.';
  if(item.centerHeight-d.outerH/2<.05-1e-5||item.centerHeight+d.outerH/2>ceiling-(item.mount==='wire'?.07:0)+1e-5)return '작품이 바닥 또는 천장을 넘어갑니다.';
  if(item.mount==='wall'){const wall=getWall(item);if(!wall)return '벽을 선택하세요.';if(!Number.isFinite(item.offset)||item.offset-d.outerW/2<.02-1e-5||item.offset+d.outerW/2>wall.length-.02+1e-5)return '액자가 선택한 벽의 양끝을 넘어갑니다.';return null;}
  if(item.mount!=='wire')return '벽 부착 또는 와이어를 선택하세요.';
 }
 if(![item.x,item.y,item.angle].every(Number.isFinite))return '위치와 회전값은 숫자여야 합니다.';
 if(item.type==='table'&&(![item.w,item.d,item.h].every(Number.isFinite)||item.w<.3||item.d<.3||item.w>5||item.d>5||item.h<.3||item.h>ceiling-.1||Math.abs(item.angle/90-Math.round(item.angle/90))>1e-6))return '테이블은 유효한 치수와 90도 단위 회전이 필요합니다.';
 if(item.type==='human'&&(!['female','male'].includes(item.kind)||item.height!==(item.kind==='female'?1.6:1.8)))return '실루엣 키는 160cm 또는 180cm로 고정됩니다.';
 const p=FLOORPLANS[ROOM_META[item.room].index],poly=modelFootprint(item,.035);
 if(!poly.every(v=>modelInside(v,p.outline)))return '항목 전체를 해당 공간의 바닥 안에 놓으세요.';
 for(const w of p.walls){if(poly.some(v=>modelSegmentDistance(v,w.a,w.b)<.045)||modelInside(w.a,poly)||modelInside(w.b,poly)||poly.some((v,i)=>modelSegmentsIntersect(v,poly[(i+1)%4],w.a,w.b)))return '벽을 통과하거나 벽에 겹칠 수 없습니다.';}
 // Suspended works do not occupy the floor. Furniture and people do.
 if(item.type==='art')return null;
 const fixed=[...(p.displays||[]),...(p.shelves||[]),...(p.steps||[]),...p.columns.map(([x,y])=>({x:x-.065,y:y-.065,w:.13,d:.13}))];for(const s of fixed){const rect=[[s.x,s.y],[s.x+s.w,s.y],[s.x+s.w,s.y+s.d],[s.x,s.y+s.d]];if(modelPolygonsOverlap(poly,rect))return '고정 수납장·선반과 겹칩니다.';}
 for(const other of items){if(other.id===item.id||other.room!==item.room||other.type==='art')continue;if(modelPolygonsOverlap(poly,modelFootprint(other,.025)))return '다른 테이블 또는 실루엣과 겹칩니다.';}
 return null;
}
export function rotateArtwork(item,ceiling=2.7){
 const next={...modelClone(item),roll:((item.roll||0)+90)%360},d=artworkDimensions(next);
 if(d.outerH>ceiling-.05-(next.mount==='wire'?.07:0))return {error:'회전한 액자의 높이가 천장고를 넘어갑니다.'};
 if(next.mount==='wall'){const wall=getWall(next);if(!wall||d.outerW>wall.length-.04)return {error:'회전한 액자가 현재 벽의 폭을 넘어갑니다.'};next.offset=modelClamp(next.offset,d.outerW/2+.02,wall.length-d.outerW/2-.02);}
 next.centerHeight=modelClamp(next.centerHeight,d.outerH/2+.05,ceiling-d.outerH/2-(next.mount==='wire'?.07:0));return {item:next};
}
export function normalizeArtwork(item,ceiling=2.7){let out={...modelClone(item),roll:item.roll||0},d=artworkDimensions(out);out.centerHeight=modelClamp(Number(out.centerHeight)||1.5,d.outerH/2+.05,ceiling-d.outerH/2-(out.mount==='wire'?.07:0));if(out.mount==='wall'){let wall=getWall(out);if(!wall||wall.length<d.outerW+.04){wall=roomWalls(out.room).find(w=>w.length>=d.outerW+.04);out.wallId=wall?.id;}if(wall)out.offset=modelClamp(Number(out.offset)||wall.length/2,d.outerW/2+.02,wall.length-d.outerW/2-.02);}return out;}
export function findPlacement(item,items,ceiling=2.7){const p=FLOORPLANS[ROOM_META[item.room].index],xs=p.outline.map(v=>v[0]),ys=p.outline.map(v=>v[1]),cx=Number.isFinite(item.x)?item.x:(Math.min(...xs)+Math.max(...xs))/2,cy=Number.isFinite(item.y)?item.y:(Math.min(...ys)+Math.max(...ys))/2;const candidates=[[cx,cy]];for(let x=Math.min(...xs)+.3;x<Math.max(...xs);x+=.25)for(let y=Math.min(...ys)+.3;y<Math.max(...ys);y+=.25)candidates.push([x,y]);candidates.sort((a,b)=>(a[0]-cx)**2+(a[1]-cy)**2-((b[0]-cx)**2+(b[1]-cy)**2));for(const [x,y]of candidates){const next={...item,x:modelSnap(x),y:modelSnap(y)};if(!modelValidate(next,items,ceiling))return next;}return null;}
export class LayoutModel{
 constructor(items=modelDefaultItems()){this.items=modelClone(items);this.nextId=Math.max(0,...this.items.map(i=>i.id))+1;this.undoStack=[];this.redoStack=[];}
 snapshot(){return modelClone(this.items);}
 record(before){if(JSON.stringify(before)===JSON.stringify(this.items))return;this.undoStack.push(before);if(this.undoStack.length>35)this.undoStack.shift();this.redoStack=[];}
 undo(){if(!this.undoStack.length)return false;this.redoStack.push(this.snapshot());this.items=this.undoStack.pop();return true;}
 redo(){if(!this.redoStack.length)return false;this.undoStack.push(this.snapshot());this.items=this.redoStack.pop();return true;}
 get(id){return this.items.find(i=>i.id===Number(id));}
 add(item,ceiling=2.7){if(this.items.length>=60)return {error:'현재 프리뷰는 최대 60개 항목을 저장합니다. 배치를 JSON으로 내보낼 수 있습니다.'};const before=this.snapshot();let next={...modelClone(item),id:this.nextId++};if(next.type==='art'){next=normalizeArtwork(next,ceiling);if(next.mount==='wire')next=findPlacement(next,this.items,ceiling);}else next=findPlacement(next,this.items,ceiling);if(!next)return {error:'해당 공간에 배치할 자리가 없습니다.'};const error=modelValidate(next,this.items,ceiling);if(error)return {error};this.items.push(next);this.record(before);return {item:next};}
 update(id,patch,ceiling=2.7,record=true){const old=this.get(id);if(!old)return {error:'항목을 선택하세요.'};const before=record?this.snapshot():null,next={...modelClone(old),...modelClone(patch)};const error=modelValidate(next,this.items,ceiling);if(error)return {error};this.items[this.items.indexOf(old)]=next;if(record)this.record(before);return {item:next};}
 remove(id){const before=this.snapshot();this.items=this.items.filter(i=>i.id!==id);this.record(before);}
 pack(){return this.items.map(i=>i.type==='table'?['t',i.id,i.room,i.name,i.x,i.y,i.w,i.d,i.h,i.angle]:i.type==='human'?['h',i.id,i.room,i.name,i.x,i.y,i.kind,i.height]:['a',i.id,i.room,i.name,i.family,i.size,i.variant,i.orientation,i.frame,i.depth,i.mount,i.wallId,i.offset,i.side,i.centerHeight,i.x,i.y,i.angle,i.finish,i.customW,i.customH,i.roll||0]);}
 static unpack(rows){if(!Array.isArray(rows)||rows.length>60)throw Error('항목 수가 유효하지 않습니다.');return rows.map(r=>r[0]==='t'?{type:'table',id:r[1],room:r[2],name:r[3],x:r[4],y:r[5],w:r[6],d:r[7],h:r[8],angle:r[9]}:r[0]==='h'?{type:'human',id:r[1],room:r[2],name:r[3],x:r[4],y:r[5],kind:r[6],height:r[7],angle:0}:r[0]==='a'?{type:'art',id:r[1],room:r[2],name:r[3],family:r[4],size:r[5],variant:r[6],orientation:r[7],frame:r[8],depth:r[9],mount:r[10],wallId:r[11],offset:r[12],side:r[13],centerHeight:r[14],x:r[15],y:r[16],angle:r[17],finish:r[18],customW:r[19],customH:r[20],roll:r[21]||0}:(()=>{throw Error('알 수 없는 항목 형식');})());}
 import(doc,ceiling=2.7){if(doc?.schema!=='casafoma-layout-v1'||!Array.isArray(doc.items)||doc.items.length>60)throw Error('지원하는 배치 JSON이 아닙니다.');const items=modelClone(doc.items),ids=new Set();for(const item of items){if(!Number.isSafeInteger(item.id)||item.id<1||ids.has(item.id)||typeof item.name!=='string'||[...item.name].length>24)throw Error('항목 ID·이름이 유효하지 않습니다.');ids.add(item.id);const error=modelValidate(item,items,ceiling);if(error)throw Error(item.name+': '+error);}const before=this.snapshot();this.items=items;this.nextId=Math.max(0,...items.map(i=>i.id))+1;this.record(before);}
 export(){return {schema:'casafoma-layout-v1',units:'m',assumptions:{mainFloorRise:1.12,annexDoorWidth:1.6},items:this.snapshot()};}
}
