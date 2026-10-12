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
function pub(u){return {username:u.username,coins:u.coins,rep:u.rep,lv:Math.floor(u.rep/5)+1,school:u.school||'默认学院',cert:!!u.cert,inventory:(u.inventory||[]).map(i=>({id:i.id,name:i.name,icon:i.icon,ts:i.ts}))};}
function seed(){
  db.users.push({username:'快递侠',password:hash('123456'),coins:500,rep:30,school:'东山校区'});
  db.users.push({username:'高数之神',password:hash('123456'),coins:800,rep:45,school:'西山校区'});
  db.shop=[
    {id:1,name:'悬赏加急券',icon:'⚡',desc:'为你的悬赏加上闪电标识，吸引更多猎人。',price:30,stock:999},
    {id:2,name:'改名卡',icon:'✏️',desc:'修改你的猎人代号（联系站长执行）。',price:100,stock:999},
    {id:3,name:'双倍金币卡',icon:'🍀',desc:'24 小时内完成的任务奖励翻倍。',price:60,stock:999},
    {id:4,name:'神秘盲盒',icon:'🎁',desc:'随机开出 10~99 金币，非酋慎入。',price:30,stock:999},
    {id:5,name:'赏金猎人之证',icon:'📜',desc:'持证者可自由创建小社区（每人限购一次）。',price:80,stock:999}];
  db.listings=[];
  db.quests.push({id:6,title:'【跨区】收一本《操作系统》教材',cat:'悬赏',reward:40,diff:1,time:'下周三前',place:'任意校区门口',desc:'版本不限，能看就行。',status:'open',publisher:'高数之神',acceptor:null,proof:null,scope:'world',school:null,createdAt:Date.now()-3000e3});
  db.quests.push({id:1,title:'代取菜鸟驿站快递 3 件',cat:'代取',reward:15,diff:1,time:'今天 18:00 前',place:'宿舍区 7 栋',desc:'大件需小推车，报手机尾号 8848。',status:'open',publisher:'快递侠',acceptor:null,proof:null,scope:'camp',school:'东山校区',createdAt:Date.now()-3600e3});
  db.quests.push({id:2,title:'高数期中押题讲解 2 小时',cat:'辅导',reward:120,diff:3,time:'本周六下午',place:'图书馆 3F',desc:'微分方程与级数，求大佬带飞。',status:'open',publisher:'快递侠',acceptor:null,proof:null,scope:'camp',school:'东山校区',createdAt:Date.now()-7200e3});
  db.quests.push({id:3,title:'帮忙占周五早八前排 ×2',cat:'跑腿',reward:10,diff:1,time:'周五 07:40',place:'教学楼 A301',desc:'放两本书即可，靠谱的来。',status:'open',publisher:'高数之神',acceptor:null,proof:null,scope:'camp',school:'西山校区',createdAt:Date.now()-9000e3});
}
loadDB();
db.users.forEach(u=>{if(!u.school)u.school='默认学院';});
let _mig=false;
db.quests.forEach(q=>{if(!q.scope){q.scope='camp';_mig=true;}if(!q.school){const pu=db.users.find(u=>u.username===q.publisher);q.school=pu?pu.school:'默认学院';_mig=true;}});
db.users.forEach(u=>{if(!u.inventory){u.inventory=[];_mig=true;}});
db.users.forEach(u=>{(u.inventory||[]).forEach(i=>{if(i.id===undefined){const it=(db.shop||[]).find(x=>x.name===i.name);i.id=it?it.id:0;_mig=true;}});});
if(!db.shop){db.shop=[
  {id:1,name:'悬赏加急券',icon:'⚡',desc:'为你的悬赏加上闪电标识，吸引更多猎人。',price:30,stock:999},
  {id:2,name:'改名卡',icon:'✏️',desc:'修改你的猎人代号（联系站长执行）。',price:100,stock:999},
  {id:3,name:'双倍金币卡',icon:'🍀',desc:'24 小时内完成的任务奖励翻倍。',price:60,stock:999},
  {id:4,name:'神秘盲盒',icon:'🎁',desc:'随机开出 10~99 金币，非酋慎入。',price:30,stock:999}];_mig=true;}
