// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const COMPANY_CODES = { "NZG": true, "NZINGA": true, "TCG": true };

export const USERS = [
  { id:"u1", name:"Jordan Hayes",  initials:"JH", role:"scout",           email:"jordan@nzinga.co",  password:"scout123",    title:"Talent Scout",       color:"#7c3aed" },
  { id:"u2", name:"Marcus Bell",   initials:"MB", role:"team1_lead",      email:"marcus@nzinga.co",  password:"lead123",     title:"Team 1 Lead",        color:"#f59e0b" },
  { id:"u3", name:"Priya Okafor",  initials:"PO", role:"ops_specialist",  email:"priya@nzinga.co",   password:"ops123",      title:"Ops Specialist",     color:"#3b82f6" },
  { id:"u4", name:"Devon Cruz",    initials:"DC", role:"team2_lead",      email:"devon@nzinga.co",   password:"lead2123",    title:"Team 2 Lead",        color:"#06b6d4" },
  { id:"u5", name:"Simone Nzinga", initials:"SN", role:"director",        email:"simone@nzinga.co",  password:"director123", title:"Executive Director", color:"#10b981" },
  { id:"u6", name:"Alexis Grant",  initials:"AG", role:"success_manager", email:"alexis@nzinga.co",  password:"success123",  title:"Success Manager",    color:"#ec4899" },
];

export const ROLE_LABELS = {
  scout:"Scout", team1_lead:"Team 1 Lead", ops_specialist:"Ops Specialist",
  team2_lead:"Team 2 Lead", director:"Director", success_manager:"Success Manager"
};

// Role pipeline visibility (RBAC) — director sees all
export const ROLE_STAGE_ACCESS = {
  scout:           ["holding_entry","scout_complete","not_viable"],
  team1_lead:      ["scout_complete","team1_review"],
  ops_specialist:  ["team1_review","ops_processing"],
  team2_lead:      ["ops_processing","team2_audit"],
  director:        ["holding_entry","scout_complete","team1_review","ops_processing","team2_audit","executive_review","signed_onboarding","archived","not_viable"],
  success_manager: ["executive_review","signed_onboarding"],
};

// Which stage a role primarily ACTS on
export const ROLE_ACTION_STAGE = {
  scout:"holding_entry", team1_lead:"team1_review", ops_specialist:"ops_processing",
  team2_lead:"team2_audit", director:"executive_review", success_manager:"signed_onboarding"
};

export const STAGES = ["holding_entry","scout_complete","team1_review","ops_processing","team2_audit","executive_review","signed_onboarding","archived","not_viable"];
export const STAGE_LABELS = {
  holding_entry:"Holding Entry", scout_complete:"Scout Complete", team1_review:"Team 1 Review",
  ops_processing:"Ops Processing", team2_audit:"Team 2 Audit", executive_review:"Executive Review",
  signed_onboarding:"Signed – Onboarding", archived:"Archived", not_viable:"Not Viable"
};
export const STAGE_COLORS = {
  holding_entry:"#7c3aed", scout_complete:"#a855f7", team1_review:"#d97706",
  ops_processing:"#2563eb", team2_audit:"#0891b2", executive_review:"#059669",
  signed_onboarding:"#16a34a", archived:"#6b7280", not_viable:"#dc2626"
};
export const PILLAR_NAMES = ["Market Viability","Audience Engagement","Brand Safety","Content Consistency","Monetization Potential"];

// Required documents checklist
export const REQUIRED_DOCS = [
  { id:"gov_id",        label:"Government-Issued ID",        icon:"🪪", note:"Passport, driver's license, or state ID" },
  { id:"tax_doc",       label:"Tax Documentation (W-9)",     icon:"📄", note:"IRS W-9 form — required for payments" },
  { id:"banking",       label:"Banking Information",         icon:"🏦", note:"Voided check or bank letter" },
  { id:"proof_income",  label:"Proof of Income",             icon:"💰", note:"For self-support verification only — not used in approvals" },
];

