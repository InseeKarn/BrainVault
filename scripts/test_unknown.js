/* Test: equation with one unknown on isolated side (v = u + a*t) */
const http = require('http');
function request(method, path, body, token){
  return new Promise((resolve,reject)=>{
    const data = body?JSON.stringify(body):null;
    const options={hostname:'localhost',port:3000,path,method,headers:{}};
    if(data){options.headers['Content-Type']='application/json';options.headers['Content-Length']=Buffer.byteLength(data);} 
    if(token){options.headers['Authorization']='Bearer '+token;}
    const req=http.request(options,res=>{let c='';res.on('data',d=>c+=d);res.on('end',()=>{try{resolve({statusCode:res.statusCode,body:JSON.parse(c||'{}')});}catch(e){resolve({statusCode:res.statusCode,body:{raw:c}});}})});
    req.on('error',reject); if(data)req.write(data); req.end();
  });
}
(async()=>{
  const email='test.unknown.'+Date.now()+'@example.com';
  const password='BrainVaultDemo!1';
  const reg=await request('POST','/api/auth/register',{username:'UnknownTest',email,password});
  if(reg.statusCode>=400){console.log('register failed',reg.body);process.exit(1);} 
  const token=reg.body.token; 
  const submit=await request('POST','/api/problems/submit',{
    problemId:'OER_MIT_001',
    steps:[{formula:'v = u + a*t',variables:{u:0,a:3,t:10},result:30}],
    finalAnswer:{value:3}
  },token);
  console.log(JSON.stringify(submit.body));
})();