if(!db.listings){db.listings=[];_mig=true;}
db.users.forEach(u=>{if(u.cert===undefined){u.cert=false;_mig=true;}});
if(db.shop&&!db.shop.some(x=>x.id===5)){db.shop.push({id:5,name:'赏金猎人之证',icon:'📜',desc:'持证者可自由创建小社区（每人限购一次）。',price:80,stock:999});_mig=true;}
if(!db.communities){db.communities=[{id:1,name:'深夜食堂研究会',creator:'官方',members:['快递侠'],createdAt:Date.now()},{id:2,name:'考研互助会',creator:'高数之神',members:['高数之神'],createdAt:Date.now()}];_mig=true;}
if(!db.communityApps){db.communityApps=[];_mig=true;}
if(!db.appVotes){db.appVotes=[];_mig=true;}
if(!db.appDraws){db.appDraws={};_mig=true;}
if(!db.messages){db.messages=[
  {id:1,channel:'world',user:'快递侠',school:'东山校区',text:'欢迎来到大世界社区，文明交流～',ts:Date.now()-3600e3},
  {id:2,channel:'world',user:'高数之神',school:'西山校区',text:'今晚八点答疑，图书馆见。',ts:Date.now()-1800e3}];_mig=true;}
if(_mig)save();

const lastPost={};
const KIMI_KEY=process.env.KIMI_API_KEY||process.env.MOONSHOT_API_KEY||'';
const KIMI_MODEL=process.env.KIMI_MODEL||'kimi-k2-0905-preview';
const SAMPLE_CODES={
vote:`import { useState } from "react";

export default function App() {
  const options = ["支持", "反对", "弃权"];
  const [mine, setMine] = useState(null);
  const [count, setCount] = useState([3, 1, 2]);
  const total = count.reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16, color: "#eee", background: "#1a1a2b", minHeight: 280 }}>
      <h3 style={{ margin: "0 0 12px" }}>__TITLE__</h3>
      {options.map((o, i) => {
        const pct = Math.round((count[i] / total) * 100);
        return (
          <div key={o} onClick={() => { if (mine === null) { const c = [...count]; c[i]++; setCount(c); setMine(i); } }}
            style={{ margin: "8px 0", cursor: mine === null ? "pointer" : "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{o}{mine === i ? " ✔" : ""}</span><span>{count[i]} 票 · {pct}%</span>
            </div>
            <div style={{ height: 10, background: "#333", borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: pct + "%", background: "#4fd8ff", transition: "width .3s" }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>{mine === null ? "点击选项投票（每人一票）" : "已投票，感谢参与"}</div>
    </div>
  );
}`,
fortune:`import { useState } from "react";

const LOTS = [
  ["大吉", "鸿运当头，宜接大悬赏"], ["中吉", "稳中有升，适合泡图书馆"],
  ["小吉", "灵感迸发，写代码一把过"], ["平", "普通的一天，但食堂有新菜"],
  ["小凶", "易迟到，定三个闹钟"], ["凶", "宜宅，忌帮室友带饭"]
];
export default function App() {
  const [lot, setLot] = useState(null);
  const [shaking, setShaking] = useState(false);
  const draw = () => {
    setShaking(true);
    setTimeout(() => { setLot(LOTS[Math.floor(Math.random() * LOTS.length)]); setShaking(false); }, 600);
  };
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16, color: "#eee", background: "#1a1a2b", minHeight: 280, textAlign: "center" }}>
      <h3 style={{ margin: "0 0 16px" }}>__TITLE__</h3>
      {lot ? (
        <div style={{ border: "2px dashed #ffd23f", borderRadius: 8, padding: "20px 10px" }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#ffd23f" }}>{lot[0]}</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>{lot[1]}</div>
        </div>
      ) : (
        <div style={{ color: "#888", padding: "30px 0" }}>今日运势，一签可知</div>
      )}
      <button onClick={draw} disabled={shaking}
        style={{ marginTop: 16, padding: "10px 28px", fontSize: 15, cursor: "pointer",
          background: shaking ? "#555" : "#c8503e", color: "#fff", border: "none", borderRadius: 20 }}>
        {shaking ? "摇签中…" : "🎋 抽一签"}
      </button>
    </div>
  );
}`,
todo:`import { useState } from "react";

export default function App() {
  const [list, setList] = useState([{ t: "试试添加一条待办", done: false }]);
  const [text, setText] = useState("");
  const add = () => { if (!text.trim()) return; setList([...list, { t: text.trim(), done: false }]); setText(""); };
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16, color: "#eee", background: "#1a1a2b", minHeight: 280 }}>
      <h3 style={{ margin: "0 0 12px" }}>__TITLE__</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder="要做点什么？" style={{ flex: 1, padding: 8, background: "#333", border: "none", color: "#eee", borderRadius: 4 }} />
        <button onClick={add} style={{ padding: "8px 14px", cursor: "pointer" }}>添加</button>
      </div>
      {list.map((it, i) => (
        <div key={i} onClick={() => { const l = [...list]; l[i].done = !l[i].done; setList(l); }}
          style={{ padding: "8px 4px", cursor: "pointer", textDecoration: it.done ? "line-through" : "none", color: it.done ? "#777" : "#eee", borderBottom: "1px solid #333" }}>
          {it.done ? "☑" : "☐"} {it.t}
        </div>
      ))}
    </div>
  );
}`,
counter:`import { useState } from "react";

export default function App() {
  const [n, setN] = useState(0);
  const [hist, setHist] = useState([]);
  const roll = () => { const r = 1 + Math.floor(Math.random() * 100); setN(r); setHist([r, ...hist].slice(0, 8)); };
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16, color: "#eee", background: "#1a1a2b", minHeight: 280, textAlign: "center" }}>
      <h3 style={{ margin: "0 0 16px" }}>__TITLE__</h3>
      <div style={{ fontSize: 64, fontWeight: "bold", color: "#4fd8ff", minHeight: 80 }}>{n || "–"}</div>
      <button onClick={roll} style={{ padding: "10px 28px", fontSize: 15, cursor: "pointer" }}>🎲 来一个随机数</button>
      <div style={{ marginTop: 14, color: "#888", fontSize: 12 }}>历史：{hist.join("、") || "暂无"}</div>
    </div>
  );
}`};
function pickSample(kind, title) {
  const code = SAMPLE_CODES[kind];
  if (!code) return null;
  const t = (title || "社区小工具").slice(0, 15);
  return { type: kind, title: t, code: code.split("__TITLE__").join(t) };
}
function parseToolJson(txt) {
  if (!txt) return null;
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const title = String(j.title || "社区小工具").slice(0, 30);
    const code = String(j.code || "");
    if (code.length < 50 || code.length > 20000) return null;
    if (!/export\s+default/.test(code)) return null;
    return { type: String(j.type || "tool").slice(0, 20), title: title, code: code };
  } catch (e) { return null; }
}
let lastKimiErr = null;
async function genByKimi(prompt) {
  if (!KIMI_KEY) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000000);
    const r = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KIMI_KEY },
      body: JSON.stringify({
        model: KIMI_MODEL, temperature: 1, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是"AI工坊"的代码生成器。用户用自然语言描述想要的任意小工具，你输出一个 JSON 对象（不要输出任何其他文字）：{"type":"简短英文标识","title":"工具名称（中文，不超过15字）","code":"完整的 React 函数组件源码"}。对 code 的要求：1) 一个默认导出（export default）的 React 函数组件；2) 可使用 import { useState, useEffect } from "react" 等 Hook；3) 样式全部用内联 style，深色背景 #1a1a2b 配浅色文字；4) 不引用任何外部库、图片 URL 或本地文件；5) 单文件、可直接编译运行，尽量不超过 120 行；6) 组件要有完整的交互闭环。用户输入：' },
          { role: 'user', content: String(prompt || '').slice(0, 300) }
        ]
      })
    });
    clearTimeout(timer);
    if (!r.ok) {
      lastKimiErr = 'HTTP ' + r.status;
      try { const b = await r.json(); lastKimiErr += ' ' + JSON.stringify(b.error || b).slice(0, 120); } catch (e) {}
      return null;
    }
    const d = await r.json();
    const txt = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
    if (!parseToolJson(txt)) lastKimiErr = '模型返回无法解析';
    else lastKimiErr = null;
    return parseToolJson(txt);
  } catch (e) { lastKimiErr = String(e && e.message || e).slice(0, 120); return null; }
}
function genLocalApp(prompt) {
  const t = String(prompt || '');
  let title = t.replace(/^(帮我|我要|我想|我想要|请|创建|生成|做一个|做个|做|来一个|来|一个)+/, '')
    .replace(/投票|抽签|求签|占卜|待办|清单|打卡|计分|计数|随机|打分|小工具|工具/g, '')
    .replace(/[:：，,。\s]+$/, '').replace(/^[:：，,。\s]+/, '').trim().slice(0, 15);
  if (/投票|票选|表决/.test(t)) return pickSample('vote', title || '社区投票');
  if (/抽签|运势|求签|占卜/.test(t)) return pickSample('fortune', title || '今日运势');
  if (/待办|清单|打卡|todo/i.test(t)) return pickSample('todo', title || '待办清单');
  if (/计分|计数|随机|打分|数字/.test(t)) return pickSample('counter', title || '随机数发生器');
  return null;
}
const FORTUNES=[
  {lv:'大吉',text:'鸿运当头，宜接大悬赏，忌翘课'},
  {lv:'大吉',text:'贵人相助，今天丢的东西都能找回来'},
  {lv:'中吉',text:'稳扎稳打，适合泡图书馆'},
  {lv:'中吉',text:'有小财进账，去商店抽个盲盒吧'},
  {lv:'中吉',text:'桃花运将至，食堂拼桌注意形象'},
  {lv:'小吉',text:'平安顺遂，适合完成拖延已久的任务'},
  {lv:'小吉',text:'灵感迸发，写代码一把过'},
  {lv:'平',text:'无惊无喜，适合睡到自然醒'},
  {lv:'平',text:'宜观望，抢课建议设好闹钟'},
  {lv:'平',text:'普通的一天，但食堂有新菜'},
  {lv:'小凶',text:'易迟到，定三个闹钟'},
  {lv:'小凶',text:'小心忘带校园卡'},
  {lv:'凶',text:'宜宅，忌帮室友带饭'}];
