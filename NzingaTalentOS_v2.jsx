import { useState, useEffect, useRef } from "react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const USERS = [
  { id:"u1", name:"Jordan Hayes",  initials:"JH", role:"scout",          email:"jordan@nzinga.co",  password:"scout123",    title:"Talent Scout",           color:"#7c3aed" },
  { id:"u2", name:"Marcus Bell",   initials:"MB", role:"team1_lead",     email:"marcus@nzinga.co",  password:"lead123",     title:"Team 1 Lead",            color:"#f59e0b" },
  { id:"u3", name:"Priya Okafor",  initials:"PO", role:"ops_specialist", email:"priya@nzinga.co",   password:"ops123",      title:"Ops Specialist",         color:"#3b82f6" },
  { id:"u4", name:"Devon Cruz",    initials:"DC", role:"team2_lead",     email:"devon@nzinga.co",   password:"lead2123",    title:"Team 2 Lead",            color:"#06b6d4" },
  { id:"u5", name:"Simone Nzinga", initials:"SN", role:"director",       email:"simone@nzinga.co",  password:"director123", title:"Executive Director",     color:"#10b981" },
  { id:"u6", name:"Alexis Grant",  initials:"AG", role:"success_manager",email:"alexis@nzinga.co",  password:"success123",  title:"Success Manager",        color:"#ec4899" },
];

const ROLE_LABELS = { scout:"Scout", team1_lead:"Team 1 Lead", ops_specialist:"Ops Specialist", team2_lead:"Team 2 Lead", director:"Director", success_manager:"Success Manager" };

const STAGES = ["holding_entry","scout_complete","team1_review","ops_processing","team2_audit","executive_review","signed_onboarding","archived","not_viable"];
const STAGE_LABELS = { holding_entry:"Holding Entry", scout_complete:"Scout Complete", team1_review:"Team 1 Review", ops_processing:"Ops Processing", team2_audit:"Team 2 Audit", executive_review:"Executive Review", signed_onboarding:"Signed – Onboarding", archived:"Archived", not_viable:"Not Viable" };
const STAGE_COLORS = { holding_entry:"#7c3aed", scout_complete:"#a855f7", team1_review:"#f59e0b", ops_processing:"#3b82f6", team2_audit:"#06b6d4", executive_review:"#10b981", signed_onboarding:"#22c55e", archived:"#6b7280", not_viable:"#ef4444" };
const PILLAR_NAMES = ["Market Viability","Audience Engagement","Brand Safety","Content Consistency","Monetization Potential"];

const TASKS_SEED = [
  { id:"tk1", title:"Follow up with Zara re: merch collab", assigned_to:"u6", related_talent:"t1", due:"2026-05-25", priority:"high",   status:"open",     created_by:"u5", created_at:"2026-05-19T09:00:00Z", notes:"Discuss Q3 launch timeline." },
  { id:"tk2", title:"Collect W-9 from Mia Torres",          assigned_to:"u3", related_talent:"t3", due:"2026-05-21", priority:"urgent", status:"open",     created_by:"u3", created_at:"2026-05-19T10:00:00Z", notes:"Tax doc still outstanding." },
  { id:"tk3", title:"Review Darius Cole scoring rationale",  assigned_to:"u2", related_talent:"t2", due:"2026-05-22", priority:"medium", status:"open",     created_by:"u2", created_at:"2026-05-18T14:00:00Z", notes:"Check pillar 2 alignment." },
  { id:"tk4", title:"NIL deal outreach – Mia Torres",       assigned_to:"u6", related_talent:"t3", due:"2026-05-28", priority:"medium", status:"open",     created_by:"u5", created_at:"2026-05-19T08:30:00Z", notes:"Target Adidas and GNC." },
  { id:"tk5", title:"Renee Park contract draft review",     assigned_to:"u3", related_talent:"t5", due:"2026-05-20", priority:"urgent", status:"completed", created_by:"u4", created_at:"2026-05-17T09:00:00Z", notes:"Exclusive 18-mo framework done." },
];

const HISTORY_SEED = [
  { id:"h1", talent_id:"t1", user_id:"u6", type:"note",   text:"Spoke with Zara. She's interested in the Q3 merch line. Looping in Keisha.",              ts:"2026-05-18T14:22:00Z", flagged:false },
  { id:"h2", talent_id:"t1", user_id:"u5", type:"call",   text:"Director check-in call. Confirmed onboarding complete. Strong division fit confirmed.",     ts:"2026-05-17T10:05:00Z", flagged:false },
  { id:"h3", talent_id:"t2", user_id:"u2", type:"note",   text:"Pillar 2 engagement score is borderline. Watching trend data. Decision pending.",           ts:"2026-05-18T11:30:00Z", flagged:true  },
  { id:"h4", talent_id:"t3", user_id:"u3", type:"email",  text:"Sent W-9 request to Mia Torres. Awaiting response. Banking info also outstanding.",        ts:"2026-05-18T09:15:00Z", flagged:false },
  { id:"h5", talent_id:"t5", user_id:"u4", type:"note",   text:"All data verified. Scoreboard fields match identity docs. Approved for Director.",          ts:"2026-05-15T10:00:00Z", flagged:false },
  { id:"h6", talent_id:"t4", user_id:"u1", type:"note",   text:"Initial screen: Kai's content is inconsistent. Monitoring 2 more weeks before scoring.",   ts:"2026-05-18T10:02:00Z", flagged:false },
];

const TALENTS_SEED = [
  { id:"t1", name:"Zara Williams",  stage:"signed_onboarding", niches:["Model","Influencer"], scout_id:"u1", created_at:"2026-04-10T09:00:00Z", social_handle:"@zarawilliams",  follower_count:"2.1M", er_pct:"8.2", platform:"Instagram/TikTok", location:"Atlanta, GA",
    pillar_scores:[4,5,4,4,5], pillar_rationales:["Exceptional brand consistency.","Viral ER above 8%.","Zero controversy.","Diverse content — fashion/wellness.","3 active brand deals."],
    jordan_score:4.4, revenue_path:"Sponsored posts ($8k/mo avg), affiliate links. 90-day target: $25k luxury fashion.", scout_summary:"Top-tier digital creator with proven commercial appeal.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:true, banking:true, social_ownership:true },
    rep_type:"Exclusive", commission:"15", term_length:"12 months",
    team2_notes:"", team2_decision:"approved", director_decision:"approved",
    portal_setup:true, technical_routing:true, warm_handoff:"Keisha Morris – Influencer Division", warm_handoff_confirmed:true,
    revenue_ytd:"47200", revenue_projected:"180000",
    audit_log:[
      { user:"Jordan Hayes", role:"Scout",           action:"Created holding record",                         stage:"holding_entry",     ts:"2026-04-10T09:00:00Z" },
      { user:"Jordan Hayes", role:"Scout",           action:"Completed Talent Packet → Scout Complete",      stage:"scout_complete",    ts:"2026-04-11T14:22:00Z" },
      { user:"Marcus Bell",  role:"Team 1 Lead",     action:"Approved for Ops",                              stage:"team1_review",      ts:"2026-04-12T10:05:00Z" },
      { user:"Priya Okafor", role:"Ops Specialist",  action:"Compliance verified → Team 2 Audit",           stage:"ops_processing",    ts:"2026-04-13T16:40:00Z" },
      { user:"Devon Cruz",   role:"Team 2 Lead",     action:"Approved for Director",                        stage:"team2_audit",       ts:"2026-04-14T11:20:00Z" },
      { user:"Simone Nzinga",role:"Director",        action:"Approved – Sign Client",                       stage:"executive_review",  ts:"2026-04-15T09:55:00Z" },
      { user:"Alexis Grant", role:"Success Manager", action:"Warm hand-off confirmed",                      stage:"signed_onboarding", ts:"2026-04-16T13:30:00Z" },
    ]},
  { id:"t2", name:"Darius Cole",   stage:"team1_review",  niches:["Actor","Model"],         scout_id:"u1", created_at:"2026-05-01T11:00:00Z", social_handle:"@dariuscole",    follower_count:"890K",  er_pct:"3.1", platform:"Instagram/YouTube", location:"Los Angeles, CA",
    pillar_scores:[4,3,4,4,4], pillar_rationales:["SAG eligible, strong theatrical training.","ER slightly low but improving.","Clean professional image.","Niche appeal in drama/indie.","Two paid commercials this year."],
    jordan_score:3.8, revenue_path:"Commercials ($3k/mo), print work referrals. 90-day: Backstage pro + 2 bookings.", scout_summary:"Disciplined actor with real screen presence. Pillar 2 borderline.",
    team1_notes:"", team1_decision:null, compliance:{}, rep_type:"", commission:"", term_length:"", team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false, revenue_ytd:"0", revenue_projected:"36000",
    audit_log:[
      { user:"Jordan Hayes", role:"Scout", action:"Created holding record",                    stage:"holding_entry",  ts:"2026-05-01T11:00:00Z" },
      { user:"Jordan Hayes", role:"Scout", action:"Completed Talent Packet → Scout Complete", stage:"scout_complete", ts:"2026-05-02T15:10:00Z" },
    ]},
  { id:"t3", name:"Mia Torres",    stage:"ops_processing",niches:["Athlete","Influencer"],  scout_id:"u1", created_at:"2026-04-20T08:30:00Z", social_handle:"@miatorres_fit",  follower_count:"1.4M",  er_pct:"6.8", platform:"Instagram/YouTube", location:"Houston, TX",
    pillar_scores:[5,4,4,4,4], pillar_rationales:["D1 track athlete, 3 national titles.","High engagement fitness content.","Zero brand risk.","Consistent posting schedule.","NIL deals active – $12k YTD."],
    jordan_score:4.2, revenue_path:"NIL deals, fitness sponsorships, supplement brand. 90-day: Adidas NIL + supplement activation.", scout_summary:"Elite D1 athlete, exceptional NIL positioning. Ready for full commercial activation.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:false, banking:false, social_ownership:true },
    rep_type:"Exclusive", commission:"20", term_length:"24 months", team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false, revenue_ytd:"12000", revenue_projected:"95000",
    audit_log:[
      { user:"Jordan Hayes", role:"Scout",       action:"Created holding record",                    stage:"holding_entry",  ts:"2026-04-20T08:30:00Z" },
      { user:"Jordan Hayes", role:"Scout",       action:"Completed Talent Packet → Scout Complete", stage:"scout_complete", ts:"2026-04-21T09:45:00Z" },
      { user:"Marcus Bell",  role:"Team 1 Lead", action:"Approved for Ops",                         stage:"team1_review",   ts:"2026-04-22T14:00:00Z" },
    ]},
  { id:"t4", name:"Kai Johnson",   stage:"holding_entry", niches:[],                       scout_id:"u1", created_at:"2026-05-18T10:00:00Z", social_handle:"@kaij_music",    follower_count:"320K",  er_pct:"2.1", platform:"TikTok/Instagram",  location:"Chicago, IL",
    pillar_scores:[0,0,0,0,0], pillar_rationales:["","","","",""], jordan_score:0, revenue_path:"", scout_summary:"",
    team1_notes:"", team1_decision:null, compliance:{}, rep_type:"", commission:"", term_length:"", team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false, revenue_ytd:"0", revenue_projected:"0",
    audit_log:[{ user:"Jordan Hayes", role:"Scout", action:"Created holding record", stage:"holding_entry", ts:"2026-05-18T10:00:00Z" }]},
  { id:"t5", name:"Renee Park",    stage:"executive_review", niches:["Actor","Influencer"], scout_id:"u1", created_at:"2026-04-05T07:20:00Z", social_handle:"@reneepark",     follower_count:"3.8M",  er_pct:"12.0", platform:"Instagram/YouTube/TikTok", location:"New York, NY",
    pillar_scores:[5,5,5,4,5], pillar_rationales:["Series regular on streaming platform.","Top-tier ER at 12%.","Spotless public record, brand-safe.","Strong cross-platform strategy.","$40k/mo brand revenue."],
    jordan_score:4.8, revenue_path:"Series fees, brand integrations, merch line Q3. 90-day target: $150k.", scout_summary:"Strongest pipeline candidate this quarter. Exceptional across all pillars.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:true, banking:true, social_ownership:true },
    rep_type:"Exclusive", commission:"15", term_length:"18 months", team2_notes:"", team2_decision:"approved", director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false, revenue_ytd:"120000", revenue_projected:"480000",
    audit_log:[
      { user:"Jordan Hayes", role:"Scout",       action:"Created holding record",                    stage:"holding_entry",  ts:"2026-04-05T07:20:00Z" },
      { user:"Jordan Hayes", role:"Scout",       action:"Completed Talent Packet → Scout Complete", stage:"scout_complete", ts:"2026-04-06T11:00:00Z" },
      { user:"Marcus Bell",  role:"Team 1 Lead", action:"Approved for Ops",                         stage:"team1_review",   ts:"2026-04-07T09:30:00Z" },
      { user:"Priya Okafor", role:"Ops Specialist", action:"Compliance verified → Team 2 Audit",   stage:"ops_processing", ts:"2026-04-08T14:15:00Z" },
      { user:"Devon Cruz",   role:"Team 2 Lead", action:"Approved for Director",                    stage:"team2_audit",    ts:"2026-04-09T10:00:00Z" },
    ]},
];

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const C = {
  bg0:"#0a0a0a", bg1:"#111111", bg2:"#181818", bg3:"#1e1e1e", bg4:"#252525",
  border:"#2a2a2a", border2:"#333",
  txt1:"#f1f1f1", txt2:"#b0b0b0", txt3:"#707070", txt4:"#505050",
  purple:"#a855f7", purpleD:"#7c3aed", purpleGlow:"rgba(168,85,247,0.12)",
  green:"#22c55e", greenD:"#16a34a",
  amber:"#f59e0b", red:"#ef4444", blue:"#3b82f6", cyan:"#06b6d4", pink:"#ec4899",
};