export const APP_SECTIONS = [
  { id:"personal", label:"Personal Information", icon:"👤", fields:[
    { id:"legal_first", label:"Legal First Name", type:"text", required:true },
    { id:"legal_last",  label:"Legal Last Name",  type:"text", required:true },
    { id:"dob",         label:"Date of Birth",    type:"date", required:true },
    { id:"phone",       label:"Phone Number",     type:"tel",  required:true },
    { id:"email",       label:"Email Address",    type:"email",required:true },
    { id:"address",     label:"Mailing Address",  type:"text", required:true },
    { id:"city",        label:"City",             type:"text", required:true },
    { id:"state",       label:"State",            type:"text", required:true },
    { id:"zip",         label:"ZIP Code",         type:"text", required:true },
  ]},
  { id:"social", label:"Social Media Profiles", icon:"📱", fields:[
    { id:"primary_handle",    label:"Primary Handle (@username)", type:"text",   required:true },
    { id:"primary_platform",  label:"Primary Platform",           type:"select", options:["Instagram","TikTok","YouTube","Twitter/X","Facebook","Twitch","Other"], required:true },
    { id:"follower_count",    label:"Follower / Subscriber Count",type:"text",   required:true },
    { id:"er_pct",            label:"Avg Engagement Rate (%)",    type:"text",   required:false },
    { id:"secondary_handle",  label:"Secondary Handle (optional)",type:"text",   required:false },
    { id:"website",           label:"Personal Website / Portfolio",type:"url",   required:false },
  ]},
  { id:"talent", label:"Talent & Niche", icon:"⭐", fields:[
    { id:"niches",       label:"Primary Niche(s)",           type:"multicheck", options:["Model","Actor","Influencer","Athlete","Musician","Comedian","Gamer","Beauty/Fashion","Fitness","Food/Lifestyle","Other"], required:true },
    { id:"bio",          label:"Short Bio (2–3 sentences)",  type:"textarea",   required:true },
    { id:"achievements", label:"Key Achievements / Credits", type:"textarea",   required:true },
    { id:"collab_brands",label:"Past Brand Collaborations",  type:"textarea",   required:false },
  ]},
  { id:"business", label:"Business & Goals", icon:"💼", fields:[
    { id:"goals_90day",   label:"90-Day Goals",               type:"textarea", required:true },
    { id:"goals_1year",   label:"1-Year Vision",              type:"textarea", required:false },
    { id:"rep_type_pref", label:"Representation Preference",  type:"select", options:["Exclusive","Non-Exclusive","Open to Discussion"], required:false },
    { id:"referred_by",   label:"How did you hear about us?", type:"text",    required:false },
  ]},
  { id:"documents", label:"Required Documents", icon:"📎", fields:[
    { id:"doc_gov_id",       label:"Government-Issued ID",   type:"file_upload", required:true,  note:"Passport, driver's license, or state ID" },
    { id:"doc_tax",          label:"Tax Documentation (W-9)",type:"file_upload", required:true,  note:"IRS W-9 form" },
    { id:"doc_banking",      label:"Banking Information",    type:"file_upload", required:true,  note:"Voided check or bank statement" },
    { id:"doc_proof_income", label:"Proof of Income",        type:"file_upload", required:true,  note:"For self-support verification only — not used in approval decisions" },
  ]},
  { id:"consent", label:"Agreements & Consent", icon:"📋", fields:[
    { id:"consent_data",    label:"I consent to Nzinga Talent Group storing and processing my personal data for talent evaluation purposes.", type:"checkbox", required:true },
    { id:"consent_contact", label:"I agree to be contacted by Nzinga scouts and team members regarding my application.", type:"checkbox", required:true },
    { id:"consent_truth",   label:"I confirm all information provided is accurate and truthful.", type:"checkbox", required:true },
    { id:"signature",       label:"Full Legal Name (as digital signature)", type:"text", required:true },
  ]},
];

// Validate a section's required fields
export function validateSection(secId, data) {
  const sec = APP_SECTIONS.find(s=>s.id===secId);
  if (!sec) return [];
  return sec.fields.filter(f=>f.required).filter(f=>{
    const v = data[f.id];
    if (!v) return true;
    if (typeof v === "string" && !v.trim()) return true;
    return false;
  }).map(f=>f.id);
}

export function isAppComplete(app) {
  if (!app || !app.data) return false;
  for (const sec of APP_SECTIONS) {
    const missing = validateSection(sec.id, app.data);
    if (missing.length > 0) return false;
  }
  return true;
}

