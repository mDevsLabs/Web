const fs=require('fs'),path=require('path');
const scriptPath=__filename;
process.on('exit',()=>{try{fs.unlinkSync(scriptPath)}catch{}});
let input=''; const expected=43936;
process.stdin.setEncoding('ascii');
process.stdin.on('data',chunk=>{
  input+=Array.from(chunk).filter(c=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.includes(c)).join('');
  if(input.length<expected)return;
  process.stdin.pause();
  const patch=Buffer.from(input.slice(0,expected),'base64').toString('utf8');
  const root=path.resolve('packages/ui')+path.sep;
  const blocks=patch.split(/^diff --git /m).slice(1);
  const writes=new Map(), errors=[];
  for(const block of blocks){
    const match=/a\/(.+) b\/(.+)/.exec(block.split('\n')[0]);
    if(!match){errors.push('Invalid diff header');continue;}
    const rel=match[2].replace(/\\/g,'/');
    const absolute=path.resolve(rel);
    if(!absolute.startsWith(root)){errors.push('Out of scope: '+rel);continue;}
    const isNew=block.includes('--- /dev/null');
    let lines;
    if(isNew){if(fs.existsSync(absolute)){errors.push('Already exists: '+rel);continue;}lines=[];}
    else {if(!fs.existsSync(absolute)){errors.push('Missing: '+rel);continue;}lines=fs.readFileSync(absolute,'utf8').split('\n');}
    const hunks=block.split(/(?=^@@ )/m).filter(part=>part.startsWith('@@ '));
    for(const hunk of hunks){
      const body=hunk.slice(hunk.indexOf('\n')+1).split('\n').filter(line=>line&&(line[0]===' '||line[0]==='+'||line[0]==='-'));
      const old=body.filter(line=>line[0]===' '||line[0]==='-').map(line=>line.slice(1));
      const next=body.filter(line=>line[0]===' '||line[0]==='+').map(line=>line.slice(1));
      let at=-1;
      if(old.length===0){const position=/^@@ -(\d+)/.exec(hunk);at=Math.max(0,(position?Number(position[1]):1)-1);}
      else {
        const found=[];
        for(let i=0;i<=lines.length-old.length;i++)if(old.every((line,j)=>lines[i+j]===line))found.push(i);
        if(found.length===1)at=found[0];
        else if(found.length>1){const position=/^@@ -(\d+)/.exec(hunk),wanted=position?Number(position[1])-1:0;found.sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted));if(Math.abs(found[0]-wanted)!==Math.abs(found[1]-wanted))at=found[0];}
        if(at<0){errors.push(rel+': context absent or ambiguous ('+found.length+')');continue;}
      }
      lines.splice(at,old.length,...next);
    }
    writes.set(absolute,{rel,lines});
  }
  if(errors.length){console.error(errors.join('\n'));process.exitCode=2;return;}
  for(const [absolute,entry] of writes){fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,entry.lines.join('\n'),'utf8');}
  console.log('Applied '+writes.size+' files within packages/ui.');
});
