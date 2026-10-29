// Dimensions in millimetres, long side first. Standard numbered sizes, not interpolated.
// Source: https://yoonart.tistory.com/140 (Korean canvas/panel size table).
export const CANVAS_SIZES={
 1:[227,158,140,120],2:[258,179,160,140],3:[273,220,190,160],4:[334,242,212,190],5:[348,273,242,212],6:[409,318,273,242],8:[455,379,334,273],10:[530,455,409,334],12:[606,500,455,409],15:[651,530,500,455],20:[727,606,530,500],25:[803,651,606,530],30:[909,727,651,606],40:[1000,803,727,651],50:[1168,910,803,727]
};
export const PAPER_SIZES={A0:[1189,841],A1:[841,594],A2:[594,420],A3:[420,297],A4:[297,210]};
export function artworkDimensions(item){
 let d;if(item.family==='canvas'){const row=CANVAS_SIZES[item.size];if(!row)throw Error('지원하지 않는 캔버스 호수');d=item.variant==='S'?[row[1],row[1]]:[row[0],row[{F:1,P:2,M:3}[item.variant]??1]];}
 else if(item.family==='paper'){d=PAPER_SIZES[item.size];if(!d)throw Error('지원하지 않는 A 규격');}
 else d=[Number(item.customH)*1000,Number(item.customW)*1000].sort((a,b)=>b-a);
 const [long,short]=d;let width=(item.orientation==='landscape'?long:short)/1000,height=(item.orientation==='landscape'?short:long)/1000;const roll=Number(item.roll)||0;if(Math.abs(Math.round(roll/90))%2)[width,height]=[height,width];const frame=Number(item.frame)||0;
 return {width,height,outerW:width+2*frame,outerH:height+2*frame,frame};
}
export function artworkLabel(item){return item.family==='canvas'?`${item.variant}${item.size}호`:item.family==='paper'?item.size:'직접 규격';}