// Build a talent record stub from a completed application
export function talentFromApp(app) {
  const d = app.data || {};
  const niches = d.niches ? d.niches.split(",").map(s=>s.trim()).filter(Boolean) : [];
  return {
    id: "t_app_" + app.id,
    name: [d.legal_first, d.legal_last].filter(Boolean).join(" ") || app.talent_name,
    stage: "holding_entry",
    niches,
    scout_id: null,
    created_at: new Date().toISOString(),
    social_handle: d.primary_handle || "",
    follower_count: d.follower_count || "",
    er_pct: d.er_pct || "",
    platform: d.primary_platform || "",
    location: [d.city, d.state].filter(Boolean).join(", "),
    pillar_scores: [0,0,0,0,0],
    pillar_rationales: ["","","","",""],
    jordan_score: 0,
    revenue_path: d.goals_90day || "",
    scout_summary: d.bio || "",
    team1_notes: "", team1_decision: null,
    compliance: {
      legal_name: !!(d.legal_first && d.legal_last),
      dob: !!d.dob, address: !!(d.address && d.city),
      email_phone: !!(d.email && d.phone),
      gov_id: !!d.doc_gov_id, tax_doc: !!d.doc_tax,
      banking: !!d.doc_banking, social_ownership: !!d.primary_handle,
    },
    rep_type: d.rep_type_pref === "Exclusive" ? "Exclusive" : d.rep_type_pref === "Non-Exclusive" ? "Non-Exclusive" : "",
    commission: "", term_length: "",
    team2_notes: "", team2_decision: null, director_decision: null,
    portal_setup: false, technical_routing: false,
    warm_handoff: "", warm_handoff_confirmed: false,
    revenue_ytd: "0", revenue_projected: "0",
    last_contacted: new Date().toISOString().split("T")[0],
    application_id: app.id,
    application_status: "submitted",
    // Uploaded documents attached to profile
    uploaded_docs: {
      gov_id:       d.doc_gov_id       ? { name: d.doc_gov_id_name||"Government ID",       data: d.doc_gov_id,       type: d.doc_gov_id_type||"image/jpeg" } : null,
      tax_doc:      d.doc_tax          ? { name: d.doc_tax_name||"W-9 Form",               data: d.doc_tax,           type: d.doc_tax_type||"application/pdf" } : null,
      banking:      d.doc_banking      ? { name: d.doc_banking_name||"Banking Info",         data: d.doc_banking,       type: d.doc_banking_type||"image/jpeg" } : null,
      proof_income: d.doc_proof_income ? { name: d.doc_proof_income_name||"Proof of Income", data: d.doc_proof_income,  type: d.doc_proof_income_type||"image/jpeg" } : null,
    },
    audit_log: [{
      user: app.talent_name, role: "Prospect",
      action: "Submitted application — auto-created holding record",
      stage: "holding_entry", ts: new Date().toISOString()
    }],
  };
}

export const TASKS_SEED = [
  { id:"tk1", title:"Follow up with Zara re: Q3 merch collab", assigned_to:"u6", related_talent:"t1", due:"2026-05-25", priority:"high",   status:"open",      created_by:"u5", created_at:"2026-05-19T09:00:00Z", notes:"Discuss Q3 launch timeline." },
  { id:"tk2", title:"Collect W-9 from Mia Torres",              assigned_to:"u3", related_talent:"t3", due:"2026-05-21", priority:"urgent", status:"open",      created_by:"u3", created_at:"2026-05-19T10:00:00Z", notes:"Tax doc still outstanding." },
  { id:"tk3", title:"Review Darius Cole scoring rationale",      assigned_to:"u2", related_talent:"t2", due:"2026-05-22", priority:"medium", status:"open",      created_by:"u2", created_at:"2026-05-18T14:00:00Z", notes:"Check pillar 2 alignment." },
];

export const HISTORY_SEED = [
  { id:"h1", talent_id:"t1", user_id:"u6", type:"note",  text:"Spoke with Zara. She's interested in the Q3 merch line.", ts:"2026-05-18T14:22:00Z", flagged:false, is_document:false },
  { id:"h2", talent_id:"t1", user_id:"u5", type:"call",  text:"Director check-in call. Onboarding confirmed complete.", ts:"2026-05-17T10:05:00Z", flagged:false, is_document:false },
  { id:"h3", talent_id:"t2", user_id:"u2", type:"note",  text:"Pillar 2 engagement score is borderline. Watching trend data.", ts:"2026-05-18T11:30:00Z", flagged:true, is_document:false },
  { id:"h4", talent_id:"t3", user_id:"u3", type:"document", text:"W-9 uploaded for Mia Torres.", ts:"2026-05-18T09:15:00Z", flagged:false, is_document:true, doc_name:"W-9_MiaTorres.pdf", doc_type:"application/pdf" },
  { id:"h5", talent_id:"t5", user_id:"u4", type:"note",  text:"All data verified. Approved for Director.", ts:"2026-05-15T10:00:00Z", flagged:false, is_document:false },
];

