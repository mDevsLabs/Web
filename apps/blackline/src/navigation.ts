import { circleBlocked,distance } from './math.ts';
import type { Box,Vec2 } from './types.ts';
class Heap {
  data:{id:number;f:number}[]=[];
  push(v:{id:number;f:number}){let i=this.data.length;this.data.push(v);while(i>0){const p=(i-1)>>1;if(this.data[p].f<=v.f)break;this.data[i]=this.data[p];i=p;}this.data[i]=v;}
  pop(){const first=this.data[0],last=this.data.pop()!;if(this.data.length){let i=0;while(true){let c=i*2+1;if(c>=this.data.length)break;if(c+1<this.data.length&&this.data[c+1].f<this.data[c].f)c++;if(this.data[c].f>=last.f)break;this.data[i]=this.data[c];i=c;}this.data[i]=last;}return first;}
}
export class Navigation {
  readonly cell=1.25; readonly cols:number; readonly rows:number;readonly blocked:Uint8Array;
  constructor(readonly width:number,readonly depth:number,readonly boxes:Box[]){
    this.cols=Math.floor(width/this.cell);this.rows=Math.floor(depth/this.cell);this.blocked=new Uint8Array(this.cols*this.rows);
    for(let i=0;i<this.blocked.length;i++){const p=this.point(i);this.blocked[i]=circleBlocked(p,.49,boxes)?1:0;}
  }
  point(id:number):Vec2 {return {x:(id%this.cols+.5)*this.cell-this.width/2,z:(Math.floor(id/this.cols)+.5)*this.cell-this.depth/2};}
  index(p:Vec2){const x=Math.max(0,Math.min(this.cols-1,Math.floor((p.x+this.width/2)/this.cell))),z=Math.max(0,Math.min(this.rows-1,Math.floor((p.z+this.depth/2)/this.cell)));return z*this.cols+x;}
  nearest(p:Vec2){const id=this.index(p);if(!this.blocked[id])return id;const x=id%this.cols,z=Math.floor(id/this.cols);for(let r=1;r<12;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)!==r&&Math.abs(dz)!==r)continue;const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue;const n=nz*this.cols+nx;if(!this.blocked[n])return n;}return -1;}
  path(from:Vec2,to:Vec2):Vec2[]{
    const start=this.nearest(from),goal=this.nearest(to);if(start<0||goal<0)return [];
    if(start===goal)return [this.point(goal)];
    const n=this.blocked.length,g=new Float32Array(n).fill(Infinity),parent=new Int32Array(n).fill(-1),closed=new Uint8Array(n),heap=new Heap();
    g[start]=0;heap.push({id:start,f:distance(this.point(start),this.point(goal))});
    let found=false,iterations=0;
    while(heap.data.length&&iterations++<this.blocked.length){
      const {id}=heap.pop();if(closed[id])continue;closed[id]=1;if(id===goal){found=true;break;}
      const x=id%this.cols,z=Math.floor(id/this.cols);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue;
        const next=nz*this.cols+nx;if(this.blocked[next]||closed[next])continue;
        if(dx&&dz&&(this.blocked[z*this.cols+nx]||this.blocked[nz*this.cols+x]))continue;
        const cost=g[id]+(dx&&dz?1.4142:1)*this.cell;if(cost>=g[next])continue;g[next]=cost;parent[next]=id;heap.push({id:next,f:cost+distance(this.point(next),this.point(goal))});
      }
    }
    if(!found)return [];const path:Vec2[]=[];for(let id=goal;id!==start;id=parent[id]){path.push(this.point(id));if(parent[id]<0)return [];}
    return path.reverse();
  }
}
