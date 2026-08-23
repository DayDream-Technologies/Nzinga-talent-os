// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { CompanyLogo, TMXLogo, TMXMark } from "@/components/branding";
import { PLATFORM_BRAND } from "@/constants/company-branding";
import { sendPasswordResetEmail, friendlyAuthError } from "@/services/auth.service";
import { supabaseConfigured } from "@/lib/supabase";

function CompanyCodeScreen({ onCode, onProspectPortal }) {
  const [code,setCode]=useState(""); const [err,setErr]=useState("");
  function go(){const c=code.trim().toUpperCase();if(COMPANY_CODES[c])onCode(c);else setErr("Code not found. Try: NZG");}
  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#f5f0ea,#ede8e0 40%,#e8e2f5)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit','Segoe UI',sans-serif",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",width:600,height:600,borderRadius:"50%",background:"rgba(124,58,237,0.06)",top:-150,right:-100,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",width:400,height:400,borderRadius:"50%",background:"rgba(37,99,235,0.05)",bottom:-100,left:-80,pointerEvents:"none" }}/>
      <div style={{ width:440,zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <CompanyLogo variant="platform" size="lg" />
          <div style={{ fontSize:11,color:"#6b7280",letterSpacing:"0.18em",textTransform:"uppercase",marginTop:8 }}>{PLATFORM_BRAND.tagline}</div>
        </div>
        <div style={{ background:"#fff",borderRadius:12,boxShadow:"0 4px 24px rgba(0,0,0,0.10)",padding:"32px 36px" }}>
          <div style={{ display:"flex",justifyContent:"center",marginBottom:20 }}>
            <TMXLogo size="md" />
          </div>
          <div style={{ fontSize:18,fontWeight:700,textAlign:"center",color:"#111827",marginBottom:4,fontFamily:"'Syne',sans-serif" }}>Welcome</div>
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
function LoginScreen({ companyCode, onSignIn, onLoginSuccess, onBack, onChangeCode, onHome }) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [show,setShow]=useState(false); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const [resetSent,setResetSent]=useState(false);
  async function go(){
    setErr("");setResetSent(false);setLoading(true);
    try{
      const u=onSignIn?await onSignIn(email,pass):USERS.find(u=>u.email===email&&u.password===pass);
      setLoading(false);
      if(u)onLoginSuccess(u);else setErr(friendlyAuthError("Invalid login credentials"));
    }catch(e){
      setLoading(false);
      setErr(friendlyAuthError(e?.message||"Login failed."));
    }
  }
  async function handleForgotPassword(){
    if(!email){setErr("Enter your email address first, then click Forgot Password.");return;}
    setErr("");setLoading(true);
    const {error}=await sendPasswordResetEmail(email.trim());
    setLoading(false);
    if(error){setErr(error);return;}
    setResetSent(true);
  }
  const goHome = onHome || onBack;
  const changeCode = onChangeCode || onBack;
  const [navReady, setNavReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setNavReady(true), 400);
    return () => window.clearTimeout(t);
  }, []);
  const fieldStyle={
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:8,
    color:"#e8eef4",
    padding:"10px 12px 10px 36px",
    fontSize:13,
    width:"100%",
    boxSizing:"border-box",
    outline:"none",
    fontFamily:"inherit",
    transition:"border-color 0.15s ease, box-shadow 0.15s ease",
  };
  return (
    <div style={{
      minHeight:"100vh",
      display:"flex",
      flexDirection:"column",
      background:"#0c1520",
      color:"#e8eef4",
      fontFamily:"'Outfit','Segoe UI',sans-serif",
      position:"relative",
      overflow:"hidden",
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"/>
      <div aria-hidden style={{
        position:"absolute",inset:0,
        background:
          "radial-gradient(ellipse 70% 50% at 75% 15%, rgba(61,159,212,0.20), transparent 55%),"+
          "radial-gradient(ellipse 45% 40% at 10% 85%, rgba(29,111,164,0.16), transparent 50%),"+
          "linear-gradient(165deg, #0c1520 0%, #122033 45%, #0a121c 100%)",
      }}/>
      <div className="mh-orb" aria-hidden style={{
        position:"absolute",width:"50vmax",height:"50vmax",right:"-15%",top:"-20%",
        borderRadius:"50%",background:"radial-gradient(circle, rgba(61,159,212,0.12), transparent 68%)",pointerEvents:"none",
      }}/>

      <header style={{
        position:"relative",zIndex:2,display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"16px clamp(16px,4vw,40px)",background:"rgba(12,21,32,0.65)",
        borderBottom:"1px solid rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",
      }}>
        <button type="button" onClick={goHome} aria-label={`${PLATFORM_BRAND.name} — go to home`} style={{
          background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:10,font:"inherit",
        }}>
          <TMXMark size="sm"/>
          <span style={{ fontSize:15,fontWeight:700,color:"#e8eef4",letterSpacing:"0.02em" }}>{PLATFORM_BRAND.name}</span>
        </button>
        <button type="button" className="mh-link-underline" onClick={onBack} disabled={!navReady} style={{
          background:"none",border:"none",color:"#8fa3b5",fontSize:13,fontWeight:500,cursor:navReady?"pointer":"default",fontFamily:"inherit",
          opacity: navReady ? 1 : 0.45,
        }}>
          ← Company code
        </button>
      </header>

      <div style={{ position:"relative",zIndex:1,flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 16px 48px" }}>
        <div className="animate-scale-in" style={{
          display:"flex",width:"min(840px,100%)",background:"rgba(255,255,255,0.06)",
          border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,
          boxShadow:"0 12px 40px rgba(0,0,0,0.35)",overflow:"hidden",backdropFilter:"blur(12px)",
        }}>
          <div className="animate-fade-in-up" style={{ flex:1,padding:"36px 32px" }}>
            <button type="button" className="mh-link-underline" onClick={onBack} disabled={!navReady} style={{
              background:"none",border:"none",color:"#8fa3b5",fontSize:12,cursor:navReady?"pointer":"default",marginBottom:18,fontFamily:"inherit",padding:0,
              opacity: navReady ? 1 : 0.45,
            }}>← Back to company code</button>

            <div style={{ fontSize:11,color:"#8fa3b5",marginBottom:14 }}>
              Current code: <strong style={{ color:"#3d9fd4" }}>{companyCode}</strong>
            </div>
            <div style={{
              fontFamily:"'Syne','Outfit',sans-serif",fontSize:24,fontWeight:700,color:"#e8eef4",
              marginBottom:4,letterSpacing:"-0.02em",
            }}>Welcome Back</div>
            <div style={{ fontSize:13,color:"#8fa3b5",marginBottom:24 }}>Log into your account</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:500,color:"#8fa3b5",marginBottom:5 }}>Email</div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#8fa3b5",fontSize:13 }}>✉</span>
                <input
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&go()}
                  placeholder="email@nzinga.co"
                  style={fieldStyle}
                  onFocus={e=>{e.currentTarget.style.borderColor="#3d9fd4";e.currentTarget.style.boxShadow="0 0 0 3px rgba(61,159,212,0.18)";}}
                  onBlur={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.boxShadow="none";}}
                />
              </div>
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11,fontWeight:500,color:"#8fa3b5",marginBottom:5 }}>Password</div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#8fa3b5",fontSize:13 }}>🔒</span>
                <input
                  type={show?"text":"password"}
                  value={pass}
                  onChange={e=>setPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&go()}
                  placeholder="••••••••"
                  style={{ ...fieldStyle,paddingRight:36 }}
                  onFocus={e=>{e.currentTarget.style.borderColor="#3d9fd4";e.currentTarget.style.boxShadow="0 0 0 3px rgba(61,159,212,0.18)";}}
                  onBlur={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.boxShadow="none";}}
                />
                <span onClick={()=>setShow(s=>!s)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#8fa3b5",cursor:"pointer",fontSize:12 }}>{show?"Hide":"Show"}</span>
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,marginTop:10 }}>
              <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#8fa3b5",cursor:"pointer" }}>
                <input type="checkbox"/> Remember Me
              </label>
              {supabaseConfigured&&(
                <button type="button" className="mh-link-underline" onClick={handleForgotPassword} disabled={loading} style={{
                  background:"none",border:"none",fontSize:12,color:"#3d9fd4",cursor:"pointer",fontFamily:"inherit",padding:0,
                }}>Forgot Password?</button>
              )}
            </div>
            {err&&<div style={{ color:"#f87171",fontSize:12,marginBottom:10,lineHeight:1.5 }}>{err}</div>}
            {resetSent&&<div style={{ color:"#4ade80",fontSize:12,marginBottom:10,lineHeight:1.5 }}>If an account exists for that email, we sent a password reset message. Check your inbox and follow the Reset Password button. If you did not request this, you can ignore the email.</div>}
            <button
              type="button"
              className="mh-cta"
              onClick={go}
              disabled={loading}
              style={{
                width:"100%",padding:"12px",background:"#3d9fd4",color:"#061018",border:"none",borderRadius:8,
                fontSize:14,fontWeight:600,cursor:loading?"wait":"pointer",fontFamily:"inherit",opacity:loading?0.7:1,
              }}
            >
              {loading?"Signing in…":"Sign In"}
            </button>
            <div style={{ marginTop:14,textAlign:"center" }}>
              <button type="button" className="mh-link-underline" onClick={changeCode} disabled={!navReady} style={{
                background:"transparent",border:"none",color:"#8fa3b5",fontSize:12,cursor:navReady?"pointer":"default",fontFamily:"inherit",
                opacity: navReady ? 1 : 0.45,
              }}>Use a different company code</button>
            </div>
          </div>

          <div className="animate-slide-right stagger-2" style={{
            width:300,flexShrink:0,
            background:"linear-gradient(165deg, rgba(29,111,164,0.25), rgba(12,21,32,0.9))",
            borderLeft:"1px solid rgba(255,255,255,0.10)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:28,position:"relative",overflow:"hidden",
          }}>
            <div className="mh-orb" aria-hidden style={{
              position:"absolute",width:220,height:220,borderRadius:"50%",
              background:"rgba(61,159,212,0.12)",top:-60,right:-40,pointerEvents:"none",
            }}/>
            <div style={{ textAlign:"center",zIndex:1,width:"100%" }}>
              <button type="button" onClick={goHome} aria-label={`${PLATFORM_BRAND.name} — go to home`} style={{
                background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",justifyContent:"center",marginBottom:16,width:"100%",font:"inherit",
              }}>
                <TMXLogo size="md" theme="dark"/>
              </button>
              <div style={{ fontSize:12,color:"#8fa3b5",lineHeight:1.6,marginBottom:22 }}>
                {PLATFORM_BRAND.tagline} — multi-role talent pipeline with full compliance tracking.
              </div>
              <div style={{ fontSize:10,color:"#3d9fd4",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontWeight:600 }}>
                Quick Demo Access
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                {USERS.map((u,i)=>(
                  <div
                    key={u.id}
                    className={`hover-lift stagger-${Math.min(i+1,8)}`}
                    onClick={()=>{setEmail(u.email);setPass(u.password);}}
                    style={{
                      background:"rgba(255,255,255,0.05)",
                      border:`1px solid ${u.color}55`,
                      borderRadius:7,
                      padding:"7px 8px",
                      cursor:"pointer",
                    }}
                  >
                    <div style={{ fontSize:10,color:u.color,fontWeight:600 }}>{ROLE_LABELS[u.role]}</div>
                    <div style={{ fontSize:10,color:"rgba(232,238,244,0.45)" }}>{u.name.split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ position:"relative",zIndex:1,padding:"0 16px 20px",textAlign:"center",fontSize:11,color:"#8fa3b5",opacity:0.75 }}>
        <div>© {new Date().getFullYear()} {PLATFORM_BRAND.footer}</div>
        <div style={{ marginTop:4 }}>
          Designed &amp; developed by{" "}
          <a href="https://www.daydreamtechnologies.net/" target="_blank" rel="noopener noreferrer" className="mh-link-underline" style={{ color:"#3d9fd4",textDecoration:"none" }}>
            DayDream Technologies
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── PROSPECT PORTAL ──────────────────────────────────────────────────────────

export { CompanyCodeScreen, LoginScreen };
