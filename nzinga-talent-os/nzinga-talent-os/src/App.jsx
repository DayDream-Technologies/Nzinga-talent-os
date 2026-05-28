import { useState, useRef, useEffect } from "react";
import { USERS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS,
         isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED
       } from "./data/constants.js";
import { T, StageBadge, Btn } from "./components/ui.jsx";
import { CompanyCodeScreen, LoginScreen } from "./components/AuthScreens.jsx";
import { ProspectPortal } from "./components/ProspectPortal.jsx";
import { ApplicationReview } from "./components/ApplicationModals.jsx";
import { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar } from "./components/Layout.jsx";
import { Dashboard, Workspace, ApplicationsPanel } from "./components/Dashboard.jsx";
import { Pipeline, Roster } from "./components/Pipeline.jsx";
import { Tasks } from "./components/Tasks.jsx";
import { HistoryMod, Reports } from "./components/History.jsx";
import { NewEntry } from "./components/NewEntry.jsx";
import { TalentRecord } from "./components/TalentRecord.jsx";

export default function App() {
  const [screen,setScreen]=useState("company");
  const [companyCode,setCompanyCode]=useState("");
  const [user,setUser]=useState(null);
  const [talents,setTalents]=useState(TALENTS_SEED);
  const [tasks,setTasks]=useState(TASKS_SEED);
  const [history,setHistory]=useState(HISTORY_SEED);
  const [applications,setApplications]=useState(APPLICATIONS_SEED);
  const [view,setView]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [reviewingApp,setReviewingApp]=useState(null);

  // Keep refs current to avoid stale closures in callbacks
  const talentsRef=useRef(talents);
  useEffect(()=>{talentsRef.current=talents;},[talents]);
  const applicationsRef=useRef(applications);
  useEffect(()=>{applicationsRef.current=applications;},[applications]);

  function handleCode(c){setCompanyCode(c);setScreen("login");}
  function handleLogin(u){setUser(u);setScreen("app");}
  function handleLogout(u){if(u){setUser(u);}else{setUser(null);setScreen("company");setCompanyCode("");}}
  function updateTalent(u){setTalents(p=>p.map(t=>t.id===u.id?u:t));}

  // saveApp — uses functional updater pattern to avoid stale closure on applications
  function saveApp(app){
    // 1. Save the application record
    setApplications(p=>({...p,[app.id]:app}));

    // 2. Auto-create stub profile when a brand-new prospect starts an application
    //    (so they immediately appear in the OS even before submitting)
    const appAlreadyLinked=talentsRef.current.find(t=>t.application_id===app.id);
    if(!appAlreadyLinked&&(app.status==="in_progress"||app.status==="sent")){
      // Create a minimal stub so staff can see prospect in the system
      const stub={
        id:"t_stub_"+app.id,
        name:app.talent_name,
        stage:"holding_entry",
        niches:[],
        scout_id:null,
        created_at:app.created_at||new Date().toISOString(),
        social_handle:"",follower_count:"",er_pct:"",platform:"",location:"",
        pillar_scores:[0,0,0,0,0],pillar_rationales:["","","","",""],jordan_score:0,
        revenue_path:"",scout_summary:"",
        team1_notes:"",team1_decision:null,compliance:{},rep_type:"",commission:"",term_length:"",
        team2_notes:"",team2_decision:null,director_decision:null,
        portal_setup:false,technical_routing:false,warm_handoff:"",warm_handoff_confirmed:false,
        revenue_ytd:"0",revenue_projected:"0",
        last_contacted:new Date().toISOString().split("T")[0],
        application_id:app.id,application_status:"in_progress",
        uploaded_docs:{},
        audit_log:[{user:app.talent_name,role:"Prospect",action:"Started application — stub profile auto-created",stage:"holding_entry",ts:new Date().toISOString()}]
      };
      setTalents(p=>[...p,stub]);
      // Update application to link to stub
      setApplications(p=>({...p,[app.id]:{...app,talent_id:stub.id}}));
      return;
    }

    // 3. Update existing stub's application_status when app progresses
    if(appAlreadyLinked){
      setTalents(p=>p.map(t=>t.application_id===app.id?{...t,application_status:app.status}:t));
    }

    // 4. Auto-import to full pipeline when submitted AND 100% complete
    if(app.status==="submitted"&&isAppComplete(app)){
      const existingFull=talentsRef.current.find(t=>t.application_id===app.id);
      if(existingFull){
        // Upgrade the existing stub with full application data
        const fullTalent=talentFromApp({...app,id:app.id});
        const upgraded={...existingFull,...fullTalent,id:existingFull.id,application_id:app.id,application_status:"submitted"};
        setTalents(p=>p.map(t=>t.id===existingFull.id?upgraded:t));
        setHistory(p=>[{id:"h"+Date.now(),talent_id:existingFull.id,user_id:null,type:"system",text:"Application submitted and 100% complete — profile upgraded and entered main pipeline.",ts:new Date().toISOString(),flagged:false,is_document:false},...p]);
      } else {
        // No stub exists yet — create full record
        const newTalent=talentFromApp(app);
        setTalents(p=>[...p,newTalent]);
        setApplications(p=>({...p,[app.id]:{...app,talent_id:newTalent.id}}));
        setHistory(p=>[{id:"h"+Date.now(),talent_id:newTalent.id,user_id:null,type:"system",text:"Application auto-imported to Holding Entry pipeline.",ts:new Date().toISOString(),flagged:false,is_document:false},...p]);
      }
    }
  }

  function handleNewTalent(t){setTalents(p=>[...p,t]);setView("pipeline");}

  function handleSendApp(app){
    setApplications(p=>({...p,[app.id]:app}));
    if(app.talent_id){setTalents(p=>p.map(t=>t.id===app.talent_id?{...t,application_id:app.id,application_status:"sent"}:t));}
  }

  // Manual import from Applications panel (for complete submitted apps)
  function importAppToPipeline(app){
    if(!isAppComplete(app)) return;
    const existing=talentsRef.current.find(t=>t.application_id===app.id);
    if(existing){
      const upgraded={...existing,...talentFromApp(app),id:existing.id};
      setTalents(p=>p.map(t=>t.id===existing.id?upgraded:t));
    } else {
      const newTalent=talentFromApp(app);
      setTalents(p=>[...p,newTalent]);
      setApplications(p=>({...p,[app.id]:{...app,talent_id:newTalent.id}}));
    }
    setReviewingApp(null);
    setView("pipeline");
  }

  function nav(v){
    if(v==="new_entry"||v==="applications"){setView(v);}
    else if(STAGES.map(s=>"stage_"+s).includes(v)){setView("pipeline");}
    else{setView(v);}
  }

  if(screen==="company") return <CompanyCodeScreen onCode={handleCode} onProspectPortal={()=>setScreen("prospect_portal")}/>;
  if(screen==="login") return <LoginScreen companyCode={companyCode} onLogin={handleLogin} onBack={()=>setScreen("company")}/>;
  if(screen==="prospect_portal") return <ProspectPortal applications={applications} onSaveApp={saveApp} onBack={()=>setScreen("company")}/>;

  const pageTitle={dashboard:"Dashboard",workspace:"My Workspace",pipeline:"Pipeline",roster:"Full Roster",tasks:"Tasks",history:"History / Notes",reports:"Reports",new_entry:"New Holding Entry",applications:"Applications"}[view]||view;

  return(
    <div style={{ display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontSize:13,color:T.t1,background:T.pageBg }}>
      <TopNav user={user} companyCode={companyCode} onMenu={()=>setMenuOpen(true)} onLogout={handleLogout} onNav={nav} talents={talents} onSelectTalent={setSelected} tasks={tasks}/>
      <BreadcrumbBar label={pageTitle}/>
      <Scoreboard talents={talents} role={user.role}/>
      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        <Sidebar view={view} onNav={nav} talents={talents} tasks={tasks} currentUser={user}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          {view==="dashboard"    &&<Dashboard talents={talents} tasks={tasks} history={history} currentUser={user} onSelectTalent={setSelected} onNav={nav} applications={applications}/>}
          {view==="workspace"    &&<Workspace currentUser={user} onNav={nav}/>}
          {view==="pipeline"     &&<Pipeline talents={talents} onSelectTalent={setSelected} userRole={user.role}/>}
          {view==="roster"       &&<Roster talents={talents} onSelectTalent={setSelected} userRole={user.role}/>}
          {view==="tasks"        &&<Tasks tasks={tasks} setTasks={setTasks} talents={talents} currentUser={user}/>}
          {view==="history"      &&<HistoryMod history={history} setHistory={setHistory} talents={talents} currentUser={user}/>}
          {view==="reports"      &&<Reports talents={talents} userRole={user.role}/>}
          {view==="applications" &&<ApplicationsPanel applications={applications} talents={talents} onViewApp={setReviewingApp} onImportApp={importAppToPipeline}/>}
          {view==="new_entry"    &&<NewEntry currentUser={user} onSave={handleNewTalent} onCancel={()=>setView("dashboard")} onSendApp={t=>{setView("dashboard");}}/>}
        </div>
      </div>
      {menuOpen&&<FullMenu onClose={()=>setMenuOpen(false)} onNav={v=>{nav(v);setMenuOpen(false);}} userRole={user.role}/>}
      {reviewingApp&&<ApplicationReview app={reviewingApp} onClose={()=>setReviewingApp(null)} onImportToPipeline={()=>importAppToPipeline(reviewingApp)}/>}
      {selected&&<TalentRecord
        talent={talentsRef.current.find(t=>t.id===selected.id)||selected}
        talents={talents} currentUser={user}
        allHistory={history} setHistory={setHistory}
        allTasks={tasks} setTasks={setTasks}
        applications={applications}
        onClose={()=>setSelected(null)}
        onUpdate={u=>{updateTalent(u);setSelected(u);}}
        onSendApp={handleSendApp}
      />}
    </div>
  );
}
