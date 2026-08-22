// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, getVisibleSections, isFieldVisible, fieldFailsLength, fieldLengthHint, fieldFailsValidation, fieldValidationMessage, resolveFieldBound, ageFromDob, isMinor, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { supabaseConfigured } from "@/lib/supabase";
import { prospectSignup, prospectLogin, sendPasswordResetEmail, friendlyAuthError } from "@/services/auth.service";
import { checkDuplicateEmail, checkDuplicateApplicant, fetchApplicationByCode, fetchApplicationByEmail, fetchApplicationById } from "@/services/application.service";
import { inviteGuardian } from "@/services/guardian.service";
import { uploadApplicationFile } from "@/services/storage.service";
import { AgreementViewer } from "@/components/application/AgreementViewer";

function ProspectPortal({ applications, onSaveApp, onBack, companyCode = "NZG" }) {
  const [mode,setMode]=useState("landing");
  const [accessCode,setAccessCode]=useState("");
  const [foundApp,setFoundApp]=useState(null);
  const [lookupErr,setLookupErr]=useState("");
  const [newData,setNewData]=useState({talent_name:"",talent_email:"",talent_password:""});
  const [authLoading,setAuthLoading]=useState(false);
  const [apps,setApps]=useState(applications||{});
  const tenantCode=String(companyCode||"NZG").trim().toUpperCase();

  useEffect(()=>{ setApps(applications||{}); },[applications]);

  function belongsToCompany(app){
    if(!app) return false;
    const appCode=String(app.company_code||"NZG").trim().toUpperCase();
    return appCode===tenantCode;
  }

  async function lookup(){
    const code=accessCode.trim().toUpperCase();
    if(!code){setLookupErr("Enter an access code.");return;}
    setLookupErr("");
    let app=Object.values(apps).find(a=>a.access_code===code&&belongsToCompany(a));
    if(!app){
      try{ app=await fetchApplicationByCode(code, tenantCode); }catch{ app=null; }
      if(app&&belongsToCompany(app)) setApps(prev=>({...prev,[app.id]:app}));
      else app=null;
    }
    if(app){setFoundApp(app);setMode("form");}
    else setLookupErr("Access code not found. Check your invitation email.");
  }

  async function startNew(){
    if(!newData.talent_name||!newData.talent_email)return;
    setLookupErr("");setAuthLoading(true);
    const normalizedEmail=newData.talent_email.trim().toLowerCase();
    try{
      const dup=await checkDuplicateEmail(normalizedEmail, undefined, tenantCode);
      if(dup){
        setLookupErr("An application has already been submitted with this email address.");
        setAuthLoading(false);return;
      }
    }catch{ /* fall through — duplicate check is best-effort */ }

    if(supabaseConfigured&&newData.talent_password){
      const {error}=await prospectSignup(newData.talent_email.trim(),newData.talent_password,newData.talent_name);
      if(error){setLookupErr(error);setAuthLoading(false);return;}
    }

    const id="app_"+Date.now();
    const code=newData.talent_name.toUpperCase().replace(/\s+/g,"").slice(0,4)+Math.floor(1000+Math.random()*8999);
    const app={id,talent_id:null,access_code:code,company_code:tenantCode,talent_name:newData.talent_name,talent_email:newData.talent_email.trim(),status:"in_progress",created_at:new Date().toISOString(),last_saved:new Date().toISOString(),completed_sections:[],data:{}};
    try{
      await onSaveApp(app);
      setApps(prev=>({...prev,[app.id]:app}));
      setFoundApp(app);
      setMode("form");
    }catch{
      setLookupErr("Could not create your application. Check your connection and try again.");
    }finally{
      setAuthLoading(false);
    }
  }

  const [resetSent,setResetSent]=useState(false);

  async function handleResetPassword(){
    if(!newData.talent_email){setLookupErr("Enter your email address first.");return;}
    setLookupErr("");setAuthLoading(true);
    const {error}=await sendPasswordResetEmail(newData.talent_email.trim());
    setAuthLoading(false);
    if(error){setLookupErr(error);return;}
    setResetSent(true);
  }

  async function loginAndResume(){
    if(!newData.talent_email||!newData.talent_password){setLookupErr("Email and password required.");return;}
    setLookupErr("");setResetSent(false);setAuthLoading(true);
    const {profile,error}=await prospectLogin(newData.talent_email.trim(),newData.talent_password);
    if(error||!profile){setLookupErr(friendlyAuthError(error||"Login failed."));setAuthLoading(false);return;}
    let app=profile.application_id?Object.values(apps).find(a=>a.id===profile.application_id&&belongsToCompany(a)):Object.values(apps).find(a=>String(a.talent_email||"").trim().toLowerCase()===profile.email.toLowerCase()&&belongsToCompany(a));
    if(!app){
      try{
        if(profile.application_id) app=await fetchApplicationById(profile.application_id);
        if(!app) app=await fetchApplicationByEmail(profile.email, tenantCode);
        if(app&&!belongsToCompany(app)) app=null;
        if(app) setApps(prev=>({...prev,[app.id]:app}));
      }catch{ /* ignore */ }
    }
    if(app){setFoundApp(app);setMode("form");}
    else setLookupErr("No application found for this account.");
    setAuthLoading(false);
  }

  if(mode==="form"&&foundApp) return <ApplicationForm applications={apps} app={foundApp} onSave={async updated=>{await onSaveApp(updated);setApps(prev=>({...prev,[updated.id]:updated}));setFoundApp(updated);}} onExit={()=>setMode("landing")}/>;

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44,#162038)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit','Segoe UI',sans-serif",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"rgba(124,58,237,0.08)",top:-150,right:-100,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
      <div style={{ width:500,zIndex:1 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:60,height:60,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800,margin:"0 auto 12px",boxShadow:"0 8px 24px rgba(124,58,237,0.4)" }}>N</div>
          <div style={{ fontSize:28,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif" }}>Nzinga Talent</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:3 }}>Talent Application Portal</div>
        </div>

        {mode==="landing"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:4 }}>Welcome, Talent</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24,lineHeight:1.6 }}>Apply to join the Nzinga Talent Group roster, or continue a saved application.</div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <button onClick={()=>setMode("apply")} style={{ width:"100%",padding:"12px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Start New Application</button>
              {supabaseConfigured&&<button onClick={()=>setMode("login")} style={{ width:"100%",padding:"12px",background:"rgba(22,163,74,0.2)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Log In to Resume</button>}
              <button onClick={()=>setMode("lookup")} style={{ width:"100%",padding:"12px",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>Resume with Access Code</button>
            </div>
            <div style={{ marginTop:16,textAlign:"center" }}><button onClick={onBack} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>← Back to company code</button></div>
          </div>
        )}

        {mode==="apply"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <button onClick={()=>{setMode("landing");setLookupErr("");}} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>← Back</button>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:16 }}>Create Your Application</div>
            {[["Full Name","talent_name","text","Your full legal name"],["Email Address","talent_email","email","your@email.com"]].map(([l,k,type,ph])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>{l} *</div>
                <input type={type} value={newData[k]} onChange={e=>setNewData(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
              </div>
            ))}
            {supabaseConfigured&&<div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>Password {supabaseConfigured?"*":""}</div>
              <input type="password" value={newData.talent_password||""} onChange={e=>setNewData(p=>({...p,talent_password:e.target.value}))} placeholder="Create a password to save progress" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4 }}>You can log back in anytime to continue your application.</div>
            </div>}
            {lookupErr&&<div style={{ color:"#fca5a5",fontSize:12,marginBottom:8 }}>{lookupErr}</div>}
            <button onClick={startNew} disabled={authLoading} style={{ width:"100%",padding:"11px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4,opacity:authLoading?0.6:1 }}>{authLoading?"Creating account…":"Begin Application →"}</button>
          </div>
        )}

        {mode==="login"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <button onClick={()=>{setMode("landing");setLookupErr("");}} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>← Back</button>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:4 }}>Log In</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18 }}>Sign in with the email and password you used when creating your application.</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:18,lineHeight:1.45 }}>
              Already signed and onboarded?{' '}
              <a href="/talent/login" style={{ color:"rgba(255,255,255,0.75)",textDecoration:"underline" }}>
                Talent login
              </a>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>Email Address *</div>
              <input type="email" value={newData.talent_email} onChange={e=>setNewData(p=>({...p,talent_email:e.target.value}))} placeholder="your@email.com" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>Password *</div>
              <input type="password" value={newData.talent_password||""} onChange={e=>setNewData(p=>({...p,talent_password:e.target.value}))} placeholder="Your password" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" }}/>
            </div>
            {lookupErr&&<div style={{ color:"#fca5a5",fontSize:12,marginBottom:8,lineHeight:1.5 }}>{lookupErr}</div>}
            {resetSent&&<div style={{ color:"#4ade80",fontSize:12,marginBottom:8,lineHeight:1.5 }}>Password reset email sent. Check your inbox and follow the link to set a new password.</div>}
            <button onClick={loginAndResume} disabled={authLoading} style={{ width:"100%",padding:"11px",background:"linear-gradient(135deg,#15803d,#16a34a)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:authLoading?0.6:1 }}>{authLoading?"Logging in…":"Log In →"}</button>
            <div style={{ marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <button onClick={()=>setMode("lookup")} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Use access code instead</button>
              <button onClick={handleResetPassword} disabled={authLoading} style={{ background:"transparent",border:"none",color:"#60a5fa",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Forgot password?</button>
            </div>
          </div>
        )}

        {mode==="lookup"&&(
          <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"28px 32px" }}>
            <button onClick={()=>setMode("landing")} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>← Back</button>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff",marginBottom:4 }}>Resume Application</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18 }}>Enter the access code from your invitation email.</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4 }}>Access Code *</div>
            <input value={accessCode} onChange={e=>setAccessCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup()} placeholder="e.g. KAI2026" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,color:"#fff",padding:"8px 12px",fontSize:15,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit",textAlign:"center",marginBottom:6 }}/>
            {lookupErr&&<div style={{ color:"#fca5a5",fontSize:12,marginBottom:8,textAlign:"center" }}>{lookupErr}</div>}
            <button onClick={lookup} style={{ width:"100%",padding:"11px",background:T.orange,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Find My Application →</button>
            <div style={{ marginTop:10,textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)" }}>Demo code: <span style={{ color:"rgba(255,255,255,0.5)",cursor:"pointer" }} onClick={()=>setAccessCode("KAI2026")}>KAI2026</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APPLICATION FORM (multi-step, autosave, file upload, validation) ─────────
function ApplicationForm({ applications, app, onSave, onExit }) {
  const [data,setData]=useState({...app.data});
  const [currentSection,setCurrentSection]=useState(0);
  const [completedSections,setCompletedSections]=useState(new Set(app.completed_sections||[]));
  const [saveStatus,setSaveStatus]=useState("saved");
  const [submitted,setSubmitted]=useState(app.status==="submitted"||app.status==="pending_guardian");
  const [pendingGuardian,setPendingGuardian]=useState(app.status==="pending_guardian"||app.guardian_status==="pending");
  const [touched,setTouched]=useState({});
  const [jumpTarget,setJumpTarget]=useState(null);
  const [submitErr,setSubmitErr]=useState("");
  const [submitNote,setSubmitNote]=useState("");
  const [hasScrolledAgreement,setHasScrolledAgreement]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [showSubmitConfirm,setShowSubmitConfirm]=useState(false);
  const [uploading,setUploading]=useState({});
  const [uploadErr,setUploadErr]=useState({});
  const autoRef=useRef(null);
  const pendingSaveRef=useRef(null);
  const savingRef=useRef(false);
  const appRef=useRef(app);
  useEffect(()=>{ appRef.current=app; },[app]);

  const visibleSections=getVisibleSections(data);
  const total=visibleSections.length;
  const age=ageFromDob(data.dob);
  const minorApplicant=isMinor(data.dob);

  const missingMap={};
  visibleSections.forEach(s=>{ missingMap[s.id]=validateSection(s.id,data); });
  const allComplete=visibleSections.length>0&&Object.values(missingMap).every(arr=>arr.length===0);

  useEffect(()=>{
    if(jumpTarget!==null){setCurrentSection(jumpTarget);setJumpTarget(null);}
  },[jumpTarget]);

  useEffect(()=>{
    if(currentSection>=visibleSections.length) setCurrentSection(Math.max(0,visibleSections.length-1));
  },[visibleSections.length,currentSection]);

  async function flushSave(){
    if(savingRef.current) return;
    const toSave=pendingSaveRef.current;
    if(!toSave) return;
    pendingSaveRef.current=null;
    savingRef.current=true;
    setSaveStatus("saving");
    try{
      await onSave(toSave);
      savingRef.current=false;
      if(pendingSaveRef.current) return flushSave();
      setSaveStatus("saved");
    }catch(e){
      pendingSaveRef.current=toSave;
      setSaveStatus("error");
      savingRef.current=false;
      throw e;
    }
  }

  function queueSave(updated,immediate){
    pendingSaveRef.current=updated;
    setSaveStatus("unsaved");
    clearTimeout(autoRef.current);
    if(immediate) return flushSave();
    autoRef.current=setTimeout(()=>{ void flushSave().catch(()=>{}); },2000);
  }

  function updateField(fieldId,value,fileName,fileType){
    setData(prev=>{
      const next={...prev,[fieldId]:value};
      if(fileName) next[fieldId+"_name"]=fileName;
      if(fileType) next[fieldId+"_type"]=fileType;
      const updated={...appRef.current,data:next,last_saved:new Date().toISOString(),completed_sections:Array.from(completedSections)};
      queueSave(updated);
      return next;
    });
    setTouched(t=>({...t,[fieldId]:true}));
  }

  function completeSection(idx){
    const sec=visibleSections[idx];
    if(!sec) return;
    const missing=validateSection(sec.id,data);
    if(missing.length>0){setTouched(t=>{const n={...t};missing.forEach(id=>{n[id]=true;});return n;});return;}
    const nextCompleted=new Set(completedSections);
    nextCompleted.add(sec.id);
    setCompletedSections(nextCompleted);
    const updated={...appRef.current,data,last_saved:new Date().toISOString(),completed_sections:Array.from(nextCompleted)};
    void queueSave(updated,true);
    if(idx<total-1){
      setCurrentSection(idx+1);
    }else{
      setShowSubmitConfirm(true);
    }
  }

  function requestSubmit(){
    const allMissing={};
    visibleSections.forEach(s=>{allMissing[s.id]=validateSection(s.id,data);});
    const hasAny=Object.values(allMissing).some(arr=>arr.length>0);
    if(hasAny){
      const allFields={};
      Object.values(allMissing).flat().forEach(id=>{allFields[id]=true;});
      setTouched(allFields);
      setShowSubmitConfirm(false);
      const firstBad=visibleSections.findIndex(s=>(allMissing[s.id]||[]).length>0);
      if(firstBad>=0) setCurrentSection(firstBad);
      return;
    }
    setShowSubmitConfirm(true);
  }

  async function submitApp(){
    const allMissing={};
    visibleSections.forEach(s=>{allMissing[s.id]=validateSection(s.id,data);});
    const hasAny=Object.values(allMissing).some(arr=>arr.length>0);
    if(hasAny){const allFields={};Object.values(allMissing).flat().forEach(id=>{allFields[id]=true;});setTouched(allFields);return;}

    const emailToCheck=String(data.email||app.talent_email||"").trim().toLowerCase();
    try{
      const dup=await checkDuplicateApplicant({
        email:emailToCheck,
        phone:String(data.phone||""),
        first:String(data.legal_first||""),
        last:String(data.legal_last||""),
        dob:String(data.dob||""),
        excludeAppId:app.id,
        companyCode:app.company_code||"NZG",
      });
      if(dup){
        setSubmitErr("An application matching this email, phone, or name + date of birth already exists.");
        return;
      }
    }catch{ /* best-effort */ }

    setSubmitErr("");
    setSubmitNote("");
    setSubmitting(true);
    try{
      if(minorApplicant){
        const gEmail=String(data.guardian_invite_email||"").trim();
        if(!gEmail){setSubmitErr("Parent/guardian email is required for applicants under 18.");setSubmitting(false);return;}
        const draft={
          ...app,
          data,
          last_saved:new Date().toISOString(),
          completed_sections:visibleSections.map(s=>s.id),
          status:"pending_guardian",
          guardian_status:"pending",
          guardian_email:gEmail,
          submitted_at:new Date().toISOString(),
        };
        const {emailWarning}=await inviteGuardian(draft,gEmail);
        await queueSave(draft,true);
        if(emailWarning){
          setSubmitNote(`Your application is saved as Pending Parent Approval. Parent email could not be sent automatically (${emailWarning}).`);
        }
        setPendingGuardian(true);
        setSubmitted(true);
        setShowSubmitConfirm(false);
      }else{
        const updated={...appRef.current,data,status:"submitted",guardian_status:"not_required",last_saved:new Date().toISOString(),completed_sections:visibleSections.map(s=>s.id),submitted_at:new Date().toISOString()};
        await queueSave(updated,true);
        setPendingGuardian(false);
        setSubmitted(true);
        setShowSubmitConfirm(false);
      }
    }catch(e){
      setSubmitErr(e?.message||"Could not submit your application. Please try again.");
    }finally{
      setSubmitting(false);
    }
  }

  const sec=visibleSections[currentSection];
  const progress=total?Math.round((visibleSections.filter(s=>completedSections.has(s.id)&&!(missingMap[s.id]||[]).length).length/total)*100):0;

  if(submitted){return(
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit','Segoe UI',sans-serif",padding:20 }}>
      <div style={{ textAlign:"center",maxWidth:440,padding:36 }}>
        <div style={{ fontSize:26,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif",marginBottom:8 }}>
          {pendingGuardian?"Pending Parent Approval":"Application Submitted"}
        </div>
        <div style={{ fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.7,marginBottom:20 }}>
          {pendingGuardian
            ? <>Thank you, <strong style={{ color:"rgba(255,255,255,0.85)" }}>{app.talent_name}</strong>. Your application has been submitted with status <strong style={{ color:"#fbbf24" }}>Pending Parent Approval</strong>. A parent/guardian must complete verification before it can move forward.</>
            : <>Thank you, <strong style={{ color:"rgba(255,255,255,0.85)" }}>{app.talent_name}</strong>. Your application is under review as a New / Lead. A scout will reach out within 5–7 business days.</>}
        </div>
        {submitNote&&(
          <div style={{ background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.35)",borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:"#fcd34d",lineHeight:1.5,textAlign:"left" }}>
            {submitNote}
          </div>
        )}
        <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:14,marginBottom:20 }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3 }}>Your Access Code</div>
          <div style={{ fontSize:22,fontWeight:800,color:"#7c3aed",letterSpacing:"0.15em" }}>{app.access_code}</div>
        </div>
        <button onClick={onExit} style={{ background:T.orange,color:"#fff",border:"none",borderRadius:8,padding:"12px 24px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Return to Portal</button>
      </div>
    </div>
  );}

  if(!sec){
    return <div style={{ minHeight:"100vh",background:"#0f1c2e",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#0f1c2e,#1a2d44)",fontFamily:"'Outfit','Segoe UI',sans-serif",display:"flex",flexDirection:"column" }}>
      <div style={{ background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8,flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:800 }}>N</div>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Nzinga Application</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>{app.talent_name} · {app.access_code}{age!==null?` · Age ${age}`:""}{minorApplicant?" · Minor":""}</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ fontSize:11,color:saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#fbbf24":saveStatus==="error"?"#fca5a5":"rgba(255,255,255,0.35)" }}>
            {saveStatus==="saved"&&"Saved"}{saveStatus==="saving"&&"Saving…"}{saveStatus==="unsaved"&&"Unsaved"}{saveStatus==="error"&&"Save failed — retrying…"}
          </div>
          <button onClick={onExit} style={{ background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)",borderRadius:6,padding:"8px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Exit & Save</button>
        </div>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden",flexWrap:"wrap" }}>
        <div style={{ width:210,maxWidth:"100%",flex:"0 0 auto",background:"rgba(0,0,0,0.2)",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"12px 0",overflowY:"auto" }}>
          <div style={{ padding:"0 14px",marginBottom:12 }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:5,display:"flex",justifyContent:"space-between" }}><span>Progress</span><span style={{ color:"#4ade80",fontWeight:700 }}>{progress}%</span></div>
            <div style={{ height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:progress+"%",background:"linear-gradient(90deg,#7c3aed,#2563eb)",borderRadius:2,transition:"width 0.4s" }}/></div>
          </div>
          {visibleSections.map((s,i)=>{
            const done=completedSections.has(s.id);
            const active=i===currentSection;
            const hasMissing=missingMap[s.id]&&missingMap[s.id].length>0&&completedSections.has(s.id);
            return <div key={s.id} onClick={()=>setCurrentSection(i)} style={{ padding:"8px 14px",cursor:"pointer",background:active?"rgba(124,58,237,0.2)":"transparent",borderLeft:`3px solid ${active?"#7c3aed":done&&!hasMissing?"#4ade80":hasMissing?"#dc2626":"transparent"}`,display:"flex",alignItems:"center",gap:8,marginBottom:1 }}>
              <div style={{ width:20,height:20,borderRadius:"50%",background:done&&!hasMissing?"#4ade80":hasMissing?"#dc2626":active?"#7c3aed":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0 }}>{done&&!hasMissing?"✓":i+1}</div>
              <span style={{ fontSize:11,fontWeight:active?700:400,color:active?"#fff":"rgba(255,255,255,0.55)" }}>{s.label}</span>
            </div>;
          })}
          <div style={{ padding:"12px 14px 0",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:6 }}>
            {allComplete&&<button onClick={requestSubmit} disabled={submitting} style={{ width:"100%",padding:"10px",background:"linear-gradient(135deg,#15803d,#16a34a)",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:submitting?0.7:1 }}>{submitting?"Submitting…":minorApplicant?"Submit (Pending Parent Approval)":"Submit Application"}</button>}
            {!allComplete&&<div style={{ fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center",lineHeight:1.5 }}>Complete all sections to submit</div>}
          </div>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"20px 16px 32px" }}>
          <div style={{ maxWidth:640,margin:"0 auto" }}>
            {missingMap[sec.id]?.length>0&&completedSections.has(sec.id)&&(
              <div style={{ background:"rgba(220,38,38,0.12)",border:"1px solid rgba(220,38,38,0.35)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#fca5a5",fontWeight:600 }}>
                {missingMap[sec.id].length} required field{missingMap[sec.id].length>1?"s":""} missing
              </div>
            )}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}><div style={{ fontSize:22,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif" }}>{sec.label}</div></div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>Step {currentSection+1} of {total}{age!==null?` · Age ${age}`:""}</div>
            </div>

            {sec.id==="final"&&<AgreementViewer onScrollComplete={setHasScrolledAgreement} hasScrolledToBottom={hasScrolledAgreement}/>}
            {sec.id==="social"&&(
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:14,lineHeight:1.45 }}>
                Provide at least one of Instagram or Other link.
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              {sec.fields.filter(field=>isFieldVisible(field,data)).map(field=>{
                const val=data[field.id]||"";
                const req=field.required||(field.requiredIf&&(field.requiredIf.condition==="minor"?minorApplicant:field.requiredIf.equals?String(data[field.requiredIf.field]||"")===field.requiredIf.equals:false));
                const inMissing=(missingMap[sec.id]||[]).includes(field.id);
                const empty=!(typeof val==="boolean"?val:String(val).trim());
                const lengthFail=fieldFailsLength(field,data);
                const validationFail=fieldFailsValidation(field,data);
                const isErr=touched[field.id]&&inMissing;
                const isFull=field.type==="textarea"||field.type==="multicheck"||field.type==="checkbox"||field.type==="file_upload";
                const lengthHint=fieldLengthHint(field,data);
                const validationMsg=fieldValidationMessage(field,data);
                const errMsg=isErr
                  ?(lengthFail
                    ?(field.minLength&&field.maxLength
                      ?`Enter ${field.minLength}–${field.maxLength} characters`
                      :field.minLength
                        ?`Enter at least ${field.minLength} characters`
                        :`Maximum ${field.maxLength} characters`)
                    :validationFail&&validationMsg
                      ?validationMsg
                      :sec.id==="social"&&(field.id==="link_instagram"||field.id==="link_other")&&empty
                        ?"Provide Instagram or Other link"
                        :"Required")
                  :null;
                const inputStyle={background:"rgba(255,255,255,0.08)",border:`1px solid ${isErr?"#dc2626":"rgba(255,255,255,0.12)"}`,borderRadius:8,color:"#fff",padding:"12px 14px",fontSize:15,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit",minHeight:44};
                const ph=field.placeholder||field.label;
                const dateMax=resolveFieldBound(field.max);
                const dateMin=resolveFieldBound(field.min);
                return (
                  <div key={field.id} style={{ gridColumn:isFull?"1/-1":"auto" }}>
                    {field.type!=="checkbox"&&field.type!=="file_upload"&&<div style={{ fontSize:12,color:isErr?"#fca5a5":"rgba(255,255,255,0.55)",fontWeight:500,marginBottom:4 }}>{field.label}{req&&<span style={{ color:"#ef4444" }}> *</span>}{!req&&<span style={{ color:"rgba(255,255,255,0.3)",fontWeight:400 }}> (optional)</span>}</div>}
                    {field.note&&field.type!=="file_upload"&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:6,lineHeight:1.4 }}>{field.note}</div>}
                    {errMsg&&<div style={{ fontSize:11,color:"#fca5a5",marginBottom:3,fontWeight:600 }}>{errMsg}</div>}
                    {field.type==="text"&&(
                      <input
                        type="text"
                        value={val}
                        inputMode={field.inputMode}
                        pattern={field.pattern}
                        placeholder={ph}
                        onChange={e=>{updateField(field.id,e.target.value);}}
                        style={inputStyle}
                      />
                    )}
                    {field.type==="url"&&(
                      <input
                        type="url"
                        value={val}
                        inputMode={field.inputMode||"url"}
                        placeholder={ph}
                        onChange={e=>{updateField(field.id,e.target.value);}}
                        style={inputStyle}
                      />
                    )}
                    {field.type==="email"&&(
                      <input
                        type="email"
                        value={val}
                        inputMode={field.inputMode||"email"}
                        placeholder={field.placeholder||"email@example.com"}
                        onChange={e=>updateField(field.id,e.target.value)}
                        style={inputStyle}
                      />
                    )}
                    {field.type==="tel"&&(
                      <input
                        type="tel"
                        value={val}
                        inputMode={field.inputMode||"tel"}
                        pattern={field.pattern}
                        placeholder={field.placeholder||"(555) 000-0000"}
                        onChange={e=>updateField(field.id,e.target.value)}
                        style={inputStyle}
                      />
                    )}
                    {field.type==="date"&&(
                      <input
                        type="date"
                        value={val}
                        min={dateMin}
                        max={dateMax}
                        onChange={e=>updateField(field.id,e.target.value)}
                        style={inputStyle}
                      />
                    )}
                    {field.type==="textarea"&&(
                      <>
                        <textarea
                          rows={4}
                          value={val}
                          maxLength={field.maxLength}
                          onChange={e=>updateField(field.id,e.target.value)}
                          placeholder={ph}
                          style={{ ...inputStyle,resize:"vertical",minHeight:110 }}
                        />
                        {lengthHint&&(
                          <div style={{ fontSize:11,marginTop:4,color:lengthFail||(req&&String(val).trim().length<(field.minLength||0))?"#fca5a5":"rgba(255,255,255,0.35)",textAlign:"right" }}>
                            {lengthHint}
                          </div>
                        )}
                      </>
                    )}
                    {field.type==="select"&&<select value={val} onChange={e=>updateField(field.id,e.target.value)} style={{ ...inputStyle,cursor:"pointer" }}><option value="">Select…</option>{(field.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>}
                    {field.type==="multicheck"&&<div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>{(field.options||[]).map(o=>{const sel=(val||"").split(",").filter(Boolean);const checked=sel.includes(o);return <label key={o} style={{ display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"8px 12px",borderRadius:20,background:checked?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.05)",border:`1px solid ${checked?"#7c3aed":"rgba(255,255,255,0.1)"}`,fontSize:13,color:checked?"#c4b5fd":"rgba(255,255,255,0.55)" }}><input type="checkbox" checked={checked} onChange={e=>{const n=e.target.checked?[...sel,o]:sel.filter(x=>x!==o);updateField(field.id,n.join(","));}} style={{ display:"none" }}/>{o}</label>;})}
                    {isErr&&<div style={{ width:"100%",fontSize:11,color:"#fca5a5",fontWeight:600 }}>Select at least one</div>}</div>}
                    {field.type==="checkbox"&&(()=>{
                      const consentDisabled=sec.id==="final"&&!hasScrolledAgreement&&field.id.startsWith("consent_");
                      return <label style={{ display:"flex",alignItems:"flex-start",gap:10,cursor:consentDisabled?"not-allowed":"pointer",padding:"12px 14px",borderRadius:8,background:val?"rgba(22,163,74,0.15)":isErr?"rgba(220,38,38,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${val?"rgba(22,163,74,0.3)":isErr?"rgba(220,38,38,0.5)":"rgba(255,255,255,0.1)"}`,opacity:consentDisabled?0.5:1 }}>
                        <div onClick={()=>{if(!consentDisabled)updateField(field.id,val?"":"yes");}} style={{ width:22,height:22,borderRadius:4,background:val?"#16a34a":"rgba(255,255,255,0.1)",border:`2px solid ${val?"#16a34a":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:consentDisabled?"not-allowed":"pointer" }}>{val&&<span style={{ color:"#fff",fontSize:12,fontWeight:700 }}>✓</span>}</div>
                        <span style={{ fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.5 }}>{field.label}</span>
                      </label>;
                    })()}
                    {field.type==="file_upload"&&<div style={{ border:`2px dashed ${isErr?"#dc2626":val?"#4ade80":"rgba(255,255,255,0.2)"}`,borderRadius:8,padding:14,background:val?"rgba(22,163,74,0.08)":isErr?"rgba(220,38,38,0.08)":"rgba(255,255,255,0.03)",cursor:"pointer",position:"relative" }} onClick={()=>document.getElementById("fu_"+field.id)?.click()}>
                      <input id={"fu_"+field.id} type="file" accept="image/*,.pdf,video/*" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setUploading(u=>({...u,[field.id]:true}));setUploadErr(u=>({...u,[field.id]:""}));try{const {url}=await uploadApplicationFile(app.id,field.id,file);updateField(field.id,url,file.name,file.type);}catch(err){setUploadErr(u=>({...u,[field.id]:err?.message||"Upload failed. Log in and try again."}));}finally{setUploading(u=>({...u,[field.id]:false}));e.target.value="";}} style={{ display:"none" }}/>
                      <div style={{ fontSize:12,color:isErr?"#fca5a5":"rgba(255,255,255,0.55)",fontWeight:500,marginBottom:4 }}>{field.label}{req&&<span style={{ color:"#ef4444" }}> *</span>}{!req&&<span style={{ color:"rgba(255,255,255,0.3)" }}> (optional)</span>}</div>
                      {field.note&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:6 }}>{field.note}</div>}
                      {uploading[field.id]?<div style={{ fontSize:13,color:"#fbbf24",fontWeight:600 }}>Uploading…</div>:val?<div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4ade80",fontWeight:600 }}>Uploaded: {data[field.id+"_name"]||"File"}</div>:<div style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>Tap to upload · PNG, JPG, PDF, video</div>}
                      {uploadErr[field.id]&&<div style={{ fontSize:11,color:"#fca5a5",fontWeight:600,marginTop:6 }}>{uploadErr[field.id]}</div>}
                    </div>}
                  </div>
                );
              })}
            </div>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:28,paddingTop:18,borderTop:"1px solid rgba(255,255,255,0.07)",gap:10,flexWrap:"wrap" }}>
              <div>{currentSection>0&&<button onClick={()=>setCurrentSection(currentSection-1)} style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.7)",borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>← Previous</button>}</div>
              <button onClick={()=>completeSection(currentSection)} style={{ background:currentSection===total-1?"linear-gradient(135deg,#15803d,#16a34a)":"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                {currentSection<total-1?"Save & Continue →":"Complete Section"}
              </button>
            </div>
            {submitErr&&<div style={{ marginTop:12,fontSize:13,color:"#fca5a5",fontWeight:600 }}>{submitErr}</div>}
          </div>
        </div>
      </div>

      {showSubmitConfirm&&(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-confirm-title"
          style={{ position:"fixed",inset:0,zIndex:80,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Outfit','Segoe UI',sans-serif" }}
          onClick={()=>!submitting&&setShowSubmitConfirm(false)}
        >
          <div
            style={{ width:"100%",maxWidth:420,background:"linear-gradient(160deg,#152238,#1a2d44)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"28px 24px",boxShadow:"0 20px 50px rgba(0,0,0,0.45)" }}
            onClick={e=>e.stopPropagation()}
          >
            <div id="submit-confirm-title" style={{ fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Syne',sans-serif",marginBottom:8 }}>
              Ready to submit?
            </div>
            <p style={{ fontSize:14,color:"rgba(255,255,255,0.65)",lineHeight:1.55,marginBottom:22 }}>
              {minorApplicant
                ? "You’ve finished every section. Submit now to send your parent/guardian a verification link, or take more time to review your answers."
                : "You’ve finished every section. Submit now, or take more time to review your answers before sending."}
            </p>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <button
                type="button"
                disabled={submitting}
                onClick={()=>void submitApp()}
                style={{ width:"100%",padding:"12px 16px",background:"linear-gradient(135deg,#15803d,#16a34a)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.7:1 }}
              >
                {submitting?"Submitting…":minorApplicant?"Yes, submit (pending parent approval)":"Yes, submit application"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={()=>setShowSubmitConfirm(false)}
                style={{ width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.9)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,fontSize:14,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit" }}
              >
                I need more time to review
              </button>
            </div>
            {submitErr&&<div style={{ marginTop:14,fontSize:13,color:"#fca5a5",fontWeight:600 }}>{submitErr}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
// ─── SEND APPLICATION MODAL ───────────────────────────────────────────────────

export { ProspectPortal, ApplicationForm };