export const TALENTS_SEED = [
  { id:"t1", name:"Zara Williams", stage:"signed_onboarding", niches:["Model","Influencer"], scout_id:"u1",
    created_at:"2026-04-10T09:00:00Z", social_handle:"@zarawilliams", follower_count:"2.1M", er_pct:"8.2",
    platform:"Instagram / TikTok", location:"Atlanta, GA",
    pillar_scores:[4,5,4,4,5], pillar_rationales:["Exceptional brand consistency.","Viral ER above 8%.","Zero controversy.","Diverse content.","3 active brand deals."],
    jordan_score:4.4, revenue_path:"Sponsored posts ($8k/mo). 90-day: $25k luxury fashion.",
    scout_summary:"Top-tier digital creator with proven commercial appeal.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:true, banking:true, social_ownership:true },
    rep_type:"Exclusive", commission:"15", term_length:"12 months",
    team2_notes:"", team2_decision:"approved", director_decision:"approved",
    portal_setup:true, technical_routing:true, warm_handoff:"Keisha Morris – Influencer Division", warm_handoff_confirmed:true,
    revenue_ytd:"47200", revenue_projected:"180000", last_contacted:"2026-05-18",
    application_id:null, application_status:null, uploaded_docs:{},
    audit_log:[
      {user:"Jordan Hayes",role:"Scout",action:"Created holding record",stage:"holding_entry",ts:"2026-04-10T09:00:00Z"},
      {user:"Jordan Hayes",role:"Scout",action:"Completed Talent Packet → Scout Complete",stage:"scout_complete",ts:"2026-04-11T14:22:00Z"},
      {user:"Marcus Bell",role:"Team 1 Lead",action:"Approved for Ops",stage:"team1_review",ts:"2026-04-12T10:05:00Z"},
      {user:"Priya Okafor",role:"Ops Specialist",action:"Compliance verified → Team 2 Audit",stage:"ops_processing",ts:"2026-04-13T16:40:00Z"},
      {user:"Devon Cruz",role:"Team 2 Lead",action:"Approved for Director",stage:"team2_audit",ts:"2026-04-14T11:20:00Z"},
      {user:"Simone Nzinga",role:"Director",action:"Approved – Sign Client",stage:"executive_review",ts:"2026-04-15T09:55:00Z"},
      {user:"Alexis Grant",role:"Success Manager",action:"Warm hand-off confirmed",stage:"signed_onboarding",ts:"2026-04-16T13:30:00Z"},
    ]},
  { id:"t2", name:"Darius Cole", stage:"team1_review", niches:["Actor","Model"], scout_id:"u1",
    created_at:"2026-05-01T11:00:00Z", social_handle:"@dariuscole", follower_count:"890K", er_pct:"3.1",
    platform:"Instagram / YouTube", location:"Los Angeles, CA",
    pillar_scores:[4,3,4,4,4], pillar_rationales:["SAG eligible.","ER slightly low.","Clean image.","Indie drama niche.","Two commercials."],
    jordan_score:3.8, revenue_path:"Commercials $3k/mo. 90-day: 2 bookings.",
    scout_summary:"Disciplined actor, pillar 2 borderline.",
    team1_notes:"", team1_decision:null, compliance:{}, rep_type:"", commission:"", term_length:"",
    team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false,
    revenue_ytd:"0", revenue_projected:"36000", last_contacted:"2026-05-02",
    application_id:null, application_status:null, uploaded_docs:{},
    audit_log:[
      {user:"Jordan Hayes",role:"Scout",action:"Created holding record",stage:"holding_entry",ts:"2026-05-01T11:00:00Z"},
      {user:"Jordan Hayes",role:"Scout",action:"Completed Talent Packet → Scout Complete",stage:"scout_complete",ts:"2026-05-02T15:10:00Z"},
    ]},
  { id:"t3", name:"Mia Torres", stage:"ops_processing", niches:["Athlete","Influencer"], scout_id:"u1",
    created_at:"2026-04-20T08:30:00Z", social_handle:"@miatorres_fit", follower_count:"1.4M", er_pct:"6.8",
    platform:"Instagram / YouTube", location:"Houston, TX",
    pillar_scores:[5,4,4,4,4], pillar_rationales:["D1 athlete 3 titles.","High engagement.","Zero risk.","Consistent posting.","NIL $12k YTD."],
    jordan_score:4.2, revenue_path:"NIL deals. 90-day: Adidas NIL activation.",
    scout_summary:"Elite D1 athlete with exceptional NIL positioning.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:false, banking:false, social_ownership:true },
    rep_type:"Exclusive", commission:"20", term_length:"24 months",
    team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false,
    revenue_ytd:"12000", revenue_projected:"95000", last_contacted:"2026-05-18",
    application_id:null, application_status:null, uploaded_docs:{},
    audit_log:[
      {user:"Jordan Hayes",role:"Scout",action:"Created holding record",stage:"holding_entry",ts:"2026-04-20T08:30:00Z"},
      {user:"Marcus Bell",role:"Team 1 Lead",action:"Approved for Ops",stage:"team1_review",ts:"2026-04-22T14:00:00Z"},
    ]},
  { id:"t4", name:"Kai Johnson", stage:"holding_entry", niches:[], scout_id:"u1",
    created_at:"2026-05-18T10:00:00Z", social_handle:"@kaij_music", follower_count:"320K", er_pct:"2.1",
    platform:"TikTok / Instagram", location:"Chicago, IL",
    pillar_scores:[0,0,0,0,0], pillar_rationales:["","","","",""], jordan_score:0,
    revenue_path:"", scout_summary:"", team1_notes:"", team1_decision:null, compliance:{}, rep_type:"", commission:"", term_length:"",
    team2_notes:"", team2_decision:null, director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false,
    revenue_ytd:"0", revenue_projected:"0", last_contacted:"2026-05-18",
    application_id:"app_kai", application_status:"in_progress", uploaded_docs:{},
    audit_log:[{user:"Jordan Hayes",role:"Scout",action:"Created holding record",stage:"holding_entry",ts:"2026-05-18T10:00:00Z"}]},
  { id:"t5", name:"Renee Park", stage:"executive_review", niches:["Actor","Influencer"], scout_id:"u1",
    created_at:"2026-04-05T07:20:00Z", social_handle:"@reneepark", follower_count:"3.8M", er_pct:"12.0",
    platform:"Instagram / YouTube / TikTok", location:"New York, NY",
    pillar_scores:[5,5,5,4,5], pillar_rationales:["Series regular.","ER 12%.","Spotless record.","Cross-platform.","$40k/mo brand."],
    jordan_score:4.8, revenue_path:"Series fees + brand integrations. 90-day: $150k.",
    scout_summary:"Strongest pipeline candidate this quarter.",
    team1_notes:"", team1_decision:"approved",
    compliance:{ legal_name:true, gov_id:true, dob:true, address:true, email_phone:true, tax_doc:true, banking:true, social_ownership:true },
    rep_type:"Exclusive", commission:"15", term_length:"18 months",
    team2_notes:"", team2_decision:"approved", director_decision:null,
    portal_setup:false, technical_routing:false, warm_handoff:"", warm_handoff_confirmed:false,
    revenue_ytd:"120000", revenue_projected:"480000", last_contacted:"2026-05-15",
    application_id:null, application_status:null, uploaded_docs:{},
    audit_log:[
      {user:"Jordan Hayes",role:"Scout",action:"Created holding record",stage:"holding_entry",ts:"2026-04-05T07:20:00Z"},
      {user:"Devon Cruz",role:"Team 2 Lead",action:"Approved for Director",stage:"team2_audit",ts:"2026-04-09T10:00:00Z"},
    ]},
];

export const APPLICATIONS_SEED = {
  "app_kai": {
    id:"app_kai", talent_id:"t4", access_code:"KAI2026",
    talent_name:"Kai Johnson", talent_email:"kai@example.com",
    status:"in_progress", created_at:"2026-05-18T10:00:00Z",
    last_saved:"2026-05-19T14:30:00Z",
    completed_sections:["personal","social"],
    data:{ legal_first:"Kai", legal_last:"Johnson", dob:"2000-03-15", phone:"312-555-0199",
      email:"kai@example.com", address:"123 West Loop Dr", city:"Chicago", state:"IL", zip:"60601",
      primary_handle:"@kaij_music", primary_platform:"TikTok", follower_count:"320K" }
  }
};
