// campus-quest 后端 · 零依赖 Node.js（>=18）
// 本地运行：node backend/server.js   默认端口 3000
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000;
const DB_PATH=path.join(__dirname,'db.json');
let db;
function loadDB(){try{db=JSON.parse(fs.readFileSync(DB_PATH,'utf8'))}catch(e){db={users:[],quests:[],sessions:{}};seed();save();}}
function save(){fs.writeFileSync(DB_PATH,JSON.stringify(db,null,1));}
function hash(pw){const s=crypto.randomBytes(8).toString('hex');return s+':'+crypto.scryptSync(pw,s,32).toString('hex');}
function verify(pw,st){const parts=st.split(':');const c=crypto.scryptSync(pw,parts[0],32);return crypto.timingSafeEqual(Buffer.from(parts[1],'hex'),c);}
function pub(u){return {username:u.username,coins:u.coins,rep:u.rep,lv:Math.floor(u.rep/5)+1};}
function seed(){
  db.users.push({username:'快递侠',password:hash('123456'),coins:500,rep:30});
  db.users.push({username:'高数之神',password:hash('123456'),coins:800,rep:45});
  db.quests.push({id:1,title:'代取菜鸟驿站快递 3 件',cat:'代取',reward:15,diff:1,time:'今天 18:00 前',place:'宿舍区 7 栋',desc:'大件需小推车，报手机尾号 8848。',status:'open',publisher:'快递侠',acceptor:null,proof:null,createdAt:Date.now()-3600e3});
  db.quests.push({id:2,title:'高数期中押题讲解 2 小时',cat:'辅导',reward:120,diff:3,time:'本周六下午',place:'图书馆 3F',desc:'微分方程与级数，求大佬带飞。',status:'open',publisher:'快递侠',acceptor:null,proof:null,createdAt:Date.now()-7200e3});
  db.quests.push({id:3,title:'帮忙占周五早八前排 ×2',cat:'跑腿',reward:10,diff:1,time:'周五 07:40',place:'教学楼 A301',desc:'放两本书即可，靠谱的来。',status:'open',publisher:'高数之神',acceptor:null,proof:null,createdAt:Date.now()-9000e3});
}
loadDB();

const server=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.end();return;}
  const url=new URL(req.url,'http://x');
  let body='';req.on('data',c=>body+=c);await new Promise(r=>req.on('end',r));
  let data={};try{data=JSON.parse(body||'{}')}catch(e){}
  const auth=req.headers.authorization||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  const user=db.sessions[token]?db.users.find(u=>u.username===db.sessions[token]):null;
  const send=(o,code=200)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(o));};
  const needUser=()=>{if(!user){send({error:'请先登录'},401);return true;}return false;};
  const p=url.pathname,m=req.method;

  if(m==='POST'&&p==='/api/register'){
    const {username,password}=data;
    if(!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/.test(username||''))return send({error:'用户名需 2-16 位中英文/数字/下划线'},400);
    if(!password||password.length<6)return send({error:'密码至少 6 位'},400);
    if(db.users.some(u=>u.username===username))return send({error:'用户名已被占用'},409);
    const u={username,password:hash(password),coins:100,rep:0};
    db.users.push(u);
    const t=crypto.randomBytes(16).toString('hex');db.sessions[t]=username;save();
    return send({token:t,user:pub(u)});
  }
  if(m==='POST'&&p==='/api/login'){
    const u=db.users.find(x=>x.username===data.username);
    if(!u||!verify(data.password||'',u.password))return send({error:'用户名或密码错误'},401);
    const t=crypto.randomBytes(16).toString('hex');db.sessions[t]=u.username;save();
    return send({token:t,user:pub(u)});
  }
  if(m==='GET'&&p==='/api/me'){if(needUser())return;send({user:pub(user)});}
  else if(m==='GET'&&p==='/api/quests'){send({quests:[...db.quests].sort((a,b)=>b.createdAt-a.createdAt)});}
  else if(m==='POST'&&p==='/api/quests'){
    if(needUser())return;
    const {title,cat,reward,time,place,desc}=data;
    if(!title||!title.trim())return send({error:'请填写任务标题'},400);
    const r=parseInt(reward);
    if(!(r>=1&&r<=500))return send({error:'金币需在 1~500 之间'},400);
    if(r>user.coins)return send({error:'金币不足'},400);
    user.coins-=r;user.rep+=1;
    const q={id:Date.now(),title:title.trim(),cat:cat||'其他',reward:r,diff:r>80?3:(r>30?2:1),
      time:time||'协商确定',place:place||'校内',desc:(desc||'').trim()||'（无补充说明）',
      status:'open',publisher:user.username,acceptor:null,proof:null,createdAt:Date.now()};
    db.quests.push(q);save();
    send({quest:q,user:pub(user)});
  }
  else if(m==='POST'&&/^\/api\/quests\/\d+\/accept$/.test(p)){
    if(needUser())return;
    const q=db.quests.find(x=>x.id==p.match(/\d+/)[0]);
    if(!q)return send({error:'任务不存在'},404);
    if(q.status!=='open')return send({error:'任务已被接取'},409);
    if(q.publisher===user.username)return send({error:'不能接取自己的任务'},400);
    q.status='accepted';q.acceptor=user.username;save();send({quest:q});
  }
  else if(m==='POST'&&/^\/api\/quests\/\d+\/submit$/.test(p)){
    if(needUser())return;
    const q=db.quests.find(x=>x.id==p.match(/\d+/)[0]);
    if(!q)return send({error:'任务不存在'},404);
    if(q.acceptor!==user.username)return send({error:'只有接取者可提交凭证'},403);
    if(q.status!=='accepted')return send({error:'当前状态不可交付'},409);
    if(!data.proof||!data.proof.trim())return send({error:'请填写交付说明'},400);
    q.proof=data.proof.trim();q.status='submitted';save();send({quest:q});
  }
  else if(m==='POST'&&/^\/api\/quests\/\d+\/confirm$/.test(p)){
    if(needUser())return;
    const q=db.quests.find(x=>x.id==p.match(/\d+/)[0]);
    if(!q)return send({error:'任务不存在'},404);
    if(q.publisher!==user.username)return send({error:'只有发布者可确认结算'},403);
    if(q.status!=='submitted')return send({error:'对方尚未交付凭证'},409);
    const acc=db.users.find(u=>u.username===q.acceptor);
    if(acc){acc.coins+=q.reward;acc.rep+=2;}
    user.rep+=1;
    q.status='done';save();send({quest:q,user:pub(user)});
  }
  else if(m==='GET'&&p==='/api/rank'){
    send({ranks:[...db.users].sort((a,b)=>b.rep*50+b.coins-(a.rep*50+a.coins)).slice(0,5)
      .map(u=>({name:u.username,pt:u.rep*50+u.coins}))});
  }
  else send({error:'Not Found'},404);
});
server.listen(PORT,()=>console.log('✔ campus-quest API @ http://localhost:'+PORT));
