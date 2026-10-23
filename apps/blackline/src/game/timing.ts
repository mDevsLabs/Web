// Split slow frames into bounded physics steps, keeping movement and timers consistent down to 10 FPS.
export function simulationSlices(elapsed:number){const time=Number.isFinite(elapsed)?Math.min(.1,Math.max(0,elapsed)):0;if(time===0)return [];const count=Math.ceil(time/(1/60));return Array.from({length:count},()=>time/count);}
