// Pace to absolute deadlines: fractional display refresh rates do not reduce 60 FPS to 30.
export class FramePacer {
  deadline=0;limit=0;
  reset(){this.deadline=0;this.limit=0;}
  due(now:number,fps:number){if(this.limit!==fps){this.limit=fps;this.deadline=now;}return now+.75>=this.deadline;}
  rendered(now:number){const interval=1000/this.limit;this.deadline+=interval;if(this.deadline<now-interval)this.deadline=now+interval;}
  delay(now:number){return Math.max(0,this.deadline-now-7);}
}
