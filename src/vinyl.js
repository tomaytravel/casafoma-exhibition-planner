import {INSTALLATION_GRAPHICS} from './banner-data.js';
export const VINYL_LAYOUTS={1:{logoW:125,logoAnchor:[5350,220],artW:499.6,artAnchor:[2898,2450],artMax:108},2:{logoW:125,logoAnchor:[5340,240],artW:165,artAnchor:[4675,2310],artMax:117},3:{logoW:120,logoAnchor:[5320,200],artW:120,artAnchor:[4700,2340],artMax:157}};
export function vinylScalePair(state,study){const v=state.vinyl?.[study]||{};return {logo:Math.max(20,Math.min(180,Number(v.logo)||100)),art:Math.max(20,Math.min(VINYL_LAYOUTS[study].artMax,Number(v.art)||100))};}
export function vinylSVG(study,scales,glass=false,layer=null){
 const ns='http://www.w3.org/2000/svg',source=INSTALLATION_GRAPHICS['window-'+study],doc=new DOMParser().parseFromString(atob(source.split(',')[1]),'image/svg+xml'),svg=doc.documentElement,children=Array.from(svg.children),layout=VINYL_LAYOUTS[study];
 svg.replaceChildren();
 const node=(tag,attrs)=>{const el=doc.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
 if(glass){svg.append(node('rect',{width:5796,height:2700,fill:'#38464B'}),node('path',{d:'M0 2700L5796 0H5796V2700Z',fill:'#53636A',opacity:.4}));}
 for(const [kind,elements]of [['logo',[children[0]]],['art',children.slice(1)]]){if(layer&&kind!==layer)continue;const [x,y]=layout[kind+'Anchor'],scale=scales[kind]/100,g=node('g',{'data-vinyl-layer':kind,transform:`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`});g.append(...elements);svg.append(g);}
 if(glass){const g=node('g',{stroke:'#E7E5E0','stroke-width':22,fill:'none'});g.append(node('rect',{x:11,y:11,width:5774,height:2678}),node('path',{d:'M1932 0V2700M3864 0V2700'}));svg.append(g);}
 return new XMLSerializer().serializeToString(svg);
}
export function vinylURL(study,scales,glass=false,layer=null){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(vinylSVG(study,scales,glass,layer));}
