export function dot(a,b){
    let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s
    }
    export function norm(a){ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*a[i]; return Math.sqrt(s) }
    export function cosine(a,b){ const n=norm(a)*norm(b); return n===0?0:dot(a,b)/n }