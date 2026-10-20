const {app,BrowserWindow,protocol,net,session}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {resolveAsset}=require('./protocol-path.cjs');
const APP_URL='blackline://app/';
protocol.registerSchemesAsPrivileged([{scheme:'blackline',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.setAppUserModelId('dev.blackline.horizon');
function createWindow(){
 const win=new BrowserWindow({width:1440,height:900,minWidth:960,minHeight:540,backgroundColor:'#182620',title:'BLACKLINE',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(APP_URL))event.preventDefault();});
 void win.loadURL(APP_URL);
}
app.whenReady().then(()=>{
 protocol.handle('blackline',async request=>{const file=resolveAsset(path.join(__dirname,'dist'),request.url);if(!file)return new Response('Not found',{status:404});try{const source=await net.fetch(pathToFileURL(file).href),headers=new Headers(source.headers);headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'");return new Response(source.body,{status:source.status,headers});}catch{return new Response('Not found',{status:404});}});
 session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(contents.getURL().startsWith(APP_URL)&&['fullscreen','pointerLock'].includes(permission)));
 session.defaultSession.setPermissionCheckHandler((contents,permission)=>!!contents?.getURL().startsWith(APP_URL)&&['fullscreen','pointerLock'].includes(permission));
 session.defaultSession.on('will-download',(_event,item)=>item.setSaveDialogOptions({defaultPath:path.join(app.getPath('documents'),item.getFilename())}));
 createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
