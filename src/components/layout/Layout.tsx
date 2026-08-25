// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { COMPANY_CODES, USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, ROLE_ACTION_STAGE, STAGES, STAGE_LABELS, STAGE_COLORS, PILLAR_NAMES, REQUIRED_DOCS, APP_SECTIONS, validateSection, isAppComplete, talentFromApp, TASKS_SEED, HISTORY_SEED, TALENTS_SEED, APPLICATIONS_SEED, isTalentVisibleToRole, hasPermission } from "@/constants";
import { T, Av, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, TH, TD, Section, PriBadge, HIcon, FileUpload, DocViewer, IncompleteSectionAlert } from "@/components/ui-compat";
import { CompanyLogo } from "@/components/branding";
import { AGENCY_SIDEBAR, filterAgencyNav, filterAgencySidebar, canAccessAgencyPath } from "@/constants/agency-nav";
import { useCommandSearch } from "@/hooks/useCommandSearch";
import { useNotifications } from "@/hooks/useNotifications";

function TopNav({ user, companyCode, onMenu, onLogout, onNav, talents, onSelectTalent, tasks }) {
  const [profileOpen,setProfileOpen]=useState(false);
  const [q,setQ]=useState(""); const [qOpen,setQOpen]=useState(false);
  const [notifOpen,setNotifOpen]=useState(false);
  const ref=useRef();
  const results=useCommandSearch(q);
  const { items: notifs, unreadCount, readIds, markRead, markAllRead } = useNotifications();
  useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target)){setProfileOpen(false);setQOpen(false);setNotifOpen(false);}}document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return(
    <div ref={ref} style={{ background:T.navBg,borderBottom:`1px solid ${T.navBorder}`,display:"flex",alignItems:"center",height:52,padding:"0 14px",gap:8,flexShrink:0,zIndex:100,position:"relative" }}>
      <button type="button" onClick={()=>onNav("workspace")} title="My Workspace" style={{ display:"flex",alignItems:"center",gap:8,marginRight:4,background:"transparent",border:"none",cursor:"pointer",padding:0 }}>
        <CompanyLogo variant="company" companyCode={companyCode} size="sm" theme="dark" showWordmark />
      </button>
      <div style={{ display:"flex",gap:1,marginRight:6 }}>
        {[
          ["☰","Menu",onMenu],
          canAccessAgencyPath(user.role, "clients") || canAccessAgencyPath(user.role, "active-roster")
            ? ["📄","Clients",()=>onNav("clients")]
            : null,
          ["★","Workspace",()=>onNav("workspace")],
        ].filter(Boolean).map(([icon,tip,fn])=><button key={tip} onClick={fn} title={tip} className="transition-fast" style={{ background:"transparent",border:"none",color:"#94a3b8",padding:"6px 8px",borderRadius:5,cursor:"pointer",fontSize:14 }} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>{icon}</button>)}
      </div>
      <div style={{ flex:1,maxWidth:520,position:"relative" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"5px 10px" }}>
          <span style={{ color:"rgba(255,255,255,0.4)",fontSize:13 }}>⌕</span>
          <input value={q} onChange={e=>{setQ(e.target.value);setQOpen(true);}} onFocus={()=>setQOpen(true)} placeholder="Command Launch — people, apps, pages" style={{ background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:12,flex:1,fontFamily:"inherit" }}/>
          {q&&<span onClick={()=>{setQ("");setQOpen(false);}} style={{ color:"rgba(255,255,255,0.4)",cursor:"pointer" }}>✕</span>}
        </div>
        {qOpen&&results.length>0&&<div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:T.elevatedBg,border:`1px solid ${T.cardBorder}`,borderRadius:7,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200,maxHeight:360,overflowY:"auto" }}>
          {results.map(r=><div key={r.id} onClick={()=>{onNav(r.path);setQ("");setQOpen(false);}} style={{ padding:"8px 12px",cursor:"pointer",borderBottom:`1px solid ${T.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}><div><span style={{ color:r.kind==="page"?T.blue:T.purple,fontWeight:600,fontSize:12 }}>{r.label}</span><span style={{ color:T.t4,fontSize:11,marginLeft:6 }}>{r.sublabel}</span></div><span style={{ fontSize:10,color:T.t3,textTransform:"capitalize" }}>{r.kind}</span></div>)}
        </div>}
      </div>
      <div style={{ flex:1 }}/>
      <div style={{ textAlign:"right",marginRight:4 }}><div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em" }}>Company</div><div style={{ fontSize:12,color:"#fff",fontWeight:600 }}>{companyCode}</div></div>
      <div style={{ position:"relative" }}>
        <button type="button" onClick={()=>setNotifOpen(o=>!o)} title="Notifications" style={{ background:unreadCount>0?"#dc2626":"rgba(255,255,255,0.08)",border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:"#fff",fontFamily:"inherit" }}>
          <span style={{ fontSize:13 }}>🔔</span>
          {unreadCount>0&&<span style={{ fontSize:11,fontWeight:700 }}>{unreadCount}</span>}
        </button>
        {notifOpen&&(
          <div style={{ position:"absolute",right:0,top:40,width:320,maxHeight:380,overflowY:"auto",background:T.elevatedBg,border:`1px solid ${T.cardBorder}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.14)",zIndex:250 }}>
            <div style={{ padding:"10px 12px",borderBottom:`1px solid ${T.cardBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,fontWeight:700,color:T.t1 }}>Notifications</span>
              <button type="button" onClick={markAllRead} style={{ background:"none",border:"none",color:T.blue,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Mark all read</button>
            </div>
            {notifs.length===0?<div style={{ padding:16,fontSize:12,color:T.t3 }}>No notifications</div>:notifs.map(n=>(
              <div key={n.id} onClick={()=>{markRead(n.id);onNav(n.path);setNotifOpen(false);}} style={{ padding:"10px 12px",borderBottom:`1px solid ${T.cardBorder}`,cursor:"pointer",background:readIds.has(n.id)?T.elevatedBg:T.mutedBg }}>
                <div style={{ fontSize:12,fontWeight:600,color:T.t1 }}>{n.title}</div>
                <div style={{ fontSize:11,color:T.t3,marginTop:2 }}>{n.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"2px 8px" }}>
        <div style={{ fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em" }}>Role</div>
        <select value={user.role} onChange={e=>{const u=USERS.find(u=>u.role===e.target.value);if(u)onLogout(u);}} style={{ background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {USERS.map(u=><option key={u.id} value={u.role} style={{ background:"#1a2332" }}>{ROLE_LABELS[u.role]} – {u.name}</option>)}
        </select>
      </div>
      <div style={{ position:"relative" }}>
        <div onClick={()=>setProfileOpen(o=>!o)} style={{ width:32,height:32,borderRadius:"50%",background:user.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer" }}>{user.initials}</div>
        {profileOpen&&<div style={{ position:"absolute",right:0,top:38,background:T.elevatedBg,border:`1px solid ${T.cardBorder}`,borderRadius:8,width:190,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200,overflow:"hidden" }}>
          <div style={{ padding:"12px 14px",borderBottom:`1px solid ${T.cardBorder}`,background:T.mutedBg }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}><Av user={user} size={30}/><div><div style={{ fontSize:12,fontWeight:600,color:T.t1 }}>{user.name}</div><div style={{ fontSize:11,color:user.color,fontWeight:500 }}>{user.title}</div></div></div>
          </div>
          <div style={{ padding:6 }}>
            <div onClick={()=>{onNav("settings");setProfileOpen(false);}} style={{ padding:"7px 8px",cursor:"pointer",color:T.t1,fontSize:12,borderRadius:4 }}>Settings</div>
            <div onClick={()=>onLogout(null)} style={{ padding:"7px 8px",cursor:"pointer",color:T.red,fontSize:12,borderRadius:4 }}>Sign Out</div>
          </div>
        </div>}
      </div>
    </div>
  );
}

function BreadcrumbBar({ label, sub }) {
  return (
    <div
      key={label + (sub || "")}
      className="animate-fade-in"
      style={{
        background: `linear-gradient(90deg, ${T.accentBg}, #2563eb, ${T.accentBg})`,
        backgroundSize: "200% 100%",
        animation: "fadeIn 0.3s ease both, breadcrumbPulse 8s ease infinite",
        padding: "6px 18px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <span className="animate-slide-left" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>{label}</span>
      {sub && (
        <>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>›</span>
          <span className="animate-fade-in-up" style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{sub}</span>
        </>
      )}
    </div>
  );
}

function Scoreboard({ agencyStats }) {
  const tiles = agencyStats || [
    { label: "Open Tickets", value: "—", color: T.amber },
    { label: "Agency Tasks", value: "—", color: T.blue },
    { label: "Open Invoices", value: "—", color: T.purple },
    { label: "Pending Payouts", value: "—", color: T.green },
  ];
  return (
    <div style={{ display: "flex", gap: 8, padding: "8px 18px", background: T.mutedBg, borderBottom: `1px solid ${T.cardBorder}`, overflowX: "auto", flexShrink: 0 }}>
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={`scoreboard-tile animate-scale-in stagger-${Math.min(i + 1, 8)}`}
          style={{
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
            borderLeft: `3px solid ${t.color}`,
            borderRadius: 7,
            padding: "6px 14px",
            minWidth: 90,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: t.color, lineHeight: 1.2 }}>{t.value}</div>
          <div style={{ fontSize: 10, color: T.t4, marginTop: 1, whiteSpace: "nowrap", fontWeight: 500 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function FullMenu({ onClose, onNav, userRole, companyCode }) {
  const navCats = filterAgencyNav(userRole);
  const [cat, setCat] = useState(navCats[0]?.id || "talent");
  const current = navCats.find((c) => c.id === cat) || navCats[0];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "flex-start" }}>
      <div className="animate-backdrop" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div
        className="animate-menu-slide"
        style={{
          position: "relative",
          width: 860,
          margin: "48px 0 0",
          background: T.elevatedBg,
          borderRadius: "0 0 10px 0",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 48px)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.cardBorder}`, background: T.mutedBg, gap: 10 }}>
          <CompanyLogo variant="company" companyCode={companyCode} size="sm" showWordmark />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>Menu</span>
          <button onClick={() => { onNav("workspace"); onClose(); }} className="transition-fast" style={{ background: "transparent", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: 12, color: T.t2, borderRadius: 5, fontFamily: "inherit" }}>Workspace</button>
          <button onClick={() => { onNav("settings"); onClose(); }} className="transition-fast" style={{ background: "transparent", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: 12, color: T.t2, borderRadius: 5, fontFamily: "inherit" }}>Settings</button>
          {hasPermission(userRole, 'admin_access') && (
            <>
              <button onClick={() => { onNav("admin/invite"); onClose(); }} className="transition-fast" style={{ background: "transparent", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: 12, color: T.t2, borderRadius: 5, fontFamily: "inherit" }}>Invite Team Member</button>
              <button onClick={() => { onNav("admin/users"); onClose(); }} className="transition-fast" style={{ background: "transparent", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: 12, color: T.t2, borderRadius: 5, fontFamily: "inherit" }}>Admin</button>
            </>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} className="transition-fast" style={{ background: "transparent", border: "none", fontSize: 16, cursor: "pointer", color: T.t3 }}>✕</button>
        </div>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 160, background: T.mutedBg, borderRight: `1px solid ${T.cardBorder}`, padding: "8px 0", flexShrink: 0 }}>
            {navCats.map((c, i) => (
              <div
                key={c.id}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} transition-all`}
                onMouseEnter={() => setCat(c.id)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: cat === c.id ? 700 : 400,
                  color: cat === c.id ? T.blue : T.t2,
                  background: cat === c.id ? T.cardBg : "transparent",
                  borderLeft: `3px solid ${cat === c.id ? T.blue : "transparent"}`,
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
          <div key={cat} className="animate-fade-in" style={{ flex: 1, padding: "14px 18px", display: "flex", gap: 28, overflowY: "auto", flexWrap: "wrap" }}>
            {(current?.groups || []).map((group, gi) => (
              <div key={group.label} className={`animate-fade-in-up stagger-${Math.min(gi + 1, 8)}`} style={{ minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{group.label}</div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { onNav(item.path); onClose(); }}
                    className="transition-fast"
                    style={{ padding: "5px 0", fontSize: 13, color: T.blue, cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ view, onNav, userRole }) {
  const sections = filterAgencySidebar(userRole || "scout", AGENCY_SIDEBAR);
  return (
    <div style={{ width: 186, background: T.navBg, borderRight: `1px solid ${T.navBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
      {sections.map((sec, si) => (
        <div key={si} className={`animate-fade-in-up stagger-${Math.min(si + 1, 8)}`}>
          <div style={{ padding: "9px 0 2px 11px", fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{sec.label}</div>
          {sec.items.map((item) => {
            const active = view === item.path;
            return (
              <div
                key={item.id}
                onClick={() => onNav(item.path)}
                className="sidebar-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 9px 5px 11px",
                  cursor: "pointer",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  borderLeft: `2px solid ${active ? "#fff" : "transparent"}`,
                  marginBottom: 1,
                }}
              >
                <span style={{ fontSize: 11, color: active ? "#fff" : "#94a3b8", transition: "color 0.2s ease" }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar };
