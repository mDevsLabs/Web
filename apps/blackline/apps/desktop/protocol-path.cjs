const path=require('node:path');
function resolveAsset(root,url){const parsed=new URL(url);if(parsed.protocol!=='blackline:'||parsed.hostname!=='app')return null;let pathname;try{pathname=decodeURIComponent(parsed.pathname);}catch{return null;}const base=path.resolve(root),file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));return file.startsWith(base+path.sep)?file:null;}
module.exports={resolveAsset};
