// @ts-nocheck
import { useState } from "react";
import {
  USERS, ROLE_LABELS, ROLE_STAGE_ACCESS, STAGES, STAGE_LABELS, PILLAR_NAMES, REQUIRED_DOCS,
  validateSection, getVisibleSections,
  APPLICANT_STAGE_STATUSES, ROSTER_DIVISIONS, isScoutReadOnlyView,
} from "@/constants";
import { T, StageBadge, NichePill, ScoreBar, Toggle, Btn, Lbl, FInput, FTextarea, FSelect, Section, PriBadge, DocViewer } from "@/components/ui-compat";
import { SendApplicationModal } from "@/components/application/ApplicationModals";
import { ComposeEmail } from "@/components/talent/ComposeEmail";
import { PhoneActions } from "@/components/talent/PhoneActions";
import { TalentLink } from "@/components/talent/TalentLink";
import { useAuth } from "@/hooks/useAuth";

const NICHE_OPTIONS = ["Modeling", "Acting", "Sports & Athletics", "Influencing / Content Creation", "Model", "Actor", "Influencer", "Athlete"];

function TalentRecord({ talent, currentUser, allHistory, setHistory, allTasks, setTasks, onClose, onUpdate, onSendApp, applications, refreshAll }) {
  const { companyCode } = useAuth();
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(talent)));
  const [err, setErr] = useState("");
  const [showSendApp, setShowSendApp] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showDocOnly, setShowDocOnly] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [opsReturnNotes, setOpsReturnNotes] = useState("");
  const [dirty, setDirty] = useState(false);

  const role = currentUser.role;
  const tHistory = allHistory.filter((h) => h.talent_id === local.id);
  const tTasks = allTasks.filter((t) => t.related_talent === local.id);
  const scoutUser = USERS.find((u) => u.id === local.scout_id);
  const scoutReadOnly = isScoutReadOnlyView(role, local.stage, local.scout_id, currentUser.id);
  const canEdit = !scoutReadOnly;
  const canEditStage = role === "director" || role === "success_manager" || (!scoutReadOnly && ROLE_STAGE_ACCESS[role]?.includes(local.stage));
  const creatorUser = USERS.find((u) => u.id === local.created_by);
  const createdByLabel = local.created_by === null ? "Prospect" : creatorUser ? `${ROLE_LABELS[creatorUser.role]} (${creatorUser.name})` : "System";
  const linkedApp = local.application_id ? applications[local.application_id] : null;
  const profilePhoto = (local.uploaded_docs || {}).profile_photo;

  const appMissingMap = {};
  if (linkedApp) {
    getVisibleSections(linkedApp.data || {}).forEach((s) => {
      appMissingMap[s.id] = validateSection(s.id, linkedApp.data || {});
    });
  }
  const appHasIncomplete = linkedApp && Object.values(appMissingMap).some((arr) => arr.length > 0);

  function p(f, v) {
    setLocal((x) => ({ ...x, [f]: v }));
    setDirty(true);
  }
  function pc(f, v) {
    setLocal((x) => ({ ...x, compliance: { ...x.compliance, [f]: v } }));
    setDirty(true);
  }
  function pp(i, v) {
    const s = [...local.pillar_scores];
    s[i] = parseFloat(v) || 0;
    const avg = s.reduce((a, b) => a + b, 0) / 5;
    setLocal((x) => ({ ...x, pillar_scores: s, jordan_score: parseFloat(avg.toFixed(2)) }));
    setDirty(true);
  }
  function pr(i, v) {
    const r = [...local.pillar_rationales];
    r[i] = v;
    setLocal((x) => ({ ...x, pillar_rationales: r }));
    setDirty(true);
  }
  function auditLog(action, stage) {
    return [...local.audit_log, { user: currentUser.name, role: ROLE_LABELS[role], action, stage, ts: new Date().toISOString() }];
  }
  function save(u) {
    setDirty(false);
    onUpdate(u);
  }
  function saveProfile() {
    setErr("");
    save({ ...local, audit_log: dirty ? auditLog("Updated talent profile", local.stage) : local.audit_log });
  }

  function postNote() {
    if (!newNote.trim()) return;
    setHistory((prev) => [
      {
        id: "h" + Date.now(),
        talent_id: local.id,
        user_id: currentUser.id,
        type: noteType,
        text: newNote,
        ts: new Date().toISOString(),
        flagged: Boolean(followUpNeeded),
        is_document: noteType === "document",
        follow_up_needed: Boolean(followUpNeeded),
        follow_up_date: followUpNeeded && followUpDate ? followUpDate : null,
        method: noteType,
        staff_name: currentUser.name,
      },
      ...prev,
    ]);
    if (followUpNeeded && followUpDate) {
      const next = { ...local, next_callback_date: followUpDate, last_contacted: new Date().toISOString().split("T")[0] };
      setLocal(next);
      onUpdate(next);
    }
    setNewNote("");
    setFollowUpNeeded(false);
    setFollowUpDate("");
  }

  function uploadDocToProfile(docId, data, name, type) {
    const updDocs = {
      ...(local.uploaded_docs || {}),
      [docId]: {
        name,
        data,
        type,
        doc_type: docId,
        uploaded_at: new Date().toISOString(),
        uploaded_by: currentUser.name,
        status: "received",
      },
    };
    const compKey = { gov_id: "gov_id", tax_doc: "tax_doc", banking: "banking", proof_income: "proof_income" }[docId] || docId;
    const updated = { ...local, uploaded_docs: updDocs, compliance: { ...local.compliance, [compKey]: true } };
    setLocal(updated);
    setHistory((prev) => [
      {
        id: "h" + Date.now(),
        talent_id: local.id,
        user_id: currentUser.id,
        type: "document",
        text: `Document uploaded: ${name}`,
        ts: new Date().toISOString(),
        flagged: false,
        is_document: true,
        doc_name: name,
        doc_data: data,
        doc_type: type,
        staff_name: currentUser.name,
      },
      ...prev,
    ]);
    onUpdate(updated);
    setDirty(false);
  }

  function onProfilePhoto(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => uploadDocToProfile("profile_photo", ev.target.result, file.name, file.type);
    r.readAsDataURL(file);
  }

  function scoutSubmit() {
    for (let i = 0; i < 5; i++) {
      if (!local.pillar_rationales[i]) { setErr("All 5 pillar rationales required."); return; }
      if (local.pillar_scores[i] < 3) { setErr(`Pillar ${i + 1} (${PILLAR_NAMES[i]}) must be at least 3.`); return; }
    }
    if (local.jordan_score < 3.5) { setErr("Jordan Score must be at least 3.5."); return; }
    if (!local.revenue_path || !local.scout_summary || !local.niches.length) { setErr("Complete scout summary, revenue path, and niches."); return; }
    setErr("");
    save({ ...local, stage: "team1_review", applicant_stage_status: "Qualified", audit_log: auditLog("Submitted Client Packet → Client Packet Review", "team1_review") });
    onClose();
  }
  function scoutArchive() { save({ ...local, stage: "not_viable", audit_log: auditLog("Marked Declined", "not_viable") }); onClose(); }
  function markLost() { save({ ...local, stage: "not_viable", audit_log: auditLog("Marked Withdrawn / Lost", "not_viable") }); onClose(); }
  function t1(d) {
    if (d === "approved") {
      for (let i = 0; i < 5; i++) { if (local.pillar_scores[i] < 3) { setErr(`Pillar ${i + 1} below minimum 3.`); return; } }
      if (local.jordan_score < 3.5) { setErr(`Jordan Score ${local.jordan_score.toFixed(2)} is below 3.5 threshold.`); return; }
      save({ ...local, stage: "ops_processing", team1_decision: "approved", audit_log: auditLog("Approved for Success Manager Validation", "team1_review") }); onClose();
    } else if (d === "revision") {
      if (!local.team1_notes) { setErr("Correction notes required for revision."); return; }
      save({ ...local, stage: "scout_complete", team1_decision: "revision", audit_log: auditLog("Returned for More Information", "team1_review") });
      setTasks((prev) => [{ id: "tk_" + Date.now(), title: "Revision Required: " + local.name, assigned_to: local.scout_id || "u1", related_talent: local.id, due: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), priority: "high", status: "open", created_by: currentUser.id, created_at: new Date().toISOString(), notes: local.team1_notes }, ...prev]);
      onClose();
    } else { save({ ...local, stage: "archived", team1_decision: "rejected", audit_log: auditLog("Rejected at Client Packet Review", "team1_review") }); onClose(); }
  }
  function ops() {
    if (Object.values(local.compliance || {}).filter(Boolean).length < 6) { setErr("At least 6/8 compliance items must be verified."); return; }
    if (!local.rep_type || !local.commission || !local.term_length) { setErr("Complete all Framework fields first."); return; }
    save({ ...local, stage: "team2_audit", audit_log: auditLog("Compliance verified → Contract Pending", "ops_processing") }); onClose();
  }
  function opsReturnTeam1() {
    if (!opsReturnNotes.trim()) { setErr("Return notes required for Team 1 Lead."); return; }
    setErr("");
    save({ ...local, stage: "team1_review", team1_notes: opsReturnNotes, audit_log: auditLog("Returned to Client Packet Review", "ops_processing") });
    const t1User = USERS.find((u) => u.role === "team1_lead");
    setTasks((prev) => [{ id: "tk_" + Date.now(), title: "Ops Return — Review: " + local.name, assigned_to: t1User ? t1User.id : "u2", related_talent: local.id, due: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), priority: "high", status: "open", created_by: currentUser.id, created_at: new Date().toISOString(), notes: opsReturnNotes }, ...prev]);
    onClose();
  }
  function t2(d) {
    if (d === "approved") { save({ ...local, stage: "executive_review", team2_decision: "approved", audit_log: auditLog("Approved for Director Review", "team2_audit") }); onClose(); }
    else if (d === "returned") {
      save({ ...local, stage: "ops_processing", team2_decision: "returned", audit_log: auditLog("Returned to Success Manager Validation", "team2_audit") });
      const opsUser = USERS.find((u) => u.role === "ops_specialist");
      setTasks((prev) => [{ id: "tk_" + Date.now(), title: "Returned from Audit: " + local.name, assigned_to: opsUser ? opsUser.id : "u3", related_talent: local.id, due: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), priority: "high", status: "open", created_by: currentUser.id, created_at: new Date().toISOString(), notes: local.team2_notes || "Returned from audit." }, ...prev]);
      onClose();
    } else { save({ ...local, stage: "archived", team2_decision: "rejected", audit_log: auditLog("Rejected at Contract Pending", "team2_audit") }); onClose(); }
  }
  function dir(d) {
    if (d === "approved") save({ ...local, stage: "signed_onboarding", director_decision: "approved", audit_log: auditLog("Approved – Active Client", "executive_review") });
    else if (d === "hold") save({ ...local, director_decision: "hold", audit_log: auditLog("Decision on Hold", "executive_review") });
    else save({ ...local, stage: "archived", director_decision: "rejected", audit_log: auditLog("Rejected by Director", "executive_review") });
    onClose();
  }
  function success() {
    if (!local.warm_handoff) { setErr("Warm hand-off name / division required."); return; }
    save({ ...local, warm_handoff_confirmed: true, audit_log: auditLog("Warm hand-off confirmed: " + local.warm_handoff, "signed_onboarding") }); onClose();
  }

  const compFields = [["legal_name", "Full Legal Name"], ["gov_id", "Government ID"], ["dob", "Date of Birth"], ["address", "Physical Address"], ["email_phone", "Email / Phone"], ["tax_doc", "Tax Documentation (W-9)"], ["banking", "Banking Information"], ["social_ownership", "Social Account Ownership"]];
  const filtHistory = showDocOnly ? tHistory.filter((h) => h.is_document) : tHistory;
  const canUploadDocs = role === "ops_specialist" || role === "scout" || role === "director";
  const openFollowUps = tHistory.filter((h) => h.follow_up_needed);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "16px 0", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      {showSendApp && (
        <SendApplicationModal
          talent={local}
          companyCode={companyCode || "NZG"}
          onSend={(app) => { onSendApp(app); setLocal((x) => ({ ...x, application_id: app.id, application_status: "sent" })); setShowSendApp(false); }}
          onClose={() => setShowSendApp(false)}
        />
      )}
      {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

      <div style={{ width: 980, maxWidth: "96vw", background: T.pageBg, borderRadius: 12, overflow: "hidden", flexShrink: 0, boxShadow: "0 12px 48px rgba(0,0,0,0.18)", marginBottom: 24 }}>
        {/* Sticky header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                {profilePhoto?.data ? (
                  <img src={profilePhoto.data} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${T.purple}44` }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.purple + "22", border: `2px solid ${T.purple}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: T.purple, fontFamily: "'Syne', sans-serif" }}>
                    {local.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                {canEdit && (
                  <label style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: "50%", background: T.blue, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    +
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onProfilePhoto(e.target.files?.[0])} />
                  </label>
                )}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {canEdit ? (
                    <FInput value={local.name} onChange={(v) => p("name", v)} style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Syne', Outfit, sans-serif", minWidth: 180 }} />
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: 18, color: T.t1, fontFamily: "'Syne', Outfit, sans-serif" }}>{local.name}</span>
                  )}
                  {local.account_number && (
                    <TalentLink accountId={local.account_number} name={local.name}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace,monospace", padding: "2px 8px", borderRadius: 6, background: "#eff6ff", color: T.blue }}>{local.account_number}</span>
                    </TalentLink>
                  )}
                  <StageBadge stage={local.stage} />
                  {local.niches.map((n) => <NichePill key={n} n={n} />)}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", fontSize: 12, color: T.t3 }}>
                  {scoutUser && <span>Scout: {scoutUser.name}</span>}
                  <span>{local.location || "No location"}</span>
                  {local.applicant_stage_status && <span>· {local.applicant_stage_status}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {local.jordan_score > 0 && (
                <div style={{ background: local.jordan_score >= 3.5 ? T.greenL : T.redL, borderRadius: 8, padding: "5px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: local.jordan_score >= 3.5 ? T.green : T.red }}>{local.jordan_score.toFixed(2)}</div>
                  <div style={{ fontSize: 9, color: T.t4, textTransform: "uppercase" }}>Jordan</div>
                </div>
              )}
              {canEdit && <Btn variant="primary" sm onClick={saveProfile}>{dirty ? "Save changes" : "Saved"}</Btn>}
              {role === "scout" && !scoutReadOnly && <Btn variant="orange" sm onClick={() => setShowSendApp(true)}>Send App</Btn>}
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid #e5e7eb", borderRadius: 6, color: T.t3, cursor: "pointer", padding: "5px 10px", fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
          </div>
        </div>

        {scoutReadOnly && (
          <div style={{ background: T.blueL, borderBottom: `1px solid ${T.blue}33`, padding: "8px 16px", fontSize: 12, color: T.blue }}>
            <strong>Read-only view</strong> — This talent has moved beyond your action stage.
          </div>
        )}
        {err && (
          <div style={{ background: T.redL, borderBottom: `1px solid ${T.red}44`, padding: "8px 16px", color: T.red, fontSize: 12 }}>⚠ {err}</div>
        )}
        {openFollowUps.length > 0 && (
          <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "8px 16px", fontSize: 12, color: "#92400e" }}>
            {openFollowUps.length} open follow-up{openFollowUps.length > 1 ? "s" : ""} logged
          </div>
        )}

        <div style={{ padding: 16, maxHeight: "78vh", overflowY: "auto", display: "grid", gap: 12 }}>
          {/* Profile + status + contact */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Section title="Contact" accent={T.blue}>
              <Lbl>Phone</Lbl>
              <FInput value={local.phone || ""} onChange={(v) => canEdit && p("phone", v)} disabled={!canEdit} placeholder="(555) 000-0000" />
              <Lbl style={{ marginTop: 6 }}>Email</Lbl>
              <FInput value={local.email || ""} onChange={(v) => canEdit && p("email", v)} disabled={!canEdit} placeholder="talent@email.com" />
              <Lbl style={{ marginTop: 6 }}>Secondary phone</Lbl>
              <FInput value={local.secondary_phone || ""} onChange={(v) => canEdit && p("secondary_phone", v)} disabled={!canEdit} />
              <Lbl style={{ marginTop: 6 }}>Preferred contact</Lbl>
              <FInput value={local.preferred_contact || ""} onChange={(v) => canEdit && p("preferred_contact", v)} disabled={!canEdit} placeholder="Email / Phone / SMS" />
              <Lbl style={{ marginTop: 6 }}>Location</Lbl>
              <FInput value={local.location || ""} onChange={(v) => canEdit && p("location", v)} disabled={!canEdit} placeholder="City, State" />
              {local.phone && (
                <div style={{ marginTop: 10 }}>
                  <PhoneActions talentId={local.id} phone={local.phone} talentName={local.name} onSuccess={refreshAll} />
                </div>
              )}
            </Section>

            <Section title="Status & Division" accent={T.purple}>
              <Lbl>Pipeline stage</Lbl>
              {canEditStage ? (
                <FSelect
                  value={local.stage}
                  onChange={(v) => p("stage", v)}
                  options={STAGES.map((s) => ({ v: s, l: STAGE_LABELS[s] }))}
                  style={{ width: "100%" }}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, padding: "6px 0" }}>{STAGE_LABELS[local.stage]}</div>
              )}
              <Lbl style={{ marginTop: 6 }}>Applicant sub-status</Lbl>
              {canEdit ? (
                <FSelect
                  value={local.applicant_stage_status || ""}
                  onChange={(v) => p("applicant_stage_status", v)}
                  options={[{ v: "", l: "Select…" }, ...APPLICANT_STAGE_STATUSES]}
                  style={{ width: "100%" }}
                />
              ) : (
                <div style={{ fontSize: 13, padding: "6px 0" }}>{local.applicant_stage_status || "—"}</div>
              )}
              <Lbl style={{ marginTop: 6 }}>Division</Lbl>
              {canEdit ? (
                <FSelect
                  value={local.roster_division || ""}
                  onChange={(v) => p("roster_division", v)}
                  options={[{ v: "", l: "Select…" }, ...ROSTER_DIVISIONS]}
                  style={{ width: "100%" }}
                />
              ) : (
                <div style={{ fontSize: 13, padding: "6px 0" }}>{local.roster_division || "—"}</div>
              )}
              <Lbl style={{ marginTop: 6 }}>Specialization</Lbl>
              <FInput value={local.secondary_specialization || ""} onChange={(v) => canEdit && p("secondary_specialization", v)} disabled={!canEdit} />
              <Lbl style={{ marginTop: 6 }}>Niches</Lbl>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {NICHE_OPTIONS.map((n) => (
                  <label key={n} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: canEdit ? "pointer" : "default", color: local.niches.includes(n) ? T.purple : T.t3 }}>
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={local.niches.includes(n)}
                      onChange={(e) => p("niches", e.target.checked ? [...local.niches, n] : local.niches.filter((x) => x !== n))}
                    />
                    {n}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.t4 }}>
                Scout: {scoutUser?.name || "—"} · Created by {createdByLabel}
              </div>
            </Section>
          </div>

          {/* Social links */}
          <Section title="Social media & links" accent={T.cyan}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Lbl>Primary handle</Lbl>
                <FInput value={local.social_handle || ""} onChange={(v) => canEdit && p("social_handle", v)} disabled={!canEdit} placeholder="@handle" />
              </div>
              <div>
                <Lbl>Primary platform</Lbl>
                <FInput value={local.platform || ""} onChange={(v) => canEdit && p("platform", v)} disabled={!canEdit} placeholder="Instagram / TikTok" />
              </div>
              <div>
                <Lbl>Followers</Lbl>
                <FInput value={local.follower_count || ""} onChange={(v) => canEdit && p("follower_count", v)} disabled={!canEdit} />
              </div>
              <div>
                <Lbl>Engagement %</Lbl>
                <FInput value={local.er_pct || ""} onChange={(v) => canEdit && p("er_pct", v)} disabled={!canEdit} />
              </div>
              <div>
                <Lbl>Instagram</Lbl>
                <FInput value={local.link_instagram || ""} onChange={(v) => canEdit && p("link_instagram", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
              <div>
                <Lbl>TikTok</Lbl>
                <FInput value={local.link_tiktok || ""} onChange={(v) => canEdit && p("link_tiktok", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
              <div>
                <Lbl>YouTube</Lbl>
                <FInput value={local.link_youtube || ""} onChange={(v) => canEdit && p("link_youtube", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
              <div>
                <Lbl>Website</Lbl>
                <FInput value={local.link_website || ""} onChange={(v) => canEdit && p("link_website", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
              <div>
                <Lbl>Portfolio</Lbl>
                <FInput value={local.link_portfolio || ""} onChange={(v) => canEdit && p("link_portfolio", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
              <div>
                <Lbl>Other link</Lbl>
                <FInput value={local.link_other || ""} onChange={(v) => canEdit && p("link_other", v)} disabled={!canEdit} placeholder="https://…" />
              </div>
            </div>
          </Section>

          {/* Revenue */}
          <Section title="Revenue" accent={T.green}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <Lbl>YTD revenue</Lbl>
                <FInput value={local.revenue_ytd || ""} onChange={(v) => canEdit && p("revenue_ytd", v)} disabled={!canEdit} placeholder="0" />
              </div>
              <div>
                <Lbl>Projected</Lbl>
                <FInput value={local.revenue_projected || ""} onChange={(v) => canEdit && p("revenue_projected", v)} disabled={!canEdit} placeholder="0" />
              </div>
              <div>
                <Lbl>Prior annual / day rate</Lbl>
                <FInput value={local.min_day_rate || local.prior_annual_revenue || ""} onChange={(v) => canEdit && p("min_day_rate", v)} disabled={!canEdit} />
              </div>
            </div>
            <Lbl>90-day revenue path</Lbl>
            <FTextarea value={local.revenue_path || ""} onChange={(v) => canEdit && p("revenue_path", v)} disabled={!canEdit} rows={3} placeholder="Describe near-term monetization plan…" />
          </Section>

          {/* Jordan score */}
          <Section title="Jordan Score" accent={local.jordan_score >= 3.5 ? T.green : T.purple}>
            {canEdit && (role === "scout" || role === "director" || role === "team1_lead") ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <Lbl>Scout summary</Lbl>
                    <FTextarea value={local.scout_summary || ""} onChange={(v) => p("scout_summary", v)} rows={3} />
                  </div>
                  <div>
                    <Lbl>Scout notes</Lbl>
                    <FTextarea value={local.scout_notes || ""} onChange={(v) => p("scout_notes", v)} rows={3} />
                  </div>
                </div>
                {PILLAR_NAMES.map((name, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: 10, background: "#fafbfc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Pillar {i + 1}: {name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ flex: 1 }}><ScoreBar score={local.pillar_scores[i]} /></div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            onClick={() => pp(i, n)}
                            style={{
                              width: 28, height: 28, borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: local.pillar_scores[i] >= n ? (n >= 3 ? T.greenL : T.redL) : "#f3f4f6",
                              border: `1px solid ${local.pillar_scores[i] >= n ? (n >= 3 ? T.green : T.red) : "#e5e7eb"}`,
                              color: local.pillar_scores[i] >= n ? (n >= 3 ? T.green : T.red) : T.t4,
                            }}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                    <FTextarea value={local.pillar_rationales[i] || ""} onChange={(v) => pr(i, v)} placeholder={`Rationale for ${name}…`} rows={2} />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: local.jordan_score >= 3.5 ? T.green : local.jordan_score > 0 ? T.red : T.t4, fontFamily: "'Syne', sans-serif" }}>
                    {local.jordan_score.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, color: local.jordan_score >= 3.5 ? T.green : T.red, fontWeight: 600 }}>
                    {local.jordan_score >= 3.5 ? "Meets 3.5 threshold" : local.jordan_score > 0 ? "Below 3.5 threshold" : "Enter pillar scores"}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {local.jordan_score > 0 ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{local.jordan_score.toFixed(2)}</div>
                    {PILLAR_NAMES.map((n, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 10, color: T.t4 }}>{n}</div>
                        <ScoreBar score={local.pillar_scores[i]} />
                        {local.pillar_rationales[i] && <p style={{ fontSize: 11, color: T.t3, fontStyle: "italic", margin: "2px 0 0" }}>{local.pillar_rationales[i]}</p>}
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: T.t4, fontSize: 12 }}>Not yet scored.</div>
                )}
              </div>
            )}
          </Section>

          {/* Notes */}
          <Section title="Notes & communication" accent={T.amber}>
            <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
              <FSelect value={noteType} onChange={setNoteType} options={["note", "call", "email", "sms", "task", "document"]} style={{ width: 110 }} />
              <div style={{ flex: 1 }}>
                <FTextarea value={newNote} onChange={setNewNote} placeholder="Log a note, call summary, or follow-up…" rows={2} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.t2 }}>
                <input type="checkbox" checked={followUpNeeded} onChange={(e) => setFollowUpNeeded(e.target.checked)} /> Follow-up needed
              </label>
              {followUpNeeded && <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }} />}
              <Btn sm variant="primary" onClick={postNote}>Post note</Btn>
            </div>
            <ComposeEmail
              talentName={local.name}
              talentEmail={local.email || ""}
              talentId={local.id}
              onEmailSent={({ subject, to }) => {
                setHistory((prev) => [{ id: "h" + Date.now(), talent_id: local.id, user_id: currentUser.id, type: "email", text: `Email sent: "${subject}" to ${to}`, ts: new Date().toISOString(), flagged: false, is_document: false, email_subject: subject, email_to: to }, ...prev]);
              }}
            />
            <div style={{ display: "flex", gap: 4, margin: "10px 0 8px", flexWrap: "wrap" }}>
              {[["all", "All"], ["note", "Notes"], ["call", "Calls"], ["email", "Email"], ["document", "Docs"]].map(([val, label]) => (
                <button key={val} onClick={() => setHistoryFilter(val)} style={{ padding: "3px 10px", borderRadius: 12, border: `1px solid ${historyFilter === val ? T.blue + "88" : "#e5e7eb"}`, background: historyFilter === val ? T.blueL : "#fff", color: historyFilter === val ? T.blue : T.t3, fontSize: 11, fontWeight: historyFilter === val ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
              ))}
              <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.t3 }}>
                <input type="checkbox" checked={showDocOnly} onChange={(e) => setShowDocOnly(e.target.checked)} /> Docs only
              </label>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
              {(historyFilter === "all" ? filtHistory : filtHistory.filter((h) => h.type === historyFilter)).length === 0 ? (
                <div style={{ padding: 14, color: T.t4, fontSize: 12, textAlign: "center" }}>No history yet.</div>
              ) : (
                (historyFilter === "all" ? filtHistory : filtHistory.filter((h) => h.type === historyFilter)).map((h) => {
                  const u = USERS.find((x) => x.id === h.user_id);
                  return (
                    <div key={h.id} style={{ display: "grid", gridTemplateColumns: "88px 56px 1fr", padding: "7px 10px", borderBottom: "1px solid #f5f5f5", gap: 6 }}>
                      <span style={{ fontSize: 11, color: T.t3 }}>{new Date(h.ts).toLocaleDateString()}</span>
                      <span style={{ fontSize: 10, color: T.t3, textTransform: "capitalize" }}>{h.type}</span>
                      <div>
                        <div style={{ fontSize: 12, color: T.t1 }}>{h.text}</div>
                        <div style={{ fontSize: 10, color: T.t4 }}>{u?.name || h.staff_name || "System"}</div>
                        {h.follow_up_needed && <span style={{ fontSize: 10, color: "#b45309", background: "#fffbeb", padding: "0 5px", borderRadius: 4 }}>Follow-up{h.follow_up_date ? `: ${h.follow_up_date}` : ""}</span>}
                        {h.is_document && h.doc_data && (
                          <button onClick={() => setViewingDoc({ name: h.doc_name || "Document", data: h.doc_data, type: h.doc_type || "image/jpeg" })} style={{ marginLeft: 6, background: T.green, color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Section>

          {/* Documents */}
          <Section title="Documents" accent={T.blue}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {REQUIRED_DOCS.map((doc) => {
                const staffDoc = (local.uploaded_docs || {})[doc.id];
                const appDocData = linkedApp?.data?.["doc_" + doc.id];
                const appDoc = appDocData ? { data: appDocData, name: linkedApp.data["doc_" + doc.id + "_name"] || doc.label, type: linkedApp.data["doc_" + doc.id + "_type"] || "image/jpeg" } : null;
                const docData = staffDoc || appDoc;
                return (
                  <div key={doc.id} style={{ border: `1px solid ${docData ? "#86efac" : "#fca5a5"}`, borderRadius: 8, padding: 12, background: docData ? "#f0fdf4" : "#fff5f5" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{doc.label}</div>
                    {docData ? (
                      <button onClick={() => setViewingDoc({ name: docData.name || doc.label, data: docData.data, type: docData.type || "image/jpeg" })} style={{ background: T.green, color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%", marginBottom: canUploadDocs ? 6 : 0 }}>View</button>
                    ) : (
                      <div style={{ fontSize: 11, color: T.red, marginBottom: 6 }}>Not uploaded</div>
                    )}
                    {canUploadDocs && (
                      <label style={{ display: "block", border: "1px dashed #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 11, color: T.t3, textAlign: "center", cursor: "pointer" }}>
                        {docData ? "Replace" : "Upload"}
                        <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = (ev) => uploadDocToProfile(doc.id, ev.target.result, file.name, file.type); r.readAsDataURL(file); }} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Role actions — inline, no tabs */}
          {role === "scout" && (local.stage === "holding_entry" || local.stage === "scout_complete") && !scoutReadOnly && (
            <Section title="Scout actions" accent={T.orange}>
              <div style={{ fontSize: 11, color: "#9a3412", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "8px 10px", marginBottom: 10, lineHeight: 1.45 }}>
                SOP: Do not promise representation, guarantee bookings, offer contracts, or negotiate terms.
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <Btn variant="primary" onClick={scoutSubmit} disabled={local.jordan_score < 3.5 || local.pillar_scores.some((s) => s < 3)}>Submit Client Packet →</Btn>
                <Btn variant="ghost" sm onClick={() => { p("applicant_stage_status", "Under Review"); onUpdate({ ...local, applicant_stage_status: "Under Review" }); }}>Mark Under Review</Btn>
                <Btn variant="danger" sm onClick={scoutArchive}>Declined</Btn>
                <Btn variant="warning" sm onClick={markLost}>Withdrawn / Lost</Btn>
              </div>
            </Section>
          )}

          {role === "team1_lead" && local.stage === "team1_review" && (
            <Section title="Client Packet Review decision" accent={T.amber}>
              <Lbl>Correction notes (required for revision)</Lbl>
              <FTextarea value={local.team1_notes} onChange={(v) => p("team1_notes", v)} rows={2} />
              <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                <Btn variant="success" onClick={() => t1("approved")}>Approve →</Btn>
                <Btn variant="warning" onClick={() => t1("revision")}>Return for more info</Btn>
                <Btn variant="danger" onClick={() => t1("rejected")}>Reject</Btn>
              </div>
            </Section>
          )}

          {(role === "ops_specialist" || role === "team2_lead" || role === "director") && (
            <Section title="Compliance & contract framework" accent={T.green}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {compFields.map(([key, label]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: 12 }}>{label}</span>
                      <Toggle on={!!local.compliance?.[key]} onChange={(v) => role === "ops_specialist" && pc(key, v)} disabled={role !== "ops_specialist"} />
                    </div>
                  ))}
                </div>
                <div>
                  {[["Rep Type", "rep_type"], ["Commission %", "commission"], ["Term Length", "term_length"]].map(([label, field]) => (
                    <div key={field} style={{ marginBottom: 8 }}>
                      <Lbl>{label}</Lbl>
                      {role === "ops_specialist" && local.stage === "ops_processing" ? (
                        field === "rep_type" ? (
                          <FSelect value={local[field]} onChange={(v) => p(field, v)} options={[{ v: "", l: "Select…" }, "Exclusive", "Non-Exclusive", "Open to Discussion"]} style={{ width: "100%" }} />
                        ) : (
                          <FInput value={local[field]} onChange={(v) => p(field, v)} />
                        )
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{local[field] ? local[field] + (field === "commission" ? "%" : "") : "—"}</div>
                      )}
                    </div>
                  ))}
                  {role === "ops_specialist" && local.stage === "ops_processing" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      <Btn variant="success" onClick={ops}>Advance to Contract Pending →</Btn>
                      <FTextarea value={opsReturnNotes} onChange={setOpsReturnNotes} rows={2} placeholder="Return notes for Client Packet Review…" />
                      <Btn variant="warning" sm onClick={opsReturnTeam1}>Return to Client Packet Review</Btn>
                    </div>
                  )}
                  {role === "team2_lead" && local.stage === "team2_audit" && (
                    <div style={{ marginTop: 8 }}>
                      <Lbl>Audit notes</Lbl>
                      <FTextarea value={local.team2_notes} onChange={(v) => p("team2_notes", v)} rows={2} />
                      <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                        <Btn variant="success" onClick={() => t2("approved")}>Approve for Director</Btn>
                        <Btn variant="warning" onClick={() => t2("returned")}>Return</Btn>
                        <Btn variant="danger" onClick={() => t2("rejected")}>Reject</Btn>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {role === "director" && local.stage === "executive_review" && (
            <Section title="Director decision" accent={T.purple}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="success" onClick={() => dir("approved")}>Approve — Active Client</Btn>
                <Btn variant="ghost" onClick={() => dir("hold")}>Hold</Btn>
                <Btn variant="danger" onClick={() => dir("rejected")}>Reject</Btn>
              </div>
            </Section>
          )}

          {(role === "success_manager" || local.stage === "signed_onboarding") && (
            <Section title="Onboarding" accent={T.green}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {[["portal_setup", "Client Portal Setup"], ["technical_routing", "Technical Routing"]].map(([key, label]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: 12 }}>{label}</span>
                      <Toggle on={!!local[key]} onChange={(v) => role === "success_manager" && p(key, v)} disabled={role !== "success_manager"} />
                    </div>
                  ))}
                </div>
                <div>
                  <Lbl>Warm hand-off</Lbl>
                  <FInput value={local.warm_handoff || ""} onChange={(v) => role === "success_manager" && p("warm_handoff", v)} disabled={role !== "success_manager"} placeholder="Agent — Division" />
                  {role === "success_manager" && !local.warm_handoff_confirmed && (
                    <div style={{ marginTop: 8 }}><Btn variant="success" onClick={success}>Confirm hand-off</Btn></div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Tasks + audit compact */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Section title="Tasks" accent={T.amber}>
              {tTasks.length === 0 ? (
                <div style={{ color: T.t4, fontSize: 12 }}>No linked tasks.</div>
              ) : (
                tTasks.slice(0, 6).map((tk) => (
                  <div key={tk.id} style={{ display: "flex", justifyContent:"space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span>{tk.title}</span>
                    <PriBadge p={tk.priority} />
                  </div>
                ))
              )}
            </Section>
            <Section title="Audit trail" accent={T.purple}>
              {[...(local.audit_log || [])].reverse().slice(0, 8).map((e, i) => (
                <div key={i} style={{ fontSize: 11, padding: "4px 0", borderBottom: "1px solid #f5f5f5", color: T.t2 }}>
                  <span style={{ color: T.t4 }}>{new Date(e.ts).toLocaleDateString()}</span> · {e.action}
                </div>
              ))}
            </Section>
          </div>

          {linkedApp && (
            <Section title="Linked application" accent={appHasIncomplete ? T.amber : T.green}>
              <div style={{ fontSize: 12, color: T.t2 }}>
                Status: <strong>{linkedApp.status}</strong> · Code {linkedApp.access_code}
                {appHasIncomplete && " · Incomplete fields present"}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

export { TalentRecord };
