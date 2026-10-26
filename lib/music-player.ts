export class WeddingMusicPlayer{
 private audio:HTMLAudioElement|null=null;private context:AudioContext|null=null;private gain:GainNode|null=null;private interval:ReturnType<typeof setInterval>|null=null;private desired=false;private disposed=false;private generation=0;
 constructor(private src:string,private volume=.55,private fadeSeconds=8){}
 private clearFade(){if(this.interval){clearInterval(this.interval);this.interval=null;}}
 async play(){
  if(this.disposed)return false;const attempt=++this.generation;this.desired=true;this.clearFade();
  const audio=this.audio??(this.audio=new Audio(this.src));audio.loop=true;audio.preload="none";
  const AudioContextClass=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  try{
   if(AudioContextClass&&!this.context){this.context=new AudioContextClass();const source=this.context.createMediaElementSource(audio);this.gain=this.context.createGain();source.connect(this.gain);this.gain.connect(this.context.destination);}
   if(this.context&&this.gain){
    const at=this.context.currentTime;this.gain.gain.cancelScheduledValues(at);this.gain.gain.setValueAtTime(0,at);
    const resume=this.context.state==="suspended"?this.context.resume():Promise.resolve();
    const playing=audio.play();await Promise.all([resume,playing]);
    if(attempt!==this.generation||!this.desired||this.disposed)return false;
    const ready=this.context.currentTime;this.gain.gain.setValueAtTime(0,ready);this.gain.gain.linearRampToValueAtTime(this.volume,ready+this.fadeSeconds);
   }else{
    audio.volume=0;await audio.play();if(attempt!==this.generation||!this.desired||this.disposed)return false;const start=Date.now();this.interval=setInterval(()=>{if(!this.desired||this.disposed){this.clearFade();return;}audio.volume=this.volume*Math.min(1,(Date.now()-start)/(this.fadeSeconds*1000));if(audio.volume>=this.volume)this.clearFade();},100);
   }
   if(!this.desired||this.disposed){audio.pause();return false;}return true;
  }catch{if(attempt===this.generation)this.pause();return false;}
 }
 pause(){this.generation++;this.desired=false;this.clearFade();this.audio?.pause();if(this.context&&this.gain){const at=this.context.currentTime;this.gain.gain.cancelScheduledValues(at);this.gain.gain.setValueAtTime(0,at);}}
 dispose(){this.pause();this.disposed=true;if(this.audio){this.audio.removeAttribute("src");this.audio.load();}void this.context?.close().catch(()=>{});this.audio=null;this.context=null;this.gain=null;}
}