const css = (obj) => obj;

const base = {
  fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
  fontSize:"12.5px",
  color:C.txt1,
  background:C.bg0,
  lineHeight:"1.5",
};

function Avatar({ user, size=28 }) {
  if (!user) return null;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:user.color+"33", border:`1px solid ${user.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38+"px", fontWeight:700, color:user.color, flexShrink:0 }}>
      {user.initials}
    </div>
  );
}

function StageBadge({ stage, small }) {
  const c = STAGE_COLORS[stage]||"#888";
  return <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding: small?"1px 6px":"2px 9px", borderRadius:"10px", fontSize: small?"10px":"11px", fontWeight:500, color:c, background:c+"1a", border:`1px solid ${c}33`, whiteSpace:"nowrap" }}>
    <span style={{ width:5, height:5, borderRadius:"50%", background:c, display:"inline-block" }} />
    {STAGE_LABELS[stage]||stage}
  </span>;
}

function NichePill({ n }) {
  const colors = { Model:"#a855f7", Actor:"#3b82f6", Influencer:"#10b981", Athlete:"#f59e0b" };
  const c = colors[n]||"#888";
  return <span style={{ background:c+"1a", color:c, border:`1px solid ${c}33`, borderRadius:"10px", padding:"1px 7px", fontSize:"11px", marginRight:3 }}>{n}</span>;
}

function ScoreBar({ score }) {
  const c = score>=3.5?C.green:score>=3?C.amber:C.red;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ flex:1, height:5, background:C.bg4, borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:(score/5*100)+"%", height:"100%", background:c, borderRadius:3 }} />
      </div>
      <span style={{ fontSize:"11px", fontWeight:600, color:c, minWidth:24, textAlign:"right" }}>{score.toFixed(1)}</span>
    </div>
  );
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!on)} style={{ width:36, height:20, borderRadius:10, background:on?C.purpleD:C.bg4, border:`1px solid ${on?C.purpleD:C.border2}`, position:"relative", cursor:disabled?"default":"pointer", transition:"background 0.15s", flexShrink:0, opacity:disabled?0.5:1 }}>
      <div style={{ width:14, height:14, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:on?19:3, transition:"left 0.12s" }} />
    </div>
  );
}

function Btn({ children, variant="ghost", onClick, disabled, full, small }) {
  const variants = {
    primary: { background:C.purpleD,   color:"#fff", border:`1px solid ${C.purpleD}` },
    success: { background:"#14532d",   color:C.green, border:`1px solid ${C.greenD}` },
    danger:  { background:"#450a0a",   color:C.red,   border:`1px solid ${C.red}44` },
    warning: { background:"#451a03",   color:C.amber, border:`1px solid ${C.amber}44` },
    info:    { background:"#0c2a4a",   color:C.blue,  border:`1px solid ${C.blue}44` },
    ghost:   { background:"transparent", color:C.txt2, border:`1px solid ${C.border2}` },
    purple:  { background:C.purpleGlow, color:C.purple, border:`1px solid ${C.purpleD}55` },
  };
  const v = variants[variant]||variants.ghost;
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...v, padding: small?"3px 10px":"5px 13px", borderRadius:6, cursor:disabled?"not-allowed":"pointer", fontSize: small?"11px":"12px", fontWeight:500, whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:5, opacity:disabled?0.5:1, width:full?"100%":undefined, justifyContent:full?"center":undefined, transition:"opacity 0.1s" }}>
      {children}
    </button>
  );
}

function Card({ children, style, accent }) {
  return <div style={{ background:C.bg2, border:`1px solid ${accent||C.border}`, borderRadius:8, padding:"13px 15px", marginBottom:10, ...style }}>{children}</div>;
}

function CardTitle({ children }) {
  return <div style={{ fontSize:"10px", color:C.txt3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text", style }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:5, color:C.txt1, padding:"5px 9px", fontSize:"12px", width:"100%", boxSizing:"border-box", outline:"none", ...style }} />;
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:5, color:C.txt1, padding:"6px 9px", fontSize:"12px", width:"100%", boxSizing:"border-box", outline:"none", resize:"vertical", fontFamily:"inherit" }} />;
}

function Select({ value, onChange, options, style }) {
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:5, color:C.txt1, padding:"5px 9px", fontSize:"12px", outline:"none", ...style }}>
    {options.map(o => typeof o==="string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>;
}

const TH = ({ children }) => <th style={{ padding:"6px 10px", borderBottom:`1px solid ${C.border}`, color:C.txt3, fontWeight:500, textAlign:"left", fontSize:"11px", whiteSpace:"nowrap", background:C.bg2 }}>{children}</th>;
const TD = ({ children, muted, style }) => <td style={{ padding:"7px 10px", borderBottom:`1px solid ${C.bg3}`, color:muted?C.txt3:C.txt2, verticalAlign:"middle", fontSize:"12px", ...style }}>{children}</td>;

function PriorityBadge({ p }) {
  const map = { urgent:C.red, high:C.amber, medium:C.blue, low:C.txt3 };
  const c = map[p]||C.txt3;
  return <span style={{ color:c, fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{p}</span>;
}

function HistoryTypeIcon({ type }) {
  const icons = { note:"✎", call:"✆", email:"✉", task:"☑" };
  const colors = { note:C.purple, call:C.green, email:C.blue, task:C.amber };
  return <span style={{ color:colors[type]||C.txt3, fontSize:"13px" }}>{icons[type]||"•"}</span>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  function go() {
    const u=USERS.find(u=>u.email===email&&u.password===pass);
    if(u) onLogin(u); else setErr("Invalid credentials.");
  }
  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg0, alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:360, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12, padding:"32px 28px" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:24, fontWeight:800, color:C.purple, letterSpacing:"0.05em" }}>NZINGA</div>
          <div style={{ fontSize:10, color:C.txt4, letterSpacing:"0.18em", textTransform:"uppercase", marginTop:2 }}>Talent Operating System</div>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:C.txt3, marginBottom:4 }}>Email Address</div>
          <Input value={email} onChange={setEmail} placeholder="you@nzinga.co" onKeyDown={e=>e.key==="Enter"&&go()} />
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.txt3, marginBottom:4 }}>Password</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{ background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:5, color:C.txt1, padding:"5px 9px", fontSize:"12px", width:"100%", boxSizing:"border-box", outline:"none" }} />
        </div>
        {err && <div style={{ color:C.red, fontSize:"11px", marginBottom:10 }}>{err}</div>}
        <Btn variant="primary" onClick={go} full>Sign In to Nzinga OS</Btn>
        <div style={{ marginTop:20, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
          <div style={{ fontSize:"10px", color:C.txt4, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>Quick access — demo roles</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
            {USERS.map(u=>(
              <div key={u.id} onClick={()=>{setEmail(u.email);setPass(u.password);}} style={{ background:C.bg3, border:`1px solid ${u.color}33`, borderRadius:6, padding:"5px 8px", cursor:"pointer" }}>
                <div style={{ fontSize:"11px", color:u.color, fontWeight:600 }}>{ROLE_LABELS[u.role]}</div>
                <div style={{ fontSize:"10px", color:C.txt4 }}>{u.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMMAND LAUNCH (search bar) ─────────────────────────────────────────────
function CommandLaunch({ talents, onSelectTalent, onNav }) {
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const ref=useRef();
  const results = q.length>1 ? talents.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())||t.social_handle.toLowerCase().includes(q.toLowerCase())).slice(0,6) : [];
  useEffect(()=>{ function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);} document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h); },[]);
  return (
    <div ref={ref} style={{ position:"relative", flex:1, maxWidth:420 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, background:C.bg3, border:`1px solid ${C.border2}`, borderRadius:7, padding:"4px 10px" }}>
        <span style={{ color:C.txt4, fontSize:13 }}>⌕</span>
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} placeholder="Command launch — search talent, stage, or action…" style={{ background:"transparent", border:"none", outline:"none", color:C.txt1, fontSize:"12px", flex:1 }} />
        {q&&<span onClick={()=>{setQ("");setOpen(false);}} style={{ color:C.txt4, cursor:"pointer", fontSize:13 }}>✕</span>}
      </div>
      {open&&results.length>0&&(
        <div style={{ position:"absolute", top:"calc(100%+4px)", left:0, right:0, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:7, zIndex:200, overflow:"hidden", marginTop:4 }}>
          {results.map(t=>(
            <div key={t.id} onClick={()=>{onSelectTalent(t);setQ("");setOpen(false);}} style={{ padding:"8px 12px", cursor:"pointer", borderBottom:`1px solid ${C.bg3}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <span style={{ color:C.purple, fontWeight:500 }}>{t.name}</span>
                <span style={{ color:C.txt4, fontSize:"11px", marginLeft:6 }}>{t.social_handle}</span>
              </div>
              <StageBadge stage={t.stage} small />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SCOREBOARD (RM12-style at-a-glance strip) ───────────────────────────────
function Scoreboard({ talents }) {
  const active = talents.filter(t=>!["archived","not_viable"].includes(t.stage));
  const signed = talents.filter(t=>t.stage==="signed_onboarding");
  const totalRev = talents.reduce((a,t)=>a+parseFloat(t.revenue_ytd||0),0);
  const avgScore = active.filter(t=>t.jordan_score>0).reduce((a,t,_,arr)=>a+t.jordan_score/arr.length,0)||0;
  const tiles = [
    { label:"Active Pipeline",  value:active.length,                  color:C.purple  },
    { label:"Signed Clients",   value:signed.length,                  color:C.green   },
    { label:"Avg Jordan Score", value:avgScore.toFixed(2),            color:C.amber   },
    { label:"YTD Revenue",      value:"$"+Math.round(totalRev/1000)+"k", color:C.cyan },
    { label:"At Team 1 Review", value:talents.filter(t=>t.stage==="team1_review").length,   color:C.amber  },
    { label:"At Exec Review",   value:talents.filter(t=>t.stage==="executive_review").length, color:C.green },
    { label:"Archived",         value:talents.filter(t=>t.stage==="archived").length,       color:C.txt4  },
  ];
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 20px", background:C.bg1, borderBottom:`1px solid ${C.border}`, overflowX:"auto", flexShrink:0 }}>
      {tiles.map(t=>(
        <div key={t.label} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 14px", minWidth:100, flexShrink:0 }}>
          <div style={{ fontSize:20, fontWeight:700, color:t.color }}>{t.value}</div>
          <div style={{ fontSize:10, color:C.txt4, marginTop:1, whiteSpace:"nowrap" }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD (role-specific tile system) ────────────────────────────────────
function Dashboard({ talents, tasks, history, currentUser, onSelectTalent, onOpenTasks }) {
  const role = currentUser.role;
  const stageMap = { scout:["holding_entry","scout_complete"], team1_lead:["team1_review"], ops_specialist:["ops_processing"], team2_lead:["team2_audit"], director:["executive_review"], success_manager:["signed_onboarding"] };
  const myStages = stageMap[role]||[];
  const myQueue = talents.filter(t=>myStages.includes(t.stage));
  const myTasks = tasks.filter(t=>t.assigned_to===currentUser.id&&t.status==="open");
  const urgentTasks = myTasks.filter(t=>t.priority==="urgent");
  const recentActivity = history.slice(0,5);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
      {/* My Queue tile */}
      <div style={{ gridColumn:"1/-1" }}>
        <Card>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <CardTitle>My Queue — {ROLE_LABELS[role]}</CardTitle>
            <span style={{ background:C.purpleGlow, color:C.purple, borderRadius:10, padding:"1px 8px", fontSize:"11px", fontWeight:600 }}>{myQueue.length} records</span>
          </div>
          {myQueue.length===0 ? (
            <div style={{ color:C.txt4, fontSize:"12px", padding:"12px 0", textAlign:"center" }}>✓ Your queue is clear</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>Score</TH><TH>Followers</TH><TH>ER%</TH><TH>Action</TH></tr></thead>
              <tbody>
                {myQueue.map(t=>(
                  <tr key={t.id} style={{ cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background=C.bg3} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <TD><span style={{ color:C.purple, fontWeight:600 }}>{t.name}</span><div style={{ fontSize:"10px", color:C.txt4 }}>{t.social_handle}</div></TD>
                    <TD><StageBadge stage={t.stage} small /></TD>
                    <TD>{t.niches.map(n=><NichePill key={n} n={n} />)}</TD>
                    <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{color:C.txt4}}>—</span>}</TD>
                    <TD muted>{t.follower_count}</TD>
                    <TD muted>{t.er_pct}%</TD>
                    <TD><Btn small onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Tasks tile */}
      <Card>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <CardTitle>My Open Tasks</CardTitle>
          <div style={{ display:"flex", gap:6 }}>
            {urgentTasks.length>0&&<span style={{ background:C.red+"22", color:C.red, borderRadius:10, padding:"1px 7px", fontSize:"10px", fontWeight:600 }}>{urgentTasks.length} URGENT</span>}
            <Btn small onClick={onOpenTasks}>View All</Btn>
          </div>
        </div>
        {myTasks.length===0?<div style={{ color:C.txt4, fontSize:"12px" }}>No open tasks.</div>:(
          myTasks.slice(0,4).map(tk=>(
            <div key={tk.id} style={{ padding:"6px 0", borderBottom:`1px solid ${C.bg3}`, display:"flex", gap:8, alignItems:"flex-start" }}>
              <div style={{ marginTop:2 }}><PriorityBadge p={tk.priority}/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"12px", color:C.txt1 }}>{tk.title}</div>
                <div style={{ fontSize:"10px", color:C.txt4 }}>Due {tk.due}</div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Recent Activity tile */}
      <Card>
        <CardTitle>Recent History / Activity</CardTitle>
        {recentActivity.map(h=>{
          const talent=talents.find(t=>t.id===h.talent_id);
          const user=USERS.find(u=>u.id===h.user_id);
          return (
            <div key={h.id} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:`1px solid ${C.bg3}` }}>
              <HistoryTypeIcon type={h.type}/>
              <div style={{ flex:1 }}>
                <span style={{ color:C.purple, fontSize:"11px", fontWeight:500 }}>{talent?.name}</span>
                <span style={{ color:C.txt4, fontSize:"11px" }}> · {user?.name}</span>
                <div style={{ fontSize:"11px", color:C.txt2, marginTop:1 }}>{h.text.slice(0,72)}{h.text.length>72?"…":""}</div>
                <div style={{ fontSize:"10px", color:C.txt4 }}>{new Date(h.ts).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Director only: revenue summary */}
      {role==="director"&&(
        <div style={{ gridColumn:"1/-1" }}>
          <Card accent={C.greenD+"44"}>
            <CardTitle>Revenue Overview — All Signed Clients</CardTitle>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {talents.filter(t=>t.stage==="signed_onboarding").map(t=>(
                <div key={t.id} style={{ background:C.bg3, borderRadius:6, padding:"10px 12px" }}>
                  <div style={{ fontWeight:600, color:C.txt1, fontSize:"13px" }}>{t.name}</div>
                  <div style={{ fontSize:"11px", color:C.txt3, marginTop:2 }}>{t.niches.map(n=><NichePill key={n} n={n}/>)}</div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:"10px", color:C.txt4 }}>YTD Revenue</div>
                    <div style={{ fontSize:"16px", fontWeight:700, color:C.green }}>${parseInt(t.revenue_ytd).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop:4 }}>
                    <div style={{ fontSize:"10px", color:C.txt4 }}>Projected Annual</div>
                    <div style={{ fontSize:"13px", fontWeight:600, color:C.cyan }}>${parseInt(t.revenue_projected).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE BOARD ───────────────────────────────────────────────────────────
function PipelineBoard({ talents, onSelectTalent }) {
  const active = STAGES.filter(s=>!["archived","not_viable"].includes(s));
  return (
    <div>
      {active.map(stage=>{
        const group=talents.filter(t=>t.stage===stage);
        if(!group.length) return null;
        const c=STAGE_COLORS[stage];
        return (
          <div key={stage} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
              <span style={{ fontSize:"11px", fontWeight:600, color:C.txt3, textTransform:"uppercase", letterSpacing:"0.08em" }}>{STAGE_LABELS[stage]}</span>
              <span style={{ fontSize:"11px", color:C.txt4 }}>({group.length})</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Niche</TH><TH>Score</TH><TH>Social</TH><TH>Followers</TH><TH>ER%</TH><TH>Location</TH><TH>Scout</TH><TH>Action</TH></tr></thead>
              <tbody>
                {group.map(t=>(
                  <tr key={t.id}>
                    <TD><span style={{ color:C.purple, fontWeight:600 }}>{t.name}</span></TD>
                    <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
                    <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{color:C.txt4}}>—</span>}</TD>
                    <TD muted>{t.social_handle}</TD>
                    <TD muted>{t.follower_count}</TD>
                    <TD muted>{t.er_pct}%</TD>
                    <TD muted>{t.location}</TD>
                    <TD muted>Jordan Hayes</TD>
                    <TD><Btn small onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── TASKS MODULE (RM12 Tasks / Calendar-linked) ──────────────────────────────
function TasksModule({ tasks, setTasks, talents, currentUser }) {
  const [filter,setFilter]=useState("mine");
  const [showAdd,setShowAdd]=useState(false);
  const [newTask,setNewTask]=useState({ title:"", assigned_to:currentUser.id, related_talent:"", due:"", priority:"medium", notes:"" });

  const filtered = tasks.filter(t=>{
    if(filter==="mine") return t.assigned_to===currentUser.id&&t.status==="open";
    if(filter==="all_open") return t.status==="open";
    if(filter==="completed") return t.status==="completed";
    return true;
  });

  function addTask() {
    if(!newTask.title) return;
    setTasks(prev=>[...prev,{ ...newTask, id:"tk"+Date.now(), status:"open", created_by:currentUser.id, created_at:new Date().toISOString() }]);
    setNewTask({ title:"", assigned_to:currentUser.id, related_talent:"", due:"", priority:"medium", notes:"" });
    setShowAdd(false);
  }

  function complete(id) { setTasks(prev=>prev.map(t=>t.id===id?{...t,status:"completed"}:t)); }

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[["mine","My Tasks"],["all_open","All Open"],["completed","Completed"]].map(([v,l])=>(
            <Btn key={v} variant={filter===v?"purple":"ghost"} small onClick={()=>setFilter(v)}>{l}</Btn>
          ))}
        </div>
        <Btn variant="primary" small onClick={()=>setShowAdd(s=>!s)}>+ New Task</Btn>
      </div>

      {showAdd&&(
        <Card style={{ marginBottom:12 }} accent={C.purpleD+"44"}>
          <CardTitle>Create Task</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Task Title</div><Input value={newTask.title} onChange={v=>setNewTask(p=>({...p,title:v}))} placeholder="Describe the task..." /></div>
            <div><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Assigned To</div><Select value={newTask.assigned_to} onChange={v=>setNewTask(p=>({...p,assigned_to:v}))} options={USERS.map(u=>({v:u.id,l:u.name}))} style={{ width:"100%" }} /></div>
            <div><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Related Talent</div><Select value={newTask.related_talent} onChange={v=>setNewTask(p=>({...p,related_talent:v}))} options={[{v:"",l:"None"},...talents.map(t=>({v:t.id,l:t.name}))]} style={{ width:"100%" }} /></div>
            <div><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Due Date</div><Input value={newTask.due} onChange={v=>setNewTask(p=>({...p,due:v}))} type="date" /></div>
            <div><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Priority</div><Select value={newTask.priority} onChange={v=>setNewTask(p=>({...p,priority:v}))} options={["urgent","high","medium","low"]} style={{ width:"100%" }} /></div>
            <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Notes</div><Textarea value={newTask.notes} onChange={v=>setNewTask(p=>({...p,notes:v}))} placeholder="Additional context..." rows={2} /></div>
          </div>
          <div style={{ display:"flex", gap:8 }}><Btn variant="primary" small onClick={addTask}>Create Task</Btn><Btn small onClick={()=>setShowAdd(false)}>Cancel</Btn></div>
        </Card>
      )}

      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr><TH>Task</TH><TH>Priority</TH><TH>Assigned To</TH><TH>Talent</TH><TH>Due</TH><TH>Notes</TH><TH>Action</TH></tr></thead>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={7} style={{ padding:"16px", color:C.txt4, textAlign:"center", fontSize:"12px" }}>No tasks in this filter.</td></tr>}
          {filtered.map(tk=>{
            const asn=USERS.find(u=>u.id===tk.assigned_to);
            const rel=talents.find(t=>t.id===tk.related_talent);
            const overdue=tk.due&&new Date(tk.due)<new Date()&&tk.status==="open";
            return (
              <tr key={tk.id} style={{ opacity:tk.status==="completed"?0.5:1 }}>
                <TD><span style={{ textDecoration:tk.status==="completed"?"line-through":"none", color:C.txt1, fontWeight:500 }}>{tk.title}</span></TD>
                <TD><PriorityBadge p={tk.priority}/></TD>
                <TD><div style={{ display:"flex", alignItems:"center", gap:5 }}><Avatar user={asn} size={20}/><span style={{ color:C.txt2 }}>{asn?.name}</span></div></TD>
                <TD muted>{rel?<span style={{ color:C.purple }}>{rel.name}</span>:"—"}</TD>
                <TD muted style={{ color:overdue?C.red:undefined }}>{tk.due||"—"}{overdue&&<span style={{ fontSize:"10px", marginLeft:4, color:C.red }}>OVERDUE</span>}</TD>
                <TD muted>{tk.notes||"—"}</TD>
                <TD>{tk.status==="open"&&<Btn small variant="success" onClick={()=>complete(tk.id)}>✓ Done</Btn>}</TD>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── REPORTS MODULE ───────────────────────────────────────────────────────────
function ReportsModule({ talents, tasks }) {
  const [active,setActive]=useState("pipeline_summary");
  const reports = [
    { id:"pipeline_summary",  label:"Pipeline Summary" },
    { id:"jordan_scores",     label:"Jordan Score Report" },
    { id:"revenue_forecast",  label:"Revenue Forecast" },
    { id:"compliance_status", label:"Compliance Status" },
    { id:"niche_breakdown",   label:"Niche Breakdown" },
    { id:"prospect_box",      label:"Prospect Box Score" },
  ];

  const stageCounts = STAGES.map(s=>({ stage:s, count:talents.filter(t=>t.stage===s).length }));
  const nicheMap = {};
  talents.forEach(t=>t.niches.forEach(n=>{nicheMap[n]=(nicheMap[n]||0)+1;}));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:12 }}>
      <div>
        <Card>
          <CardTitle>Report Library</CardTitle>
          {reports.map(r=>(
            <div key={r.id} onClick={()=>setActive(r.id)} style={{ padding:"6px 8px", borderRadius:5, cursor:"pointer", fontSize:"12px", color:active===r.id?C.purple:C.txt2, background:active===r.id?C.purpleGlow:"transparent", marginBottom:2 }}>
              {r.label}
            </div>
          ))}
        </Card>
      </div>
      <div>
        {active==="pipeline_summary"&&(
          <Card>
            <CardTitle>Pipeline Summary Report</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Stage</TH><TH>Count</TH><TH>% of Total</TH><TH>Visual</TH></tr></thead>
              <tbody>
                {stageCounts.filter(r=>r.count>0).map(r=>(
                  <tr key={r.stage}>
                    <TD><StageBadge stage={r.stage} small/></TD>
                    <TD><span style={{ fontWeight:600 }}>{r.count}</span></TD>
                    <TD muted>{Math.round(r.count/talents.length*100)}%</TD>
                    <TD><div style={{ height:6, borderRadius:3, background:STAGE_COLORS[r.stage], width:(r.count/talents.length*100)+"%", minWidth:4 }}/></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {active==="jordan_scores"&&(
          <Card>
            <CardTitle>Jordan Score Report — All Scored Talent</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Stage</TH><TH>P1</TH><TH>P2</TH><TH>P3</TH><TH>P4</TH><TH>P5</TH><TH>Jordan Score</TH><TH>Threshold</TH></tr></thead>
              <tbody>
                {talents.filter(t=>t.jordan_score>0).sort((a,b)=>b.jordan_score-a.jordan_score).map(t=>{
                  const pass=t.jordan_score>=3.5&&t.pillar_scores.every(s=>s>=3);
                  return (
                    <tr key={t.id}>
                      <TD><span style={{ color:C.purple, fontWeight:500 }}>{t.name}</span></TD>
                      <TD><StageBadge stage={t.stage} small/></TD>
                      {t.pillar_scores.map((s,i)=><TD key={i} style={{ color:s>=3?C.green:C.red, fontWeight:600 }}>{s}</TD>)}
                      <TD><span style={{ fontSize:"14px", fontWeight:700, color:t.jordan_score>=3.5?C.green:C.red }}>{t.jordan_score.toFixed(2)}</span></TD>
                      <TD><span style={{ color:pass?C.green:C.red, fontSize:"11px", fontWeight:600 }}>{pass?"✓ PASS":"✗ FAIL"}</span></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
        {active==="revenue_forecast"&&(
          <Card>
            <CardTitle>Revenue Forecast — Active & Signed Talent</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>YTD Revenue</TH><TH>Projected Annual</TH><TH>Rep Type</TH><TH>Commission</TH></tr></thead>
              <tbody>
                {talents.filter(t=>!["archived","not_viable"].includes(t.stage)).sort((a,b)=>b.revenue_projected-a.revenue_projected).map(t=>(
                  <tr key={t.id}>
                    <TD><span style={{ color:C.purple, fontWeight:500 }}>{t.name}</span></TD>
                    <TD><StageBadge stage={t.stage} small/></TD>
                    <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
                    <TD style={{ color:C.green, fontWeight:600 }}>{parseInt(t.revenue_ytd)>0?"$"+parseInt(t.revenue_ytd).toLocaleString():"—"}</TD>
                    <TD style={{ color:C.cyan, fontWeight:600 }}>{parseInt(t.revenue_projected)>0?"$"+parseInt(t.revenue_projected).toLocaleString():"—"}</TD>
                    <TD muted>{t.rep_type||"—"}</TD>
                    <TD muted>{t.commission?t.commission+"%":"—"}</TD>
                  </tr>
                ))}
                <tr style={{ background:C.bg3 }}>
                  <TD><span style={{ fontWeight:600 }}>TOTALS</span></TD>
                  <TD colSpan={2}/>
                  <TD style={{ color:C.green, fontWeight:700 }}>${talents.reduce((a,t)=>a+parseInt(t.revenue_ytd||0),0).toLocaleString()}</TD>
                  <TD style={{ color:C.cyan, fontWeight:700 }}>${talents.reduce((a,t)=>a+parseInt(t.revenue_projected||0),0).toLocaleString()}</TD>
                  <TD colSpan={2}/>
                </tr>
              </tbody>
            </table>
          </Card>
        )}
        {active==="compliance_status"&&(
          <Card>
            <CardTitle>Compliance Status — Ops Stage & Beyond</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Legal Name</TH><TH>Gov ID</TH><TH>DOB</TH><TH>Address</TH><TH>Email/Phone</TH><TH>Tax Doc</TH><TH>Banking</TH><TH>Social Ownership</TH><TH>Complete</TH></tr></thead>
              <tbody>
                {talents.filter(t=>Object.keys(t.compliance).length>0).map(t=>{
                  const keys=["legal_name","gov_id","dob","address","email_phone","tax_doc","banking","social_ownership"];
                  const done=keys.filter(k=>t.compliance[k]).length;
                  return (
                    <tr key={t.id}>
                      <TD><span style={{ color:C.purple, fontWeight:500 }}>{t.name}</span></TD>
                      {keys.map(k=><TD key={k}><span style={{ color:t.compliance[k]?C.green:C.red }}>{t.compliance[k]?"✓":"✗"}</span></TD>)}
                      <TD><span style={{ color:done===8?C.green:C.amber, fontWeight:600 }}>{done}/8</span></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
        {active==="niche_breakdown"&&(
          <Card>
            <CardTitle>Niche Breakdown — All Talent</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Niche</TH><TH>Count</TH><TH>Visual</TH></tr></thead>
              <tbody>
                {Object.entries(nicheMap).sort((a,b)=>b[1]-a[1]).map(([n,c])=>{
                  const colors={Model:"#a855f7",Actor:"#3b82f6",Influencer:"#10b981",Athlete:"#f59e0b"};
                  return (
                    <tr key={n}>
                      <TD><NichePill n={n}/></TD>
                      <TD><span style={{ fontWeight:600 }}>{c}</span></TD>
                      <TD><div style={{ height:8, borderRadius:4, background:colors[n]||C.purple, width:(c/talents.length*100*2)+"%", minWidth:8 }}/></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop:16 }}>
              <CardTitle>Talent by Niche</CardTitle>
              {Object.keys(nicheMap).map(n=>(
                <div key={n} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:"11px", color:C.txt3, marginBottom:4 }}>{n}</div>
                  {talents.filter(t=>t.niches.includes(n)).map(t=>(
                    <div key={t.id} style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.bg3, borderRadius:5, padding:"3px 8px", marginRight:6, marginBottom:4, fontSize:"11px" }}>
                      <span style={{ color:C.purple }}>{t.name}</span>
                      <StageBadge stage={t.stage} small/>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        )}
        {active==="prospect_box"&&(
          <Card>
            <CardTitle>Prospect Box Score — Holding Entry Stage</CardTitle>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><TH>Name</TH><TH>Handle</TH><TH>Platform</TH><TH>Followers</TH><TH>ER%</TH><TH>Location</TH><TH>Days in Holding</TH></tr></thead>
              <tbody>
                {talents.filter(t=>t.stage==="holding_entry").map(t=>{
                  const days=Math.floor((Date.now()-new Date(t.created_at))/86400000);
                  return (
                    <tr key={t.id}>
                      <TD><span style={{ color:C.purple, fontWeight:500 }}>{t.name}</span></TD>
                      <TD muted>{t.social_handle}</TD>
                      <TD muted>{t.platform}</TD>
                      <TD muted>{t.follower_count}</TD>
                      <TD muted>{t.er_pct}%</TD>
                      <TD muted>{t.location}</TD>
                      <TD><span style={{ color:days>14?C.amber:C.txt2, fontWeight:days>14?600:400 }}>{days}d</span></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY / NOTES MODULE (RM12 style) ──────────────────────────────────────
function HistoryModule({ history, setHistory, talents, currentUser }) {
  const [filter,setFilter]=useState("all");
  const [newNote,setNewNote]=useState("");
  const [newTalent,setNewTalent]=useState("");
  const [newType,setNewType]=useState("note");
  const [atMention,setAtMention]=useState("");

  const filtered = history.filter(h=>{
    if(filter==="my") return h.user_id===currentUser.id;
    if(filter==="flagged") return h.flagged;
    return true;
  });

  function addNote() {
    if(!newNote||!newTalent) return;
    const entry = { id:"h"+Date.now(), talent_id:newTalent, user_id:currentUser.id, type:newType, text:newNote+(atMention?` @${atMention}`:""), ts:new Date().toISOString(), flagged:false };
    setHistory(prev=>[entry,...prev]);
    setNewNote(""); setAtMention("");
  }

  function toggleFlag(id) { setHistory(prev=>prev.map(h=>h.id===id?{...h,flagged:!h.flagged}:h)); }

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","All Activity"],["my","My Notes"],["flagged","Flagged"]].map(([v,l])=>(
            <Btn key={v} variant={filter===v?"purple":"ghost"} small onClick={()=>setFilter(v)}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* Add note panel */}
      <Card style={{ marginBottom:12 }} accent={C.purpleD+"33"}>
        <CardTitle>Add History / Note</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
          <div>
            <div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Related Talent</div>
            <Select value={newTalent} onChange={setNewTalent} options={[{v:"",l:"Select talent..."},...talents.map(t=>({v:t.id,l:t.name}))]} style={{ width:"100%" }}/>
          </div>
          <div>
            <div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>Type</div>
            <Select value={newType} onChange={setNewType} options={["note","call","email","task"]} style={{ width:"100%" }}/>
          </div>
          <div>
            <div style={{ fontSize:"11px",color:C.txt3,marginBottom:3 }}>@Mention Colleague</div>
            <Select value={atMention} onChange={setAtMention} options={[{v:"",l:"None"},...USERS.map(u=>({v:u.name,l:u.name}))]} style={{ width:"100%" }}/>
          </div>
        </div>
        <Textarea value={newNote} onChange={setNewNote} placeholder="Enter note, call summary, or email log… Use @mention to notify a team member." rows={2}/>
        <div style={{ marginTop:8 }}><Btn variant="primary" small onClick={addNote}>Post Note</Btn></div>
      </Card>

      {filtered.map(h=>{
        const talent=talents.find(t=>t.id===h.talent_id);
        const user=USERS.find(u=>u.id===h.user_id);
        return (
          <div key={h.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.bg3}` }}>
            <Avatar user={user} size={28}/>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                <HistoryTypeIcon type={h.type}/>
                <span style={{ color:C.purple, fontWeight:500, fontSize:"12px" }}>{talent?.name||"—"}</span>
                <span style={{ color:C.txt3, fontSize:"11px" }}>·</span>
                <span style={{ color:C.txt2, fontSize:"11px" }}>{user?.name}</span>
                <span style={{ color:C.txt4, fontSize:"10px" }}>{new Date(h.ts).toLocaleString()}</span>
                {h.flagged&&<span style={{ background:C.amber+"22", color:C.amber, fontSize:"10px", padding:"1px 6px", borderRadius:8, fontWeight:600 }}>FLAGGED</span>}
              </div>
              <div style={{ fontSize:"12px", color:C.txt2 }}>{h.text}</div>
            </div>
            <Btn small variant="ghost" onClick={()=>toggleFlag(h.id)}>{h.flagged?"⚑ Unflag":"⚐ Flag"}</Btn>
          </div>
        );
      })}
    </div>
  );
}

// ─── FULL ROSTER ──────────────────────────────────────────────────────────────
function FullRoster({ talents, onSelectTalent }) {
  const [search,setSearch]=useState("");
  const [stageF,setStageF]=useState("all");
  const [nicheF,setNicheF]=useState("all");

  const filtered=talents.filter(t=>{
    if(search&&!t.name.toLowerCase().includes(search.toLowerCase())&&!t.social_handle.toLowerCase().includes(search.toLowerCase())) return false;
    if(stageF!=="all"&&t.stage!==stageF) return false;
    if(nicheF!=="all"&&!t.niches.includes(nicheF)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <Input value={search} onChange={setSearch} placeholder="Search by name or handle…" style={{ width:220 }}/>
        <Select value={stageF} onChange={setStageF} options={[{v:"all",l:"All Stages"},...STAGES.map(s=>({v:s,l:STAGE_LABELS[s]}))]} />
        <Select value={nicheF} onChange={setNicheF} options={[{v:"all",l:"All Niches"},...["Model","Actor","Influencer","Athlete"].map(n=>({v:n,l:n}))]} />
        <span style={{ fontSize:"11px", color:C.txt4, display:"flex", alignItems:"center" }}>{filtered.length} records</span>
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr><TH>Name</TH><TH>Stage</TH><TH>Niche</TH><TH>Score</TH><TH>Social</TH><TH>Followers</TH><TH>ER%</TH><TH>Platform</TH><TH>Location</TH><TH>Action</TH></tr></thead>
        <tbody>
          {filtered.map(t=>(
            <tr key={t.id} onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <TD><span style={{ color:C.purple, fontWeight:600 }}>{t.name}</span></TD>
              <TD><StageBadge stage={t.stage} small/></TD>
              <TD>{t.niches.map(n=><NichePill key={n} n={n}/>)}</TD>
              <TD>{t.jordan_score>0?<ScoreBar score={t.jordan_score}/>:<span style={{color:C.txt4}}>—</span>}</TD>
              <TD muted>{t.social_handle}</TD>
              <TD muted>{t.follower_count}</TD>
              <TD muted>{t.er_pct}%</TD>
              <TD muted>{t.platform}</TD>
              <TD muted>{t.location}</TD>
              <TD><Btn small onClick={()=>onSelectTalent(t)}>Open →</Btn></TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TALENT RECORD (multi-tab profile) ────────────────────────────────────────
function TalentRecord({ talent, talents, currentUser, allHistory, setHistory, allTasks, setTasks, onClose, onUpdate }) {
  const TABS = ["Summary","Scoring","Compliance","Framework","Executive","Onboarding","History / Notes","Tasks","Audit Log"];
  const [tab,setTab]=useState("Summary");
  const [local,setLocal]=useState(JSON.parse(JSON.stringify(talent)));
  const [blockMsg,setBlockMsg]=useState("");
  const role=currentUser.role;
  const talentHistory=allHistory.filter(h=>h.talent_id===local.id);
  const talentTasks=allTasks.filter(t=>t.related_talent===local.id);
  const [newNote,setNewNote]=useState("");
  const [noteType,setNoteType]=useState("note");

  function patch(f,v){setLocal(p=>({...p,[f]:v}));}
  function patchComp(f,v){setLocal(p=>({...p,compliance:{...p.compliance,[f]:v}}));}
  function patchPillar(i,v){
    const s=[...local.pillar_scores]; s[i]=parseFloat(v)||0;
    const avg=s.reduce((a,b)=>a+b,0)/5;
    setLocal(p=>({...p,pillar_scores:s,jordan_score:avg}));
  }
  function patchRat(i,v){const r=[...local.pillar_rationales];r[i]=v;setLocal(p=>({...p,pillar_rationales:r}));}
  function addLog(action,stage){return[...local.audit_log,{user:currentUser.name,role:ROLE_LABELS[role],action,stage,ts:new Date().toISOString()}];}
  function save(updated){onUpdate(updated);}

  function postNote(){
    if(!newNote.trim())return;
    const entry={id:"h"+Date.now(),talent_id:local.id,user_id:currentUser.id,type:noteType,text:newNote,ts:new Date().toISOString(),flagged:false};
    setHistory(prev=>[entry,...prev]);
    setNewNote("");
  }

  // ── SCOUT ACTIONS ──
  function scoutSubmit(){
    for(let i=0;i<5;i++){if(!local.pillar_rationales[i]){setBlockMsg("All pillar rationales required.");return;}}
    if(!local.revenue_path){setBlockMsg("Revenue path required.");return;}
    if(!local.scout_summary){setBlockMsg("Scout summary required.");return;}
    if(!local.niches.length){setBlockMsg("Select at least one niche.");return;}
    setBlockMsg("");
    const u={...local,stage:"scout_complete",audit_log:addLog("Completed Talent Packet → Scout Complete","scout_complete")};
    save(u); onClose();
  }
  function scoutArchive(){save({...local,stage:"not_viable",audit_log:addLog("Marked Not Viable – Archive","not_viable")});onClose();}

  // ── TEAM 1 ──
  function t1Decide(d){
    if(d==="approved"){
      for(let i=0;i<5;i++){if(local.pillar_scores[i]<3){setBlockMsg(`Pillar ${i+1} below 3. Cannot approve.`);return;}}
      if(local.jordan_score<3.5){setBlockMsg(`Jordan Score ${local.jordan_score.toFixed(2)} below 3.5 threshold.`);return;}
      save({...local,stage:"ops_processing",team1_decision:"approved",audit_log:addLog("Approved for Ops","team1_review")});onClose();
    } else if(d==="revision"){
      if(!local.team1_notes){setBlockMsg("Correction notes required for revision.");return;}
      save({...local,stage:"scout_complete",team1_decision:"revision",audit_log:addLog("Returned for Revision: "+local.team1_notes,"team1_review")});onClose();
    } else {
      save({...local,stage:"archived",team1_decision:"rejected",audit_log:addLog("Rejected – Archived/Nurture","team1_review")});onClose();
    }
  }

  // ── OPS ──
  function opsAdvance(){
    const done=Object.values(local.compliance).filter(Boolean).length;
    if(done<6){setBlockMsg("At least 6 compliance items must be verified.");return;}
    if(!local.rep_type||!local.commission||!local.term_length){setBlockMsg("Complete the Framework Summary.");return;}
    save({...local,stage:"team2_audit",audit_log:addLog("Compliance verified → Team 2 Audit","ops_processing")});onClose();
  }

  // ── TEAM 2 ──
  function t2Decide(d){
    if(d==="approved") save({...local,stage:"executive_review",team2_decision:"approved",audit_log:addLog("Approved for Director","team2_audit")});
    else if(d==="returned") save({...local,stage:"ops_processing",team2_decision:"returned",audit_log:addLog("Returned to Ops – "+(local.team2_notes||"Issues found"),"team2_audit")});
    else save({...local,stage:"archived",team2_decision:"rejected",audit_log:addLog("Rejected – Process Breakdown","team2_audit")});
    onClose();
  }

  // ── DIRECTOR ──
  function dirDecide(d){
    if(d==="approved") save({...local,stage:"signed_onboarding",director_decision:"approved",audit_log:addLog("Approved – Sign Client","executive_review")});
    else if(d==="hold") save({...local,director_decision:"hold",audit_log:addLog("Decision on Hold","executive_review")});
    else save({...local,stage:"archived",director_decision:"rejected",audit_log:addLog("Rejected","executive_review")});
    onClose();
  }

  // ── SUCCESS ──
  function successConfirm(){
    if(!local.warm_handoff){setBlockMsg("Warm hand-off assignment required.");return;}
    save({...local,warm_handoff_confirmed:true,audit_log:addLog("Warm hand-off confirmed: "+local.warm_handoff,"signed_onboarding")});onClose();
  }

  const nicheOptions=["Model","Actor","Influencer","Athlete"];
  const complianceFields=[["legal_name","Full Legal Name"],["gov_id","Government ID"],["dob","Date of Birth"],["address","Physical Address"],["email_phone","Email / Phone Verification"],["tax_doc","Tax Documentation (W-9)"],["banking","Banking Information"],["social_ownership","Social Account Ownership"]];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:300, overflowY:"auto", padding:"16px 0" }}>
      <div style={{ width:880, background:C.bg1, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", flexShrink:0 }}>

        {/* Record header — Scoreboard-style */}
        <div style={{ background:C.bg2, borderBottom:`1px solid ${C.border}`, padding:"12px 18px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:C.purpleD+"33", border:`2px solid ${C.purpleD}66`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:C.purple }}>
                {local.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{local.name}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:3, flexWrap:"wrap" }}>
                  <StageBadge stage={local.stage}/>
                  {local.niches.map(n=><NichePill key={n} n={n}/>)}
                  <span style={{ color:C.txt4, fontSize:11 }}>{local.social_handle}</span>
                  <span style={{ color:C.txt3, fontSize:11 }}>{local.follower_count} · ER {local.er_pct}%</span>
                  <span style={{ color:C.txt4, fontSize:11 }}>{local.platform}</span>
                </div>
              </div>
            </div>
            {/* Scoreboard strip */}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {local.jordan_score>0&&(
                <div style={{ background:C.bg3, borderRadius:6, padding:"6px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:800, color:local.jordan_score>=3.5?C.green:C.red }}>{local.jordan_score.toFixed(2)}</div>
                  <div style={{ fontSize:10, color:C.txt4 }}>Jordan Score</div>
                </div>
              )}
              {local.revenue_ytd>0&&(
                <div style={{ background:C.bg3, borderRadius:6, padding:"6px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.green }}>${parseInt(local.revenue_ytd).toLocaleString()}</div>
                  <div style={{ fontSize:10, color:C.txt4 }}>YTD Revenue</div>
                </div>
              )}
              <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:6, color:C.txt3, cursor:"pointer", padding:"5px 10px", fontSize:12 }}>✕ Close</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.bg2, overflowX:"auto" }}>
          {TABS.map(t=>(
            <div key={t} onClick={()=>setTab(t)} style={{ padding:"8px 14px", cursor:"pointer", fontSize:"12px", fontWeight:tab===t?600:400, color:tab===t?C.purple:C.txt3, borderBottom:`2px solid ${tab===t?C.purple:"transparent"}`, whiteSpace:"nowrap" }}>{t}</div>
          ))}
        </div>

        <div style={{ padding:18, maxHeight:"68vh", overflowY:"auto" }}>
          {blockMsg&&<div style={{ background:"#450a0a", border:`1px solid ${C.red}44`, borderRadius:6, padding:"7px 12px", color:"#fca5a5", fontSize:12, marginBottom:10 }}>{blockMsg}</div>}

          {/* ── SUMMARY ── */}
          {tab==="Summary"&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Card>
                <CardTitle>Identity</CardTitle>
                {[["Name",local.name],["Handle",local.social_handle],["Platform",local.platform],["Location",local.location],["Followers",local.follower_count],["Engagement Rate",local.er_pct+"%"]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${C.bg3}`, fontSize:12 }}>
                    <span style={{ color:C.txt3 }}>{k}</span><span style={{ color:C.txt1 }}>{v}</span>
                  </div>
                ))}
                {role==="scout"&&(local.stage==="holding_entry")&&(
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:"11px",color:C.txt3,marginBottom:4 }}>Platform</div>
                    <Input value={local.platform} onChange={v=>patch("platform",v)} placeholder="e.g. Instagram/TikTok"/>
                    <div style={{ fontSize:"11px",color:C.txt3,margin:"8px 0 4px" }}>Location</div>
                    <Input value={local.location} onChange={v=>patch("location",v)} placeholder="City, State"/>
                    <div style={{ fontSize:"11px",color:C.txt3,margin:"8px 0 4px" }}>Engagement Rate %</div>
                    <Input value={local.er_pct} onChange={v=>patch("er_pct",v)} placeholder="e.g. 4.5"/>
                  </div>
                )}
              </Card>
              <Card>
                <CardTitle>Jordan Score</CardTitle>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ fontSize:32, fontWeight:800, color:local.jordan_score>=3.5?C.green:local.jordan_score>0?C.red:C.txt4 }}>{local.jordan_score>0?local.jordan_score.toFixed(2):"—"}</div>
                  <div><div style={{ fontSize:11, color:C.txt3 }}>Jordan Score</div><div style={{ fontSize:11, color:local.jordan_score>=3.5?C.green:C.red }}>{local.jordan_score>=3.5?"✓ Meets 3.5 threshold":local.jordan_score>0?"✗ Below threshold":"Not yet scored"}</div></div>
                </div>
                {PILLAR_NAMES.map((n,i)=>(
                  <div key={i} style={{ marginBottom:6 }}>
                    <div style={{ fontSize:10, color:C.txt4, marginBottom:2 }}>P{i+1}: {n}</div>
                    <ScoreBar score={local.pillar_scores[i]}/>
                  </div>
                ))}
              </Card>
              <Card style={{ gridColumn:"1/-1" }}>
                <CardTitle>Niches</CardTitle>
                {role==="scout"&&local.stage==="holding_entry"?(
                  <div style={{ display:"flex", gap:10 }}>
                    {nicheOptions.map(n=>(
                      <label key={n} style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", fontSize:12, color:local.niches.includes(n)?C.purple:C.txt3 }}>
                        <input type="checkbox" checked={local.niches.includes(n)} onChange={e=>patch("niches",e.target.checked?[...local.niches,n]:local.niches.filter(x=>x!==n))}/>
                        {n}
                      </label>
                    ))}
                  </div>
                ):<div>{local.niches.map(n=><NichePill key={n} n={n}/>)}</div>}
              </Card>
              {/* Action area */}
              {role==="scout"&&local.stage==="holding_entry"&&(
                <div style={{ gridColumn:"1/-1", display:"flex", gap:8 }}>
                  <Btn variant="primary" onClick={()=>setTab("Scoring")}>Complete Talent Packet →</Btn>
                  <Btn variant="danger" onClick={scoutArchive}>Not Viable – Archive</Btn>
                </div>
              )}
              {role==="team1_lead"&&local.stage==="team1_review"&&(
                <div style={{ gridColumn:"1/-1" }}>
                  <Card accent={C.amber+"44"}>
                    <CardTitle>Gate 1 — Team 1 Lead Decision</CardTitle>
                    <div style={{ marginBottom:8 }}>
                      <div style={{ fontSize:11,color:C.txt3,marginBottom:3 }}>Correction Notes (required for revision)</div>
                      <Textarea value={local.team1_notes} onChange={v=>patch("team1_notes",v)} placeholder="Detail required corrections for the Scout…"/>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn variant="success" onClick={()=>t1Decide("approved")}>✓ Approved for Ops</Btn>
                      <Btn variant="warning" onClick={()=>t1Decide("revision")}>↩ Return for Revision</Btn>
                      <Btn variant="danger" onClick={()=>t1Decide("rejected")}>✗ Rejected (Archive)</Btn>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── SCORING ── */}
          {tab==="Scoring"&&(
            <div>
              {(role==="scout"&&(local.stage==="holding_entry"||local.stage==="scout_complete"))?(
                <div>
                  <Card>
                    <CardTitle>Scout Summary</CardTitle>
                    <Textarea value={local.scout_summary} onChange={v=>patch("scout_summary",v)} placeholder="High-level overview of strengths and weaknesses…" rows={3}/>
                  </Card>
                  <Card>
                    <CardTitle>90-Day Revenue Path</CardTitle>
                    <Textarea value={local.revenue_path} onChange={v=>patch("revenue_path",v)} placeholder="Current market income strategies and 90-day targets…" rows={3}/>
                  </Card>
                  {PILLAR_NAMES.map((name,i)=>(
                    <Card key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontWeight:600, color:C.txt1 }}>Pillar {i+1}: {name}</div>
                        <div style={{ display:"flex", gap:4 }}>
                          {[1,2,3,4,5].map(n=>(
                            <div key={n} onClick={()=>patchPillar(i,n)} style={{ width:30, height:30, borderRadius:5, background:local.pillar_scores[i]>=n?(n>=3?"#14532d":"#450a0a"):C.bg3, border:`1px solid ${local.pillar_scores[i]>=n?(n>=3?C.green:C.red):C.border2}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, fontWeight:700, color:local.pillar_scores[i]>=n?(n>=3?C.green:C.red):C.txt4 }}>
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Textarea value={local.pillar_rationales[i]} onChange={v=>patchRat(i,v)} placeholder="Written rationale required…" rows={2}/>
                    </Card>
                  ))}
                  <Card accent={C.green+"33"}>
                    <CardTitle>Calculated Jordan Score</CardTitle>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ fontSize:36, fontWeight:800, color:local.jordan_score>=3.5?C.green:local.jordan_score>0?C.red:C.txt4 }}>{local.jordan_score.toFixed(2)}</div>
                      <div style={{ fontSize:12, color:local.jordan_score>=3.5?C.green:C.red }}>{local.jordan_score>=3.5?"✓ Meets 3.5 threshold for Team 1 approval":local.jordan_score>0?"✗ Does not meet threshold":"Complete scoring above"}</div>
                    </div>
                  </Card>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="primary" onClick={scoutSubmit}>Submit Packet → Team 1 Review</Btn>
                    <Btn variant="danger" onClick={scoutArchive}>Not Viable – Archive</Btn>
                  </div>
                </div>
              ):(
                <div>
                  {PILLAR_NAMES.map((name,i)=>(
                    <Card key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontWeight:500, fontSize:13 }}>P{i+1}: {name}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <ScoreBar score={local.pillar_scores[i]}/>
                          <div style={{ width:32,height:32,borderRadius:5,background:local.pillar_scores[i]>=3?C.green+"22":C.red+"22",border:`1px solid ${local.pillar_scores[i]>=3?C.green:C.red}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:local.pillar_scores[i]>=3?C.green:C.red }}>{local.pillar_scores[i]}</div>
                        </div>
                      </div>
                      {local.pillar_rationales[i]&&<p style={{ fontSize:11, color:C.txt3, fontStyle:"italic", margin:0 }}>"{local.pillar_rationales[i]}"</p>}
                    </Card>
                  ))}
                  <Card accent={C.green+"33"}>
                    <CardTitle>Jordan Score</CardTitle>
                    <div style={{ fontSize:36, fontWeight:800, color:local.jordan_score>=3.5?C.green:C.red }}>{local.jordan_score.toFixed(2)}</div>
                    <div style={{ marginTop:8,fontSize:12,color:C.txt3 }}>{local.revenue_path}</div>
                    <div style={{ marginTop:8,fontSize:12,color:C.txt2,fontStyle:"italic" }}>{local.scout_summary}</div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {tab==="Compliance"&&(
            <div>
              {(role==="ops_specialist"||role==="team2_lead"||role==="director")?(
                <div>
                  <Card>
                    <CardTitle>Document Collection Checklist</CardTitle>
                    {complianceFields.map(([key,label])=>(
                      <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.bg3}` }}>
                        <span style={{ fontSize:12, color:local.compliance[key]?C.txt1:C.txt3 }}>{label}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:11, color:local.compliance[key]?C.green:C.txt4 }}>{local.compliance[key]?"Verified":"Pending"}</span>
                          <Toggle on={!!local.compliance[key]} onChange={v=>role==="ops_specialist"&&patchComp(key,v)} disabled={role!=="ops_specialist"}/>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:C.txt3 }}>{Object.values(local.compliance).filter(Boolean).length}/8 items verified</span>
                      <div style={{ height:6, width:200, background:C.bg4, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:(Object.values(local.compliance).filter(Boolean).length/8*100)+"%", background:C.green, borderRadius:3 }}/>
                      </div>
                    </div>
                  </Card>
                  {role==="ops_specialist"&&local.stage==="ops_processing"&&(
                    <Btn variant="success" onClick={opsAdvance}>Advance to Team 2 Audit →</Btn>
                  )}
                </div>
              ):<div style={{ color:C.txt4, fontSize:12, padding:"20px 0" }}>Compliance data restricted to Ops Specialist, Team 2 Lead, and Director.</div>}
            </div>
          )}

          {/* ── FRAMEWORK ── */}
          {tab==="Framework"&&(
            <div>
              {(role==="ops_specialist"||role==="team2_lead"||role==="director")?(
                <div>
                  <Card>
                    <CardTitle>Contract Framework</CardTitle>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {[["Representation Type","rep_type"],["Commission %","commission"],["Term Length","term_length"]].map(([label,field])=>(
                        <div key={field}>
                          <div style={{ fontSize:11,color:C.txt3,marginBottom:3 }}>{label}</div>
                          {role==="ops_specialist"&&local.stage==="ops_processing"?(
                            field==="rep_type"?
                              <Select value={local[field]} onChange={v=>patch(field,v)} options={[{v:"",l:"Select…"},"Exclusive","Non-Exclusive"]} style={{width:"100%"}}/>:
                              <Input value={local[field]} onChange={v=>patch(field,v)} placeholder={field==="commission"?"e.g. 15":"e.g. 12 months"}/>
                          ):<div style={{ fontSize:13, color:C.txt1, fontWeight:500 }}>{local[field]?local[field]+(field==="commission"?"%":""):"—"}</div>}
                        </div>
                      ))}
                    </div>
                  </Card>
                  {role==="team2_lead"&&local.stage==="team2_audit"&&(
                    <Card accent={C.cyan+"44"}>
                      <CardTitle>Team 2 Audit Decision</CardTitle>
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:11,color:C.txt3,marginBottom:3 }}>Audit Notes</div>
                        <Textarea value={local.team2_notes} onChange={v=>patch("team2_notes",v)} placeholder="Document structural issues found…"/>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn variant="success" onClick={()=>t2Decide("approved")}>✓ Approved for Director</Btn>
                        <Btn variant="warning" onClick={()=>t2Decide("returned")}>↩ Returned to Ops</Btn>
                        <Btn variant="danger" onClick={()=>t2Decide("rejected")}>✗ Rejected</Btn>
                      </div>
                    </Card>
                  )}
                </div>
              ):<div style={{ color:C.txt4, fontSize:12, padding:"20px 0" }}>Framework data restricted to Ops Specialist, Team 2 Lead, and Director.</div>}
            </div>
          )}

          {/* ── EXECUTIVE ── */}
          {tab==="Executive"&&(
            <div>
              {(role==="director"||role==="team2_lead"||role==="team1_lead")?(
                <div>
                  <div style={{ background:C.bg0, border:`1px solid ${C.purpleD}55`, borderRadius:8, padding:20 }}>
                    <div style={{ fontSize:10, color:C.purpleD, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:16, fontWeight:700 }}>Executive Summary — Compiled Brief</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
                      {[["Talent Name",local.name],["Niche",local.niches.join(", ")||"—"],["Scout","Jordan Hayes"],["Jordan Score",local.jordan_score.toFixed(2)],["Rep Type",local.rep_type||"—"],["Commission",local.commission?local.commission+"%":"—"],["Term",local.term_length||"—"],["Followers",local.follower_count],["ER%",local.er_pct+"%"]].map(([k,v])=>(
                        <div key={k}>
                          <div style={{ fontSize:10,color:C.txt4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{k}</div>
                          <div style={{ fontSize:14,fontWeight:600,color:C.txt1 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height:1,background:C.border,marginBottom:12 }}/>
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10,color:C.txt4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>90-Day Revenue Path</div>
                      <p style={{ fontSize:12,color:C.txt2,margin:0,lineHeight:1.6 }}>{local.revenue_path||"—"}</p>
                    </div>
                    <div>
                      <div style={{ fontSize:10,color:C.txt4,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>Scout Assessment</div>
                      <p style={{ fontSize:12,color:C.txt2,margin:0,lineHeight:1.6 }}>{local.scout_summary||"—"}</p>
                    </div>
                  </div>
                  {role==="director"&&local.stage==="executive_review"&&(
                    <div style={{ display:"flex", gap:10, marginTop:14 }}>
                      <Btn variant="success" onClick={()=>dirDecide("approved")}>✓ Approve — Sign Client</Btn>
                      <Btn variant="ghost" onClick={()=>dirDecide("hold")}>⏸ Hold for Review</Btn>
                      <Btn variant="danger" onClick={()=>dirDecide("rejected")}>✗ Reject</Btn>
                    </div>
                  )}
                </div>
              ):<div style={{ color:C.txt4, fontSize:12, padding:"20px 0" }}>Executive summary restricted to leadership roles.</div>}
            </div>
          )}

          {/* ── ONBOARDING ── */}
          {tab==="Onboarding"&&(
            <div>
              {(role==="success_manager"||local.stage==="signed_onboarding")?(
                <div>
                  <Card>
                    <CardTitle>System Activation</CardTitle>
                    {[["portal_setup","Client Portal Setup"],["technical_routing","Technical System Routing (Niche-based)"]].map(([key,label])=>(
                      <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.bg3}` }}>
                        <div>
                          <div style={{ fontSize:12, color:C.txt1 }}>{label}</div>
                          {key==="technical_routing"&&<div style={{ fontSize:10, color:C.txt4, marginTop:2 }}>
                            {local.niches.includes("Actor")&&"→ Backstage routing "}{local.niches.includes("Influencer")&&"→ Campaign tracker "}{local.niches.includes("Athlete")&&"→ NIL tracker "}{local.niches.includes("Model")&&"→ Agency portal"}
                          </div>}
                        </div>
                        <Toggle on={!!local[key]} onChange={v=>role==="success_manager"&&patch(key,v)} disabled={role!=="success_manager"}/>
                      </div>
                    ))}
                  </Card>
                  <Card>
                    <CardTitle>Warm Hand-off Assignment</CardTitle>
                    <Input value={local.warm_handoff} onChange={v=>role==="success_manager"&&patch("warm_handoff",v)} placeholder="Division Agent: Name — Division"/>
                    {role==="success_manager"&&!local.warm_handoff_confirmed&&(
                      <div style={{ marginTop:10 }}><Btn variant="success" onClick={successConfirm}>Confirm Hand-off & Complete Onboarding</Btn></div>
                    )}
                    {local.warm_handoff_confirmed&&<div style={{ color:C.green, fontSize:12, marginTop:8 }}>✓ Hand-off confirmed — {local.warm_handoff}</div>}
                  </Card>
                </div>
              ):<div style={{ color:C.txt4, fontSize:12, padding:"20px 0" }}>Onboarding available once talent is signed.</div>}
            </div>
          )}

          {/* ── HISTORY / NOTES ── */}
          {tab==="History / Notes"&&(
            <div>
              <Card style={{ marginBottom:12 }}>
                <CardTitle>Add Note / Log</CardTitle>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <Select value={noteType} onChange={setNoteType} options={["note","call","email","task"]} style={{ width:120 }}/>
                  <div style={{ flex:1 }}><Textarea value={newNote} onChange={setNewNote} placeholder="Log a note, call summary, email, or task detail…" rows={2}/></div>
                </div>
                <Btn small variant="primary" onClick={postNote}>Post Note</Btn>
              </Card>
              {talentHistory.length===0&&<div style={{ color:C.txt4, fontSize:12, padding:"10px 0" }}>No history logged for this talent.</div>}
              {talentHistory.map(h=>{
                const u=USERS.find(u=>u.id===h.user_id);
                return (
                  <div key={h.id} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:`1px solid ${C.bg3}` }}>
                    <Avatar user={u} size={26}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
                        <HistoryTypeIcon type={h.type}/>
                        <span style={{ color:C.txt2, fontSize:11, fontWeight:500 }}>{u?.name}</span>
                        <span style={{ color:C.txt4, fontSize:10 }}>{new Date(h.ts).toLocaleString()}</span>
                        {h.flagged&&<span style={{ background:C.amber+"22", color:C.amber, fontSize:"10px", padding:"1px 6px", borderRadius:8 }}>FLAGGED</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.txt2 }}>{h.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TASKS ── */}
          {tab==="Tasks"&&(
            <div>
              {talentTasks.length===0&&<div style={{ color:C.txt4, fontSize:12, padding:"10px 0" }}>No tasks linked to this talent.</div>}
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr><TH>Task</TH><TH>Priority</TH><TH>Assigned</TH><TH>Due</TH><TH>Status</TH></tr></thead>
                <tbody>
                  {talentTasks.map(tk=>{
                    const asn=USERS.find(u=>u.id===tk.assigned_to);
                    return (
                      <tr key={tk.id}>
                        <TD>{tk.title}</TD>
                        <TD><PriorityBadge p={tk.priority}/></TD>
                        <TD muted>{asn?.name}</TD>
                        <TD muted>{tk.due||"—"}</TD>
                        <TD><span style={{ color:tk.status==="completed"?C.green:C.amber, fontSize:11, fontWeight:600 }}>{tk.status.toUpperCase()}</span></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── AUDIT LOG ── */}
          {tab==="Audit Log"&&(
            <div>
              <Card>
                <CardTitle>Complete Activity Audit Log</CardTitle>
                {[...local.audit_log].reverse().map((e,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:`1px solid ${C.bg3}` }}>
                    <div style={{ width:6,height:6,borderRadius:"50%",background:C.purple,marginTop:5,flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <span style={{ color:C.purple, fontSize:12, fontWeight:500 }}>{e.user}</span>
                      <span style={{ color:C.txt4, fontSize:11 }}> ({e.role})</span>
                      <span style={{ color:C.txt2, fontSize:12 }}> — {e.action}</span>
                      <div style={{ fontSize:10, color:C.txt4 }}>{new Date(e.ts).toLocaleString()}</div>
                    </div>
                    <StageBadge stage={e.stage} small/>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW HOLDING ENTRY ─────────────────────────────────────────────────────────
function NewHoldingForm({ currentUser, onSave, onCancel }) {
  const [f,setF]=useState({ name:"", social_handle:"", follower_count:"", er_pct:"", platform:"", location:"" });
  const p=(k,v)=>setF(prev=>({...prev,[k]:v}));
  function save(){
    if(!f.name||!f.social_handle){return;}
    onSave({ id:"t"+Date.now(), ...f, stage:"holding_entry", niches:[], scout_id:currentUser.id, created_at:new Date().toISOString(), pillar_scores:[0,0,0,0,0], pillar_rationales:["","","","",""], jordan_score:0, revenue_path:"", scout_summary:"", team1_notes:"", team1_decision:null, compliance:{}, rep_type:"", commission:"", term_length:"", team2_notes:"", team2_decision:null, director_decision:null, portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false, revenue_ytd:"0", revenue_projected:"0",
      audit_log:[{ user:currentUser.name, role:ROLE_LABELS[currentUser.role], action:"Created holding record", stage:"holding_entry", ts:new Date().toISOString() }] });
  }
  return (
    <div style={{ maxWidth:520 }}>
      <Card accent={C.purpleD+"44"}>
        <CardTitle>New Holding Entry — Silent Screen</CardTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          {[["Full Name","name","e.g. Alex Rivera"],["Social Handle","social_handle","@handle"],["Follower Count","follower_count","e.g. 800K"],["Engagement Rate %","er_pct","e.g. 5.2"],["Platform(s)","platform","e.g. Instagram/TikTok"],["Location","location","City, State"]].map(([l,k,ph])=>(
            <div key={k}><div style={{ fontSize:11,color:C.txt3,marginBottom:3 }}>{l}</div><Input value={f[k]} onChange={v=>p(k,v)} placeholder={ph}/></div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="primary" onClick={save}>Create Holding Record</Btn>
          <Btn onClick={onCancel}>Cancel</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [talents,setTalents]=useState(TALENTS_SEED);
  const [tasks,setTasks]=useState(TASKS_SEED);
  const [history,setHistory]=useState(HISTORY_SEED);
  const [view,setView]=useState("dashboard");
  const [selectedTalent,setSelectedTalent]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);

  function updateTalent(u){setTalents(p=>p.map(t=>t.id===u.id?u:t));}
  function newTalent(t){setTalents(p=>[...p,t]);setShowNew(false);setSelectedTalent(t);}

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const role=user.role;
  const stageMap={scout:["holding_entry","scout_complete"],team1_lead:["team1_review"],ops_specialist:["ops_processing"],team2_lead:["team2_audit"],director:["executive_review"],success_manager:["signed_onboarding"]};
  const myQueueCount=talents.filter(t=>(stageMap[role]||[]).includes(t.stage)).length;
  const myTaskCount=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open").length;
  const urgentCount=tasks.filter(t=>t.assigned_to===user.id&&t.status==="open"&&t.priority==="urgent").length;

  const NAV = [
    { section:"WORKSPACE" },
    { id:"dashboard",  label:"Dashboard",      icon:"⬛" },
    { id:"workspace",  label:"My Workspace",   icon:"☆" },
    { section:"TALENT MANAGEMENT" },
    { id:"pipeline",   label:"Pipeline Matrix",icon:"◈" },
    { id:"roster",     label:"Full Roster",    icon:"☰" },
    ...(role==="scout"?[{ id:"new_entry", label:"New Holding Entry", icon:"＋" }]:[]),
    { section:"OPERATIONS" },
    { id:"tasks",      label:"Tasks",          icon:"☑" },
    { id:"history",    label:"History / Notes",icon:"✎" },
    { id:"reports",    label:"Reports",        icon:"⬡" },
    { section:"PIPELINE STAGES" },
    ...STAGES.filter(s=>!["archived","not_viable"].includes(s)).map(s=>({
      id:"stage_"+s, label:STAGE_LABELS[s], dot:STAGE_COLORS[s], count:talents.filter(t=>t.stage===s).length,
    })),
  ];

  return (
    <div style={{ ...base, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.bg2, borderBottom:`1px solid ${C.border}`, padding:"0 16px", height:46, flexShrink:0, zIndex:20, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontWeight:800, fontSize:15, color:C.purple, letterSpacing:"0.06em" }}>NZINGA <span style={{ fontSize:9, color:C.txt4, letterSpacing:"0.14em" }}>TALENT OS</span></div>
          <div style={{ width:1, height:20, background:C.border }}/>
          <CommandLaunch talents={talents} onSelectTalent={setSelectedTalent} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Queue/task counters */}
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ background:C.purpleGlow, borderRadius:6, padding:"3px 10px", fontSize:11 }}>Queue <span style={{ color:C.purple, fontWeight:700 }}>{myQueueCount}</span></div>
            <div style={{ background:urgentCount?C.red+"22":"transparent", border:`1px solid ${urgentCount?C.red+"44":C.border}`, borderRadius:6, padding:"3px 10px", fontSize:11, color:urgentCount?C.red:C.txt3 }}>Tasks <span style={{ fontWeight:700 }}>{myTaskCount}</span>{urgentCount>0&&<span style={{ marginLeft:4, fontWeight:700 }}>({urgentCount} urgent)</span>}</div>
          </div>
          {/* Role switcher */}
          <div style={{ display:"flex", alignItems:"center", gap:5, background:C.bg3, borderRadius:6, padding:"3px 8px", border:`1px solid ${C.border2}` }}>
            <span style={{ fontSize:10, color:C.txt4 }}>ROLE:</span>
            <select value={role} onChange={e=>{const u=USERS.find(u=>u.role===e.target.value);if(u)setUser(u);}} style={{ background:"transparent", border:"none", outline:"none", color:C.purple, fontSize:11, fontWeight:600, cursor:"pointer" }}>
              {USERS.map(u=><option key={u.id} value={u.role}>{ROLE_LABELS[u.role]} — {u.name}</option>)}
            </select>
          </div>
          {/* Profile */}
          <div style={{ position:"relative" }}>
            <div onClick={()=>setProfileOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", padding:"3px 8px", borderRadius:6, background:profileOpen?C.bg3:"transparent", border:`1px solid ${profileOpen?C.border2:"transparent"}` }}>
              <Avatar user={user} size={26}/>
              <div><div style={{ fontSize:12, fontWeight:600, color:C.txt1 }}>{user.name}</div><div style={{ fontSize:10, color:user.color }}>{user.title}</div></div>
            </div>
            {profileOpen&&(
              <div style={{ position:"absolute", right:0, top:38, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:7, width:190, zIndex:100 }}>
                <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{user.name}</div>
                  <div style={{ fontSize:11, color:C.txt4 }}>{user.email}</div>
                  <div style={{ fontSize:11, color:user.color, marginTop:2 }}>{ROLE_LABELS[user.role]}</div>
                </div>
                <div style={{ padding:6 }}>
                  <div onClick={()=>setUser(null)} style={{ padding:"6px 8px", cursor:"pointer", color:C.red, fontSize:12, borderRadius:4 }}>Sign Out</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCOREBOARD */}
      <Scoreboard talents={talents}/>

      {/* BODY */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* SIDEBAR */}
        <div style={{ width:196, background:C.bg1, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
          {NAV.map((item,idx)=>{
            if(item.section) return <div key={idx} style={{ padding:"12px 0 3px 12px", fontSize:9, color:C.txt4, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>{item.section}</div>;
            const isActive = view===item.id;
            return (
              <div key={item.id} onClick={()=>{ if(item.id==="new_entry"){setShowNew(true);setView("dashboard");} else if(item.id.startsWith("stage_")){setView("pipeline");} else {setView(item.id);setShowNew(false);} }} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px 6px 12px", cursor:"pointer", background:isActive?C.purpleGlow:"transparent", borderLeft:`2px solid ${isActive?C.purple:"transparent"}`, marginBottom:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  {item.dot?<span style={{ width:6,height:6,borderRadius:"50%",background:item.dot,display:"inline-block" }}/>:<span style={{ fontSize:11,color:isActive?C.purple:C.txt4 }}>{item.icon}</span>}
                  <span style={{ fontSize:12, color:isActive?C.purple:C.txt2 }}>{item.label}</span>
                </div>
                {item.count>0&&<span style={{ background:C.bg4, color:C.purple, fontSize:10, padding:"1px 6px", borderRadius:8, fontWeight:600 }}>{item.count}</span>}
              </div>
            );
          })}
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg0 }}>
          {/* Page header */}
          <div style={{ padding:"10px 20px 8px", borderBottom:`1px solid ${C.border}`, background:C.bg1, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.txt1 }}>
                {view==="dashboard"&&"Dashboard"}
                {view==="workspace"&&"My Workspace"}
                {view==="pipeline"&&"Pipeline Matrix"}
                {view==="roster"&&"Full Roster"}
                {view==="tasks"&&"Tasks"}
                {view==="history"&&"History / Notes"}
                {view==="reports"&&"Reports"}
                {showNew&&"New Holding Entry"}
              </div>
              <div style={{ fontSize:11, color:C.txt4, marginTop:1 }}>{user.name} · {ROLE_LABELS[role]} · Nzinga Talent OS</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {role==="scout"&&!showNew&&<Btn variant="primary" small onClick={()=>{setShowNew(true);setView("dashboard");}}>+ New Holding Entry</Btn>}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
            {showNew&&role==="scout"?<NewHoldingForm currentUser={user} onSave={newTalent} onCancel={()=>setShowNew(false)}/>:
             view==="dashboard"?<Dashboard talents={talents} tasks={tasks} history={history} currentUser={user} onSelectTalent={setSelectedTalent} onOpenTasks={()=>setView("tasks")}/>:
             view==="workspace"?<div style={{ color:C.txt3, fontSize:12 }}>
               <Card><CardTitle>My Favorites</CardTitle>{["Pipeline Matrix","Reports","Full Roster"].map(f=><div key={f} style={{ padding:"5px 0", borderBottom:`1px solid ${C.bg3}`, fontSize:12, color:C.purple, cursor:"pointer" }} onClick={()=>setView(f.toLowerCase().replace(" ",""))}>{f}</div>)}</Card>
               <Card><CardTitle>My Reports</CardTitle>{["Jordan Score Report","Revenue Forecast","Pipeline Summary"].map(r=><div key={r} style={{ padding:"5px 0", borderBottom:`1px solid ${C.bg3}`, fontSize:12, color:C.txt2 }}>{r}</div>)}</Card>
             </div>:
             view==="pipeline"?<PipelineBoard talents={talents} onSelectTalent={setSelectedTalent}/>:
             view==="roster"?<FullRoster talents={talents} onSelectTalent={setSelectedTalent}/>:
             view==="tasks"?<TasksModule tasks={tasks} setTasks={setTasks} talents={talents} currentUser={user}/>:
             view==="history"?<HistoryModule history={history} setHistory={setHistory} talents={talents} currentUser={user}/>:
             view==="reports"?<ReportsModule talents={talents} tasks={tasks}/>:null}
          </div>
        </div>
      </div>

      {/* TALENT RECORD MODAL */}
      {selectedTalent&&(
        <TalentRecord
          talent={talents.find(t=>t.id===selectedTalent.id)||selectedTalent}
          talents={talents}
          currentUser={user}
          allHistory={history}
          setHistory={setHistory}
          allTasks={tasks}
          setTasks={setTasks}
          onClose={()=>setSelectedTalent(null)}
          onUpdate={u=>{updateTalent(u);setSelectedTalent(u);}}
        />
      )}
    </div>
  );
}
