// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";

function CompanyCodeScreen({ onCode, onProspectPortal }) {
  const [code,setCode]=useState(""); const [err,setErr]=useState("");
  function go(){const c=code.trim().toUpperCase();if(COMPANY_CODES[c])onCode(c);else setErr("Code not found. Try: NZG");}
  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#f5f0ea,#ede8e0 40%,#e8e2f5)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",width:600,height:600,borderRadius:"50%",background:"rgba(124,58,237,0.06)",top:-150,right:-100,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",background:"rgba(37,99,235,0.05)",bottom:-100,left:-80,pointerEvents:"none" }}/>
      <div style={{ width:440,zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:38,fontWeight:800,color:"#1a2332",fontFamily:"Georgia,serif" }}>Nzinga</div>
          <div style={{ fontSize:11,color:"#6b7280",letterSpacing:"0.18em",textTransform:"uppercase",marginTop:2 }}>Talent Operating System</div>
        </div>
        <div style={{ background:"#fff",borderRadius:12,boxShadow:"0 4px 24px rgba(0,0,0,0.10)",padding:"32px 36px" }}>
          <div style={{ display:"flex",justifyContent:"center",marginBottom:20 }}>
            <div style={{ width:50,height:50,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontFamily:"Georgia,serif",fontWeight:800 }}>N</div>
          </div>
          <div style={{ fontSize:18,fontWeight:700,textAlign:"center",color:"#111827",marginBottom:4,fontFamily:"Georgia,serif" }}>Welcome</div>
          <div style={{ fontSize:13,textAlign:"center",color:"#6b7280",marginBottom:20 }}>Enter your company code to continue</div>
          <Lbl>Company Code</Lbl>
          <FInput value={code} onChange={setCode} placeholder="e.g. NZG" style={{ textAlign:"center",fontSize:16,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6 }}/>
          {err&&<div style={{ color:T.red,fontSize:11,marginBottom:8,textAlign:"center" }}>{err}</div>}
          <Btn variant="primary" onClick={go} full style={{ padding:"9px",fontSize:13,marginTop:6 }}>Continue →</Btn>
          <div style={{ marginTop:12,textAlign:"center",fontSize:11,color:"#9ca3af" }}>Demo: <span style={{ color:T.blue,cursor:"pointer",fontWeight:600 }} onClick={()=>setCode("NZG")}>NZG</span></div>
          <div style={{ marginTop:16,paddingTop:14,borderTop:"1px solid #f0f0f0",textAlign:"center" }}>
            <div style={{ fontSize:12,color:T.t3,marginBottom:8 }}>Are you a talent applicant?</div>
            <Btn variant="ghost" onClick={onProspectPortal} style={{ fontSize:12 }}>🎭 Talent Application Portal →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE LOGIN ───────────────────────────────────────────────────────────
function LoginScreen({ companyCode, onLogin, onBack }) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [show,setShow]=useState(false); const [err,setErr]=useState("");
  function go(){const u=USERS.find(u=>u.email===email&&u.password===pass);if(u)onLogin(u);else setErr("Invalid email or password.");}
  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#f5f0ea,#ede8e0 40%,#e8e2f5)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"rgba(124,58,237,0.06)",top:-100,right:-80,pointerEvents:"none" }}/>
      <div style={{ display:"flex",width:800,background:"#fff",borderRadius:14,boxShadow:"0 8px 40px rgba(0,0,0,0.12)",overflow:"hidden",zIndex:1 }}>
        <div style={{ flex:1,padding:"40px 36px" }}>
          <button onClick={onBack} style={{ background:"none",border:"none",color:T.t3,fontSize:12,cursor:"pointer",marginBottom:16,fontFamily:"inherit" }}>← Code: <strong>{companyCode}</strong></button>
          <div style={{ fontSize:20,fontWeight:700,color:"#111827",marginBottom:3,fontFamily:"Georgia,serif" }}>Welcome Back</div>
          <div style={{ fontSize:13,color:"#6b7280",marginBottom:24 }}>Log into your account</div>
          <div style={{ marginBottom:12 }}>
            <Lbl>Email</Lbl>
            <div style={{ position:"relative" }}><span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#9ca3af" }}>👤</span>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="email@nzinga.co" style={{ background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:5,color:T.t1,padding:"7px 9px 7px 28px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/></div>
          </div>
          <div style={{ marginBottom:6 }}>
            <Lbl>Password</Lbl>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#9ca3af" }}>🔒</span>
              <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="••••••••" style={{ background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:5,color:T.t1,padding:"7px 28px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
              <span onClick={()=>setShow(s=>!s)} style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",cursor:"pointer",fontSize:12 }}>{show?"🙈":"👁"}</span>
            </div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <label style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,color:T.t2,cursor:"pointer" }}><input type="checkbox"/> Remember Me</label>
            <span style={{ fontSize:12,color:T.blue,cursor:"pointer" }}>Forgot Password?</span>
          </div>
          {err&&<div style={{ color:T.red,fontSize:11,marginBottom:8 }}>{err}</div>}
          <button onClick={go} style={{ width:"100%",padding:"10px",background:T.orange,color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Sign In</button>
          <div style={{ marginTop:8,textAlign:"center",fontSize:11,color:T.t4 }}>Company Code: <strong>{companyCode}</strong></div>
        </div>
        <div style={{ width:300,background:"linear-gradient(160deg,#1a2332,#243044 60%,#1e3a5f)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",width:260,height:260,borderRadius:"50%",background:"rgba(124,58,237,0.08)",top:-80,right:-60 }}/>
          <div style={{ textAlign:"center",zIndex:1,width:"100%" }}>
            <div style={{ fontSize:32,fontWeight:800,color:"#fff",fontFamily:"Georgia,serif",marginBottom:16 }}>Nzinga<br/>Talent OS</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:20 }}>Multi-role talent pipeline with full compliance tracking.</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>Quick Demo Access</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5 }}>
              {USERS.map(u=><div key={u.id} onClick={()=>{setEmail(u.email);setPass(u.password);}} style={{ background:"rgba(255,255,255,0.06)",border:`1px solid ${u.color}44`,borderRadius:6,padding:"5px 8px",cursor:"pointer" }}>
                <div style={{ fontSize:10,color:u.color,fontWeight:600 }}>{ROLE_LABELS[u.role]}</div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{u.name.split(" ")[0]}</div>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROSPECT PORTAL ──────────────────────────────────────────────────────────

export { CompanyCodeScreen, LoginScreen };
