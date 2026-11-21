// Completar con los datos públicos del proyecto Supabase.
const supabaseUrl = 'https://nrvlmnyrwvjhfadvyuvq.supabase.co';
const supabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydmxtbnlyd3ZqaGZhZHZ5dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzM0MDcsImV4cCI6MjA3NDgwOTQwN30.9CLJzGIh19GzSjT7XxZAu9fahO_f263R-Hn6lKPzbZ8';

const sessionKey = 'campamento-vppp-session';
const idleLimit = 30 * 60 * 1000;
const loginPage = 'Campamento_VPPP_Login.html';

function endSession(){
 const session=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
 sessionStorage.removeItem(sessionKey);
 if(session){
  request('/rest/v1/rpc/campamento_vppp_logout',{token_sesion:session.token},true).catch(()=>{});
 }
 location.replace(loginPage);
}

function currentSession(){
 const session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
 if(session && Date.now() - session.lastActivity >= idleLimit){
  sessionStorage.removeItem(sessionKey);
  return null;
 }
 return session;
}

function saveSession(session){
 sessionStorage.setItem(sessionKey, JSON.stringify({...session,lastActivity:Date.now()}));
}

async function request(path, body, keepalive=false){
 if(!supabaseUrl || !supabasePublishableKey){
  throw new Error('Completa la URL y la clave pública en Campamento_VPPP_Conexion.js.');
 }
 const response=await fetch(supabaseUrl.replace(/\/$/,'')+path,{
  method:'POST',keepalive,
  headers:{apikey:supabasePublishableKey,'Content-Type':'application/json'},
  body:JSON.stringify(body)
 });
 const raw=await response.text();
 let data;
 try{data=raw?JSON.parse(raw):null;}catch{throw new Error('Supabase devolvió una respuesta inesperada.');}
 if(!response.ok){
  const error=new Error(data?.message||data?.error_description||data?.msg||'No se pudo completar la operación.');
  error.status=response.status;
  throw error;
 }
 return data;
}

function login(email,password){
 return request('/rest/v1/rpc/campamento_vppp_login',{email,password});
}

function configRequest(name,params,token){
 return request('/rest/v1/rpc/campamento_vppp_'+name,{...params,token_sesion:token});
}

async function rpc(name,params={}){
 const session=currentSession();
 if(!session){endSession();throw new Error('Inicia sesión para continuar.');}
 try{
  const result=await configRequest(name,params,session.token);
  if(!currentSession()){endSession();throw new Error('La sesión terminó.');}
  saveSession(session);
  return result;
 }catch(error){
  if(error.status===401||error.status===403)endSession();
  throw error;
 }
}

function watchSession(){
 setInterval(()=>{if(!currentSession())endSession();},1000);
}