function genAppFromPrompt(p){
  const t=(p||'').trim();
  if(/投票|票选|表决/.test(t)){
    let title=t,options=[];
    const om=t.match(/选项[:：](.+)$/);
    if(om){options=om[1].split(/[、,，\/\s]+/).filter(Boolean).slice(0,8);title=t.slice(0,om.index);}
    title=title.replace(/^(帮我|我要|我想|我想要|请|创建|生成|做一个|做个|做|来一个|来|一个)+/,'')
      .replace(/投票|票选|表决/g,'').replace(/[:：，,。\s]+$/,'').replace(/^[:：，,。\s]+/,'').trim();
    if(!options.length){
      const rest=title.split(/\s+/);
      if(rest.length>1){title=rest[0];options=rest.slice(1,9);}
      else options=['支持','反对'];
    }
    if(!title)title='社区投票';
    return {type:'vote',title:title.slice(0,20),options:options.map(o=>o.slice(0,12))};
  }
  if(/抽签|运势|求签|占卜|运气/.test(t)){
    let title=t.replace(/^(帮我|我要|我想|请|创建|生成|做一个|做个|做|来一个|来|一个)+/,'')
      .replace(/抽签|运势|求签|占卜|看/g,'').replace(/[:：，,。\s]+$/,'').replace(/^[:：，,。\s]+/,'').trim().slice(0,20);
    return {type:'fortune',title:title||'今日运势'};
  }
  return null;
}
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
    const SCHOOLS=['东山校区','西山校区','南湖校区','北湖校区'];
    if(!SCHOOLS.includes(data.school))return send({error:'请选择校区阵营'},400);
    if(db.users.some(u=>u.username===username))return send({error:'用户名已被占用'},409);
    const u={username,password:hash(password),coins:100,rep:0,school:data.school,inventory:[],cert:false};
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
  else if(m==='GET'&&p==='/api/quests'){
    const un=user?user.username:null;
    const vs=user?user.school:null;
    send({quests:[...db.quests].sort((a,b)=>b.createdAt-a.createdAt)
      .filter(q=>q.scope==='world'||(vs&&q.school===vs))
      .map(q=>(q.publisher===un||q.acceptor===un)?q:{...q,proof:null})});
  }
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
      status:'open',publisher:user.username,acceptor:null,proof:null,
      scope:data.scope==='world'?'world':'camp',school:user.school,createdAt:Date.now()};
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
    const pf=data.proof||{};
    const text=(pf.text||'').trim();
    const img=pf.img||null;
    if(!text&&!img)return send({error:'请填写交付说明或上传图片'},400);
    if(img&&img.length>3500000)return send({error:'图片过大，请压缩后再试'},400);
    q.proof={text:text,img:img};q.status='submitted';save();send({quest:q});
  }
  else if(m==='POST'&&/^\/api\/quests\/\d+\/cancel$/.test(p)){
    if(needUser())return;
    const q=db.quests.find(x=>x.id==p.match(/\d+/)[0]);
    if(!q)return send({error:'任务不存在'},404);
    if(q.acceptor!==user.username)return send({error:'只有接取者可以取消'},403);
    if(q.status!=='accepted')return send({error:'当前状态不可取消（已交付请联系发布者驳回）'},409);
    q.status='open';q.acceptor=null;q.proof=null;save();send({quest:q});
  }
  else if(m==='POST'&&/^\/api\/quests\/\d+\/confirm$/.test(p)){
    if(needUser())return;
    const q=db.quests.find(x=>x.id==p.match(/\d+/)[0]);
    if(!q)return send({error:'任务不存在'},404);
    if(q.publisher!==user.username)return send({error:'只有发布者可确认结算'},403);
    if(q.status!=='submitted')return send({error:'对方尚未交付凭证'},409);
    const acc=db.users.find(u=>u.username===q.acceptor);
    if(acc){const mult=(acc.boostUntil&&acc.boostUntil>Date.now())?2:1;acc.coins+=q.reward*mult;acc.rep+=2;}
    user.rep+=1;
    q.status='done';save();send({quest:q,user:pub(user)});
  }
  else if(m==='GET'&&p==='/api/shop/official'){send({items:db.shop});}
  else if(m==='POST'&&p==='/api/shop/buy'){
    if(needUser())return;
    const it=db.shop.find(x=>x.id==data.id);
    if(!it)return send({error:'商品不存在'},404);
    if(it.stock<=0)return send({error:'已售罄'},409);
    if(it.id===5&&user.cert)return send({error:'你已持有赏金猎人之证，无需重复购买'},409);
    if(user.coins<it.price)return send({error:'金币不足'},400);
    user.coins-=it.price;it.stock--;
    let got=null;
    if(it.id===4){const roll=10+Math.floor(Math.random()*90);user.coins+=roll;got='盲盒开出 🪙'+roll+'！';}
    else if(it.id===5){user.cert=true;got='📜 赏金猎人之证已生效，现在可以创建社区了！';}
    else{user.inventory.push({id:it.id,name:it.name,icon:it.icon,ts:Date.now()});got=it.name+' 已放入背包';}
    save();send({user:pub(user),msg:got});
  }
  else if(m==='GET'&&p==='/api/myshop'){
    if(needUser())return;
    const slots=[];
    for(let i=0;i<9;i++){
      const l=db.listings.find(x=>x.seller===user.username&&x.slot===i);
      if(l&&l.qty>0)slots.push({slot:i,listing:{name:l.name,icon:l.icon,desc:l.desc,price:l.price,qty:l.qty,img:l.img||null,vid:l.vid||null},cooldownUntil:0});
      else if(l&&l.soldOutAt){
        const cu=l.soldOutAt+7*24*3600*1000;
        slots.push({slot:i,listing:null,cooldownUntil:cu>Date.now()?cu:0});
      }
      else slots.push({slot:i,listing:null,cooldownUntil:0});
    }
    send({slots:slots});
  }
  else if(m==='POST'&&p==='/api/myshop/list'){
    if(needUser())return;
    const slot=parseInt(data.slot);
    if(!(slot>=0&&slot<=8))return send({error:'窗口编号不合法'},400);
    const name=(data.name||'').trim();
    if(!name||name.length>20)return send({error:'商品名 1-20 字'},400);
    const price=parseInt(data.price);
    if(!(price>=1&&price<=100000))return send({error:'单价不合法'},400);
    const qty=parseInt(data.qty);
    if(!(qty>=1&&qty<=10))return send({error:'单个商品数量不能超过 10 件'},400);
    const old=db.listings.find(x=>x.seller===user.username&&x.slot===slot);
    if(old&&old.qty>0)return send({error:'该窗口已有在售商品'},409);
    if(old&&old.soldOutAt){
      const left=old.soldOutAt+7*24*3600*1000-Date.now();
      if(left>0)return send({error:'该窗口冷却中，剩余 '+Math.ceil(left/86400000)+' 天'},409);
      db.listings.splice(db.listings.indexOf(old),1);
    }
    if(data.img&&data.img.length>3500000)return send({error:'图片过大，请压缩后再试'},400);
    if(data.vid&&data.vid.length>14000000)return send({error:'视频过大，请限制在 10MB 以内'},400);
    db.listings.push({id:Date.now(),seller:user.username,slot:slot,name:name,
      icon:(data.icon||'📦').slice(0,4),desc:(data.desc||'').trim().slice(0,200),
      img:data.img||null,vid:data.vid||null,
      price:price,qty:qty,soldOutAt:null,createdAt:Date.now()});
    save();send({ok:true});
  }
  else if(m==='POST'&&p==='/api/myshop/unlist'){
    if(needUser())return;
    const i=db.listings.findIndex(x=>x.seller===user.username&&x.slot==data.slot&&x.qty>0);
    if(i<0)return send({error:'该窗口没有在售商品'},404);
    db.listings.splice(i,1);save();send({ok:true});
  }
  else if(m==='GET'&&p==='/api/communities'){
    if(needUser())return;
    send({cert:!!user.cert,
      communities:db.communities.map(c=>({id:c.id,name:c.name,creator:c.creator,
        count:c.members.length,mine:c.members.includes(user.username)}))});
  }
  else if(m==='POST'&&p==='/api/communities/create'){
    if(needUser())return;
    if(!user.cert)return send({error:'需要先在官方商店购买「赏金猎人之证」'},403);
    const name=(data.name||'').trim();
    if(!name||name.length>16)return send({error:'社区名 1-16 字'},400);
    if(db.communities.some(c=>c.name===name))return send({error:'社区名已存在'},409);
    const c={id:Date.now(),name:name,creator:user.username,members:[user.username],createdAt:Date.now()};
    db.communities.push(c);save();send({community:c});
  }
  else if(m==='POST'&&p==='/api/communities/join'){
    if(needUser())return;
    const c=db.communities.find(x=>x.id==data.id);
    if(!c)return send({error:'社区不存在'},404);
    if(!c.members.includes(user.username))c.members.push(user.username);
    save();send({ok:true});
  }
  else if(m==='POST'&&p==='/api/communities/leave'){
    if(needUser())return;
    const c=db.communities.find(x=>x.id==data.id);
    if(!c)return send({error:'社区不存在'},404);
    if(c.creator===user.username)return send({error:'创建者不能退出自己的社区'},400);
    c.members=c.members.filter(x=>x!==user.username);save();send({ok:true});
  }
  else if(m==='GET'&&p==='/api/chat'){
    if(needUser())return;
    const c=url.searchParams.get('c')||'world';
    let msgs;
    if(c==='world')msgs=db.messages.filter(x=>x.channel==='world');
    else if(c==='school')msgs=db.messages.filter(x=>x.channel==='school'&&x.school===user.school);
    else{
      const com=db.communities.find(x=>String(x.id)===String(c));
      if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
      msgs=db.messages.filter(x=>x.channel===String(c));
    }
    send({messages:msgs.slice(-50).map(m=>({user:m.user,school:m.school,text:m.text,ts:m.ts,mine:m.user===user.username}))});
  }
  else if(m==='POST'&&p==='/api/chat'){
    if(needUser())return;
    const c=data.c||'world';
    const text=(data.text||'').trim();
    if(!text||text.length>200)return send({error:'内容 1-200 字'},400);
    if(c==='school'){}
    else if(c==='world'){}
    else{
      const com=db.communities.find(x=>String(x.id)===String(c));
      if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
    }
    const now=Date.now();
    if(lastPost[user.username]&&now-lastPost[user.username]<1500)return send({error:'说话太快啦，歇 1.5 秒'},429);
    lastPost[user.username]=now;
    db.messages.push({id:now,channel:String(c),user:user.username,school:user.school,text:text,ts:now});
    if(db.messages.length>2000)db.messages=db.messages.slice(-2000);
    save();send({ok:true});
  }
  else if(m==='POST'&&p==='/api/item/use'){
    if(needUser())return;
    const idx=user.inventory.findIndex(x=>x.id==data.id);
    if(idx<0)return send({error:'背包中没有该道具'},404);
    const item=user.inventory[idx];
    let msg='';
    if(item.id===1){user.rep+=1;msg='⚡ 加急券已使用，信誉 +1，你的悬赏更受关注！';}
    else if(item.id===3){user.boostUntil=Date.now()+24*3600*1000;msg='🍀 双倍金币卡生效：24 小时内任务奖励翻倍！';}
    else if(item.id===2){
      const nn=(data.newName||'').trim();
      if(!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/.test(nn))return send({error:'新代号需 2-16 位中英文/数字/下划线'},400);
      if(db.users.some(u=>u.username===nn))return send({error:'该代号已被占用'},409);
      const oldn=user.username;
      user.username=nn;
      for(const t in db.sessions)if(db.sessions[t]===oldn)db.sessions[t]=nn;
      db.quests.forEach(q=>{if(q.publisher===oldn)q.publisher=nn;if(q.acceptor===oldn)q.acceptor=nn;});
      db.listings.forEach(l=>{if(l.seller===oldn)l.seller=nn;});
      db.communities.forEach(c=>{if(c.creator===oldn)c.creator=nn;c.members=c.members.map(x=>x===oldn?nn:x);});
      db.messages.forEach(mm=>{if(mm.user===oldn)mm.user=nn;});
      msg='✏️ 改名成功，你现在叫 '+nn+'！';
    }
    else return send({error:'该道具无法使用'},400);
    user.inventory.splice(idx,1);
    save();send({user:pub(user),msg:msg});
  }
  else if(m==='POST'&&/^\/api\/communities\/\d+\/apps$/.test(p)){
    if(needUser())return;
    const com=db.communities.find(x=>String(x.id)===p.match(/\d+/)[0]);
    if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
    let spec=await genByKimi(data.prompt||'');
    let engine=spec?'kimi':'local';
    if(!spec)spec=genLocalApp(data.prompt||'');
    if(!spec){
      const hint=KIMI_KEY
        ?('Kimi 调用失败：'+(lastKimiErr||'未知错误')+' —— 请检查密钥是否有效、KIMI_MODEL 型号是否存在；且该描述无内置示例匹配')
        :('未检测到 KIMI_API_KEY 环境变量（注意：设置环境变量后必须重新部署/重启服务才会生效）；该描述也无内置示例匹配');
      return send({error:hint},502);
    }
    const app={id:Date.now(),communityId:String(com.id),creator:user.username,spec:spec,engine:engine,createdAt:Date.now()};
    db.communityApps.push(app);save();send({app:app,engine:engine});
  }
  else if(m==='GET'&&/^\/api\/communities\/\d+\/apps$/.test(p)){
    if(needUser())return;
    const com=db.communities.find(x=>String(x.id)===p.match(/\d+/)[0]);
    if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
    const apps=db.communityApps.filter(a=>a.communityId===String(com.id)).map(a=>{
      if(a.spec.code)return {id:a.id,type:a.spec.type||'tool',title:a.spec.title,code:a.spec.code,engine:a.engine||'local',creator:a.creator,createdAt:a.createdAt};
      if(a.spec.type==='vote'){
        const votes=db.appVotes.filter(v=>v.appId===a.id);
        const tally=a.spec.options.map((_,i)=>votes.filter(v=>v.choice===i).length);
        const mine=votes.find(v=>v.user===user.username);
        return {id:a.id,type:'vote',title:a.spec.title,options:a.spec.options,tally:tally,
          total:votes.length,myVote:mine?mine.choice:-1,creator:a.creator,createdAt:a.createdAt};
      }
      const d=db.appDraws[a.id+':'+user.username];
      const today=d&&new Date(d.ts).toDateString()===new Date().toDateString();
      return {id:a.id,type:'fortune',title:a.spec.title,myDraw:today?d.result:null,creator:a.creator,createdAt:a.createdAt};
    });
    send({apps:apps});
  }
  else if(m==='POST'&&/^\/api\/apps\/\d+\/vote$/.test(p)){
    if(needUser())return;
    const app=db.communityApps.find(x=>String(x.id)===p.match(/\d+/)[0]);
    if(!app||app.spec.type!=='vote')return send({error:'应用不存在'},404);
    const com=db.communities.find(x=>String(x.id)===app.communityId);
    if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
    const ch=parseInt(data.choice);
    if(!(ch>=0&&ch<app.spec.options.length))return send({error:'选项不合法'},400);
    const v=db.appVotes.find(x=>x.appId===app.id&&x.user===user.username);
    if(v)v.choice=ch;else db.appVotes.push({appId:app.id,user:user.username,choice:ch});
    save();send({ok:true});
  }
  else if(m==='POST'&&/^\/api\/apps\/\d+\/draw$/.test(p)){
    if(needUser())return;
    const app=db.communityApps.find(x=>String(x.id)===p.match(/\d+/)[0]);
    if(!app||app.spec.type!=='fortune')return send({error:'应用不存在'},404);
    const com=db.communities.find(x=>String(x.id)===app.communityId);
    if(!com||!com.members.includes(user.username))return send({error:'你还未加入该社区'},403);
    const key=app.id+':'+user.username;
    const old=db.appDraws[key];
    if(old&&new Date(old.ts).toDateString()===new Date().toDateString())
      return send({result:old.result,repeat:true});
    const result=FORTUNES[Math.floor(Math.random()*FORTUNES.length)];
    db.appDraws[key]={result:result,ts:Date.now()};save();send({result:result,repeat:false});
  }
  else if(m==='GET'&&p==='/api/ai-status'){
    if(needUser())return;
    send({configured:!!KIMI_KEY,model:KIMI_MODEL,lastError:lastKimiErr});
  }
  else if(m==='GET'&&p==='/api/kimi-models'){
    if(needUser())return;
    if(!KIMI_KEY)return send({error:'未配置 KIMI_API_KEY'},400);
    try{
      const r=await fetch('https://api.moonshot.cn/v1/models',{headers:{Authorization:'Bearer '+KIMI_KEY}});
      const d=await r.json();
      if(!r.ok)return send({error:'查询失败：HTTP '+r.status+' '+(d.error&&d.error.message||'')},502);
      send({models:(d.data||[]).map(x=>x.id)});
    }catch(e){send({error:'查询失败：'+String(e&&e.message||e).slice(0,100)},502);}
  }
  else if(m==='GET'&&p==='/api/rank'){
    send({ranks:[...db.users].sort((a,b)=>b.rep*50+b.coins-(a.rep*50+a.coins)).slice(0,5)
      .map(u=>({name:u.username,pt:u.rep*50+u.coins}))});
  }
  else send({error:'Not Found'},404);
});
server.listen(PORT,()=>console.log('✔ campus-quest API @ http://localhost:'+PORT));
