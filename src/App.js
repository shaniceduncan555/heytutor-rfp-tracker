import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore";

// ─── Firebase Config ───
const firebaseConfig = {
  apiKey: "AIzaSyCBnsudefpNI1HnYZG7HJLlTaDYqSM8BJA",
  authDomain: "rfp-tracker-764af.firebaseapp.com",
  databaseURL: "https://rfp-tracker-764af-default-rtdb.firebaseio.com",
  projectId: "rfp-tracker-764af",
  storageBucket: "rfp-tracker-764af.firebasestorage.app",
  messagingSenderId: "68058095321",
  appId: "1:68058095321:web:6ecffa9892ef4afede28c8",
  measurementId: "G-VP3W0X7ETB",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const COLLECTION = "rfps";

async function loadRFPs() {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(d => d.data());
  } catch (e) { console.error("Load error:", e); return []; }
}

async function saveRFP(rfp) {
  try {
    await setDoc(doc(db, COLLECTION, rfp.id), rfp);
  } catch (e) { console.error("Save error:", e); }
}

async function deleteRFP(id) {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (e) { console.error("Delete error:", e); }
}

// ─── Brand ───
const BRAND = {
  deepPurple: "#4A1A6B",
  midPurple: "#6B2D9B",
  lightPurple: "#F3EBF9",
  teal: "#00B4A6",
  tealDark: "#009688",
  white: "#FFFFFF",
  offWhite: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#E8E8E8",
  gray300: "#D1D1D1",
  gray500: "#888",
  gray700: "#444",
  gray900: "#1a1a1a",
  red: "#E53935",
  amber: "#F9A825",
  green: "#43A047",
};

const STATUS_CONFIG = {
  "Not Started": { bg: BRAND.gray200, text: BRAND.gray700, dot: BRAND.gray500 },
  "In Progress": { bg: "#EDE7F6", text: BRAND.midPurple, dot: BRAND.midPurple },
  "Under Review": { bg: "#FFF8E1", text: "#E65100", dot: BRAND.amber },
  "Submitted": { bg: "#E8F5E9", text: "#2E7D32", dot: BRAND.green },
  "Won": { bg: "#E0F2F1", text: "#00695C", dot: BRAND.teal },
  "Lost": { bg: "#FFEBEE", text: "#C62828", dot: BRAND.red },
};


// ─── Status card token system ───
const STATUS_CARD_STYLES = {
  "Not Started": {
    bg: "#EFF6FF", border: "#BFDBFE", topBorder: "#3B82F6",
    text: "#1E3A5F", subtleText: "#3B82F6",
    pillBg: "#DBEAFE", pillText: "#1D4ED8", hoverBorder: "#3B82F6",
  },
  "In Progress": {
    bg: "#FEFCE8", border: "#FEF08A", topBorder: "#EAB308",
    text: "#4A3800", subtleText: "#A16207",
    pillBg: "#FEF9C3", pillText: "#854D0E", hoverBorder: "#EAB308",
  },
  "Under Review": {
    bg: "#FFF7ED", border: "#FED7AA", topBorder: "#F97316",
    text: "#4A1A00", subtleText: "#C2410C",
    pillBg: "#FFEDD5", pillText: "#9A3412", hoverBorder: "#F97316",
  },
  "Submitted": {
    bg: "#F9FAFB", border: "#E5E7EB", topBorder: "#9CA3AF",
    text: "#111827", subtleText: "#6B7280",
    pillBg: "#F3F4F6", pillText: "#374151", hoverBorder: "#6B2D9B",
  },
  "Won": {
    bg: "#F0FDF4", border: "#BBF7D0", topBorder: "#22C55E",
    text: "#052E16", subtleText: "#16A34A",
    pillBg: "#DCFCE7", pillText: "#15803D", hoverBorder: "#22C55E",
  },
  "Lost": {
    bg: "#FFF1F2", border: "#FECDD3", topBorder: "#F43F5E",
    text: "#4C0519", subtleText: "#BE123C",
    pillBg: "#FFE4E6", pillText: "#9F1239", hoverBorder: "#F43F5E",
  },
  "No-Go": {
    bg: "#FFF1F2", border: "#FECDD3", topBorder: "#FB7185",
    text: "#4C0519", subtleText: "#BE123C",
    pillBg: "#FFE4E6", pillText: "#9F1239", hoverBorder: "#F43F5E",
  },
};

const STATUS_CARD_STYLES_FALLBACK = {
  bg: "#FFFFFF", border: "#E5E7EB", topBorder: "#9CA3AF",
  text: "#111827", subtleText: "#6B7280",
  pillBg: "#F3F4F6", pillText: "#374151", hoverBorder: "#6B2D9B",
};

function getCardStyle(status) {
  return STATUS_CARD_STYLES[status] || STATUS_CARD_STYLES_FALLBACK;
}

const SERVICE_TYPES = [
  "", "High-Dosage Tutoring", "Supplemental Tutoring", "After-School Tutoring",
  "ELOP (Expanded Learning)", "Summer Learning Program", "Intervention Services",
  "Virtual Tutoring", "In-Person Tutoring", "Hybrid Tutoring", "Other",
];

const SUBJECT_OPTIONS = ["Math", "ELA", "Science", "Social Studies", "ESL/ELD", "Other"];

const GRADE_OPTIONS = [
  "Pre-K", "K", "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th",
];

const INITIAL_FORM = {
  districtName: "",
  rfpTitle: "",
  state: "",
  dueDate: "",
  dueTime: "",
  status: "Not Started",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  submissionMethod: "",
  submissionUrl: "",
  submissionNotes: "",
  guidelines: "",
  requiredDocs: [],
  signaturesNeeded: "",
  estimatedValue: "",
  notes: "",
  preBidDate: "",
  preBidLink: "",
  questionsForDistrict: "",
  rfpAuthor: "",
  rfpDocLink: "",
  serviceType: "",
  subjects: [],
  gradeLevels: [],
  scopeNotes: "",
  // AE fields
  aeRequired: false,
  aeName: "",
  // Fit Review
  fitReview: null,
};

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function getUrgencyTag(dateStr, status) {
  if (status === "Submitted" || status === "Won" || status === "Lost") return null;
  const days = getDaysUntil(dateStr);
  if (days === null) return null;
  if (days < 0) return { label: "OVERDUE", color: BRAND.red, bg: "#FFEBEE" };
  if (days <= 3) return { label: `${days}d left`, color: BRAND.red, bg: "#FFEBEE" };
  if (days <= 7) return { label: `${days}d left`, color: "#E65100", bg: "#FFF8E1" };
  if (days <= 14) return { label: `${days}d left`, color: BRAND.amber, bg: "#FFFDE7" };
  return { label: `${days}d left`, color: BRAND.green, bg: "#E8F5E9" };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Components ───

function Badge({ children, bg, color, style, onClick }) {
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.3, background: bg, color, whiteSpace: "nowrap",
      cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</span>
  );
}

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Not Started"];
  return (
    <Badge bg={cfg.bg} color={cfg.text}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {status}
    </Badge>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, required, textarea, style }) {
  const shared = {
    width: "100%", padding: "10px 12px", border: `1px solid ${BRAND.gray300}`,
    borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    background: BRAND.white, outline: "none", transition: "border-color 0.2s",
    boxSizing: "border-box", ...style,
  };
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, letterSpacing: 0.3 }}>
        {label}{required && <span style={{ color: BRAND.red }}> *</span>}
      </span>
      {textarea ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
          style={{ ...shared, resize: "vertical" }}
          onFocus={e => e.target.style.borderColor = BRAND.midPurple}
          onBlur={e => e.target.style.borderColor = BRAND.gray300} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={shared}
          onFocus={e => e.target.style.borderColor = BRAND.midPurple}
          onBlur={e => e.target.style.borderColor = BRAND.gray300} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, letterSpacing: 0.3 }}>
        {label}{required && <span style={{ color: BRAND.red }}> *</span>}
      </span>
      <select value={value} onChange={onChange} style={{
        width: "100%", padding: "10px 12px", border: `1px solid ${BRAND.gray300}`,
        borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
        background: BRAND.white, outline: "none", cursor: "pointer",
      }}>
        {options.map(o => <option key={o} value={o}>{o || "— Select —"}</option>)}
      </select>
    </label>
  );
}

function MultiSelect({ label, selected, options, onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, letterSpacing: 0.3 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s",
              border: `1.5px solid ${active ? BRAND.teal : BRAND.gray300}`,
              background: active ? "#E0F2F1" : BRAND.white,
              color: active ? BRAND.tealDark : BRAND.gray700,
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── AE Toggle ───
function AEToggle({ aeRequired, aeName, onToggle, onNameChange }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      border: `1.5px solid ${aeRequired ? BRAND.midPurple : BRAND.gray200}`,
      background: aeRequired ? BRAND.lightPurple : BRAND.gray100,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: aeRequired ? BRAND.deepPurple : BRAND.gray700 }}>
            Account Executive Required
          </div>
          <div style={{ fontSize: 11, color: BRAND.gray500, marginTop: 2 }}>
            Toggle on if this RFP needs an AE involved
          </div>
        </div>
        {/* Toggle switch */}
        <div onClick={onToggle} style={{
          width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
          background: aeRequired ? BRAND.midPurple : BRAND.gray300,
          position: "relative", flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: 3, left: aeRequired ? 23 : 3,
            width: 18, height: 18, borderRadius: "50%", background: BRAND.white,
            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </div>
      </div>
      {aeRequired && (
        <div style={{ marginTop: 12 }}>
          <input
            value={aeName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Account Executive name..."
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 7,
              border: `1px solid ${BRAND.midPurple}`, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
              background: BRAND.white, boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}

// (File upload removed — use rfpDocLink instead)

function RequiredDocsChecklist({ docs, onChange }) {
  const safeD = Array.isArray(docs) ? docs : [];
  const [newName, setNewName] = useState("");
  const [newLink, setNewLink] = useState("");

  const addDoc = () => {
    if (!newName.trim()) return;
    onChange([...safeD, { id: Date.now().toString(), name: newName.trim(), link: newLink.trim(), done: false }]);
    setNewName(""); setNewLink("");
  };
  const toggleDone = (id) => onChange(safeD.map(d => d.id === id ? { ...d, done: !d.done } : d));
  const removeDoc = (id) => onChange(safeD.filter(d => d.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, letterSpacing: 0.3 }}>Required Documents Checklist</span>
      {safeD.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {safeD.map(doc => (
            <div key={doc.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              borderRadius: 8, background: doc.done ? "#E8F5E9" : BRAND.gray100,
              border: `1px solid ${doc.done ? "#A5D6A7" : BRAND.gray200}`, transition: "all 0.2s",
            }}>
              <button onClick={() => toggleDone(doc.id)} style={{
                width: 22, height: 22, borderRadius: 6,
                border: `2px solid ${doc.done ? BRAND.green : BRAND.gray300}`,
                background: doc.done ? BRAND.green : BRAND.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s", padding: 0,
              }}>
                {doc.done && <span style={{ color: BRAND.white, fontSize: 13, lineHeight: 1 }}>✓</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: doc.done ? BRAND.green : BRAND.gray900,
                  textDecoration: doc.done ? "line-through" : "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{doc.name}</div>
                {doc.link && (
                  <a href={doc.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{
                    fontSize: 11, color: BRAND.teal, textDecoration: "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                  }}>{doc.link}</a>
                )}
              </div>
              <button onClick={() => removeDoc(doc.id)} style={{
                background: "none", border: "none", color: BRAND.gray500,
                fontSize: 14, cursor: "pointer", padding: "0 2px", flexShrink: 0,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{
        display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap",
        padding: "10px 12px", borderRadius: 8,
        border: `1px dashed ${BRAND.gray300}`, background: BRAND.offWhite,
      }}>
        <div style={{ flex: "1 1 160px", minWidth: 120 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: BRAND.gray500, marginBottom: 3 }}>Document Name</div>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. W-9, Insurance Cert"
            onKeyDown={e => e.key === "Enter" && addDoc()}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 6,
              border: `1px solid ${BRAND.gray300}`, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 140 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: BRAND.gray500, marginBottom: 3 }}>Link (optional)</div>
          <input value={newLink} onChange={e => setNewLink(e.target.value)}
            placeholder="https://drive.google.com/..."
            onKeyDown={e => e.key === "Enter" && addDoc()}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 6,
              border: `1px solid ${BRAND.gray300}`, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <button onClick={addDoc} disabled={!newName.trim()} style={{
          padding: "7px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif", cursor: newName.trim() ? "pointer" : "not-allowed",
          background: newName.trim() ? BRAND.teal : BRAND.gray200,
          color: newName.trim() ? BRAND.white : BRAND.gray500,
          transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
        }}>+ Add</button>
      </div>
      {safeD.length > 0 && (
        <div style={{ fontSize: 11, color: BRAND.gray500, marginTop: 2 }}>
          {safeD.filter(d => d.done).length} of {safeD.length} completed
        </div>
      )}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", style, disabled }) {
  const variants = {
    primary: { background: BRAND.deepPurple, color: BRAND.white, border: "none" },
    teal: { background: BRAND.teal, color: BRAND.white, border: "none" },
    outline: { background: "transparent", color: BRAND.deepPurple, border: `1.5px solid ${BRAND.deepPurple}` },
    ghost: { background: "transparent", color: BRAND.gray500, border: "none" },
    danger: { background: "transparent", color: BRAND.red, border: `1.5px solid ${BRAND.red}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif", cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...variants[variant], ...style,
    }}>{children}</button>
  );
}


// ─── Fit Review Constants ───
const FIT_SECTIONS = [
  {
    key: "strategic",
    label: "Strategic Fit",
    shortLabel: "Strategic Fit",
    maxScore: 20,
    purpose: "Does this opportunity align with what the company actually wants to pursue?",
    questions: [
      { key: "s1", label: "Alignment with core services", hint: "1 = outside our main offerings · 3 = somewhat aligned · 5 = direct fit" },
      { key: "s2", label: "Student population / grade band match", hint: "1 = little experience · 3 = some relevant experience · 5 = strong proven experience" },
      { key: "s3", label: "Target market & buyer profile fit", hint: "1 = not a target customer · 3 = adjacent · 5 = ideal customer profile" },
      { key: "s4", label: "Geographic / delivery model fit", hint: "1 = difficult geography · 3 = possible with effort · 5 = easy fit with current footprint" },
    ],
  },
  {
    key: "capability",
    label: "Delivery Readiness",
    shortLabel: "Delivery Readiness",
    maxScore: 20,
    purpose: "Can the company actually deliver what is being asked?",
    questions: [
      { key: "c1", label: "Confidence we can deliver the scope", hint: "1 = major gaps · 3 = partial fit, workarounds needed · 5 = fully capable as-is" },
      { key: "c2", label: "Staffing capacity if awarded", hint: "1 = major staffing concerns · 3 = possible but tight · 5 = strong available capacity" },
      { key: "c3", label: "Compliance & documentation readiness", hint: "1 = significant gaps · 3 = manageable with effort · 5 = already equipped" },
      { key: "c4", label: "Realism of implementation timeline", hint: "1 = unrealistic · 3 = challenging but doable · 5 = very realistic" },
    ],
  },
  {
    key: "financial",
    label: "Financial Value",
    shortLabel: "Financial Value",
    maxScore: 15,
    purpose: "Is this worth the effort financially?",
    questions: [
      { key: "f1", label: "Contract value vs. effort required", hint: "1 = not worth the effort · 3 = acceptable · 5 = highly attractive" },
      { key: "f2", label: "Margin potential", hint: "1 = margin risk is high · 3 = uncertain · 5 = margin potential looks strong" },
      { key: "f3", label: "Reasonableness of pursuit & delivery costs", hint: "1 = expensive to pursue/deliver · 3 = manageable · 5 = low burden relative to value" },
    ],
  },
  {
    key: "win",
    label: "Win Potential",
    shortLabel: "Win Potential",
    maxScore: 20,
    purpose: "Even if you can do it, can you realistically win it?",
    questions: [
      { key: "w1", label: "Strength of relevant past performance", hint: "1 = weak/no relevant examples · 3 = somewhat relevant · 5 = strong directly relevant history" },
      { key: "w2", label: "Differentiation for this buyer", hint: "1 = hard to stand out · 3 = some differentiators · 5 = strong clear advantages" },
      { key: "w3", label: "Overall competitive positioning", hint: "1 = unlikely to win · 3 = possible · 5 = strong chance of winning" },
      { key: "w4", label: "Ability to produce a strong response by deadline", hint: "1 = weak position · 3 = possible with pressure · 5 = very well positioned" },
    ],
  },
  {
    key: "risk",
    label: "Risk Level",
    shortLabel: "Risk Level",
    maxScore: 20,
    purpose: "What could make this opportunity painful or not worth it? (5 = low risk / very manageable)",
    questions: [
      { key: "r1", label: "Clarity and definition of scope", hint: "1 = vague and risky · 3 = somewhat clear · 5 = very clear" },
      { key: "r2", label: "Manageability of compliance / admin burden", hint: "1 = very burdensome · 3 = moderate · 5 = very manageable" },
      { key: "r3", label: "Turnaround time for a high-quality response", hint: "1 = very difficult timeline · 3 = tight but manageable · 5 = very manageable" },
      { key: "r4", label: "Delivery risks if awarded", hint: "1 = high delivery risk · 3 = moderate risk · 5 = low risk" },
    ],
  },
];

const RED_FLAGS = [
  { key: "rf1", label: "Are there mandatory requirements we cannot meet?" },
  { key: "rf2", label: "Would pursuing this materially strain staffing or delivery capacity?" },
  { key: "rf3", label: "Is the timeline too compressed to submit a strong proposal?" },
];

const TOTAL_MAX = 95;

const RECOMMENDATION_CONFIG = {
  "Go":               { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7", emoji: "✅" },
  "Go with Caution":  { bg: "#FFF8E1", color: "#E65100", border: "#FFD54F", emoji: "⚠️" },
  "No-Go":            { bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A", emoji: "🚫" },
};

function getScoreBand(total, redFlagCount) {
  if (redFlagCount >= 2) return { label: "No-Go", rec: "No-Go", statusLabel: "No-Go", statusBg: "#FFEBEE", statusColor: "#C62828" };
  if (total >= 80) return { label: "Strong Fit",   rec: "Go",               statusLabel: "Strong Fit",   statusBg: "#E8F5E9", statusColor: "#2E7D32" };
  if (total >= 65) return { label: "Moderate Fit", rec: "Go with Caution",  statusLabel: "Moderate Fit", statusBg: "#FFF8E1", statusColor: "#E65100" };
  if (total >= 50) return { label: "Weak Fit",     rec: "Go with Caution",  statusLabel: "Weak Fit",     statusBg: "#FFF3E0", statusColor: "#F57C00" };
  return              { label: "No-Go",            rec: "No-Go",            statusLabel: "No-Go",        statusBg: "#FFEBEE", statusColor: "#C62828" };
}

function calcFitTotal(scores) {
  return Object.values(scores || {}).reduce((s, v) => s + (v || 0), 0);
}

function calcRedFlagCount(redFlags) {
  return Object.values(redFlags || {}).filter(Boolean).length;
}

// ─── Fit Score Badge (card + detail) ───
function FitScoreBadge({ fitReview }) {
  if (!fitReview?.recommendation) return null;
  const total = calcFitTotal(fitReview.scores);
  const rfCount = calcRedFlagCount(fitReview.redFlags);
  const band = getScoreBand(total, rfCount);
  const rec = RECOMMENDATION_CONFIG[fitReview.recommendation] || RECOMMENDATION_CONFIG["No-Go"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        background: rec.bg, color: rec.color, border: `1px solid ${rec.border}`,
      }}>{rec.emoji} {fitReview.recommendation}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        background: band.statusBg, color: band.statusColor,
      }}>Score: {total}/{TOTAL_MAX}</span>
      {rfCount > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: "#FFEBEE", color: "#C62828",
        }}>⚑ {rfCount} Red Flag{rfCount > 1 ? "s" : ""}</span>
      )}
    </div>
  );
}

// ─── Section score bar helper ───
function SectionBar({ label, score, max }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color = pct >= 80 ? "#43A047" : pct >= 60 ? "#F9A825" : "#E53935";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "#444", fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{score}/{max}</span>
      </div>
      <div style={{ height: 5, background: "#E8E8E8", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Fit Review Modal ───
function FitReviewModal({ rfp, onSave, onClose }) {
  const ex = rfp.fitReview || {};
  const [scores, setScores] = useState(ex.scores || {});
  const [redFlags, setRedFlags] = useState(ex.redFlags || {});
  const [recommendation, setRecommendation] = useState(ex.recommendation || "");
  const [reviewerName, setReviewerName] = useState(ex.reviewerName || "");
  const [reviewDate, setReviewDate] = useState(ex.reviewDate || new Date().toISOString().split("T")[0]);
  const [keyReasons, setKeyReasons] = useState(ex.keyReasons || "");
  const [keyConcerns, setKeyConcerns] = useState(ex.keyConcerns || "");
  const [internalNotes, setInternalNotes] = useState(ex.internalNotes || "");
  const [openSection, setOpenSection] = useState("strategic");

  const total = calcFitTotal(scores);
  const rfCount = calcRedFlagCount(redFlags);
  const band = getScoreBand(total, rfCount);
  const suggestedRec = band.rec;
  const valid = recommendation && reviewerName;

  const setScore = (key, val) => setScores(s => ({ ...s, [key]: val }));
  const toggleFlag = (key) => setRedFlags(f => ({ ...f, [key]: !f[key] }));

  const sectionScore = (sec) => sec.questions.reduce((s, q) => s + (scores[q.key] || 0), 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(74,26,107,0.28)", zIndex: 1200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(660px, 96vw)", maxHeight: "92vh", background: "#FAFAFA",
        borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(74,26,107,0.22)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          background: "linear-gradient(135deg, #4A1A6B, #6B2D9B)",
          color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>🔍 Fit Evaluation</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{rfp.districtName} — {rfp.rfpTitle}</div>
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>
              Score each item 1–5. Higher = better fit. Risk section: 5 = low risk / very manageable.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", marginTop: -4 }}>✕</button>
        </div>

        {/* Top summary bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
          borderBottom: "1px solid #E8E8E8", background: "#fff",
        }}>
          {[
            { label: "Total Score", value: `${total}/${TOTAL_MAX}`, sub: band.statusLabel, color: band.statusColor, bg: band.statusBg },
            { label: "Reviewer", value: reviewerName || "—", sub: reviewDate || "No date", color: "#6B2D9B", bg: "#F3EBF9" },
            { label: "Recommendation", value: recommendation || "Not set", sub: rfCount > 0 ? `⚑ ${rfCount} red flag${rfCount > 1 ? "s" : ""}` : "No red flags", color: recommendation ? (RECOMMENDATION_CONFIG[recommendation]?.color || "#888") : "#888", bg: recommendation ? (RECOMMENDATION_CONFIG[recommendation]?.bg || "#f5f5f5") : "#f5f5f5" },
          ].map((c, i) => (
            <div key={i} style={{ padding: "12px 18px", borderRight: i < 2 ? "1px solid #E8E8E8" : "none", background: c.bg }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 0.5, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginTop: 2 }}>{c.value}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>

          {/* Reviewer info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B2D9B", letterSpacing: 0.5, textTransform: "uppercase" }}>Reviewer Name *</span>
              <input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="Your name"
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D1D1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B2D9B", letterSpacing: 0.5, textTransform: "uppercase" }}>Review Date</span>
              <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D1D1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </label>
          </div>

          {/* Scored sections — accordion */}
          {FIT_SECTIONS.map(sec => {
            const secScore = sectionScore(sec);
            const isOpen = openSection === sec.key;
            const pct = Math.round((secScore / sec.maxScore) * 100);
            const barColor = pct >= 80 ? "#43A047" : pct >= 60 ? "#F9A825" : "#E53935";
            return (
              <div key={sec.key} style={{
                marginBottom: 8, borderRadius: 10, overflow: "hidden",
                border: `1.5px solid ${isOpen ? "#6B2D9B" : "#E8E8E8"}`,
                transition: "border-color 0.2s",
              }}>
                {/* Section header */}
                <button onClick={() => setOpenSection(isOpen ? null : sec.key)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", background: isOpen ? "#F3EBF9" : "#fff",
                  border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isOpen ? "#4A1A6B" : "#444" }}>{sec.label}</span>
                    <div style={{ flex: 1, maxWidth: 120, height: 4, background: "#E8E8E8", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{secScore}/{sec.maxScore}</span>
                    <span style={{ color: "#888", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {/* Section body */}
                {isOpen && (
                  <div style={{ padding: "12px 16px 16px", background: "#fff", borderTop: "1px solid #F3EBF9" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 14, fontStyle: "italic" }}>{sec.purpose}</div>
                    {sec.questions.map(q => (
                      <div key={q.key} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ flex: 1, paddingRight: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{q.label}</div>
                            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{q.hint}</div>
                          </div>
                          <span style={{ fontSize: 18, fontWeight: 800, minWidth: 24, textAlign: "right",
                            color: scores[q.key] ? barColor : "#D1D1D1" }}>{scores[q.key] || "—"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setScore(q.key, n)} style={{
                              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
                              fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s",
                              border: `2px solid ${scores[q.key] === n ? "#6B2D9B" : "#E8E8E8"}`,
                              background: scores[q.key] === n ? "#F3EBF9" : "#fff",
                              color: scores[q.key] === n ? "#4A1A6B" : "#888",
                            }}>{n}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Red Flags */}
          <div style={{
            marginBottom: 20, marginTop: 4, padding: "14px 16px", borderRadius: 10,
            background: rfCount > 0 ? "#FFEBEE" : "#fff",
            border: `1.5px solid ${rfCount > 0 ? "#EF9A9A" : "#E8E8E8"}`,
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: rfCount > 0 ? "#C62828" : "#6B2D9B", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
              ⚑ Red Flag Checks
            </div>
            {rfCount >= 2 && (
              <div style={{ fontSize: 12, color: "#C62828", fontWeight: 600, background: "#FFCDD2", padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>
                ⚠️ 2+ red flags — default recommendation is No-Go unless leadership approves.
              </div>
            )}
            {rfCount === 1 && (
              <div style={{ fontSize: 12, color: "#E65100", fontWeight: 600, background: "#FFF3E0", padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>
                Manual leadership review recommended before pursuing.
              </div>
            )}
            {RED_FLAGS.map(rf => (
              <div key={rf.key} onClick={() => toggleFlag(rf.key)} style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer",
                padding: "8px 10px", borderRadius: 8,
                background: redFlags[rf.key] ? "#FFEBEE" : "#F5F5F5",
                border: `1px solid ${redFlags[rf.key] ? "#EF9A9A" : "#E8E8E8"}`,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: redFlags[rf.key] ? "#E53935" : "#fff",
                  border: `2px solid ${redFlags[rf.key] ? "#E53935" : "#D1D1D1"}`,
                  transition: "all 0.15s",
                }}>
                  {redFlags[rf.key] && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: redFlags[rf.key] ? "#C62828" : "#444", fontWeight: redFlags[rf.key] ? 700 : 400 }}>
                  {rf.label}
                </span>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B2D9B", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Final Recommendation {suggestedRec && <span style={{ fontWeight: 400, color: "#888", textTransform: "none", letterSpacing: 0 }}>(suggested: {suggestedRec})</span>}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["Go", "Go with Caution", "No-Go"].map(r => {
              const cfg = RECOMMENDATION_CONFIG[r];
              const active = recommendation === r;
              return (
                <button key={r} onClick={() => setRecommendation(r)} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.2s",
                  border: `2px solid ${active ? cfg.border : "#E8E8E8"}`,
                  background: active ? cfg.bg : "#fff", color: active ? cfg.color : "#888",
                  boxShadow: active ? `0 2px 8px ${cfg.border}88` : "none",
                }}>{cfg.emoji} {r}</button>
              );
            })}
          </div>

          {/* Key reasons / concerns / notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#43A047", letterSpacing: 0.5, textTransform: "uppercase" }}>Key Reasons to Pursue</span>
              <textarea value={keyReasons} onChange={e => setKeyReasons(e.target.value)}
                placeholder="What makes this worth pursuing?" rows={2}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D1D1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#E53935", letterSpacing: 0.5, textTransform: "uppercase" }}>Key Concerns</span>
              <textarea value={keyConcerns} onChange={e => setKeyConcerns(e.target.value)}
                placeholder="What are the biggest concerns or risks?" rows={2}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D1D1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B2D9B", letterSpacing: 0.5, textTransform: "uppercase" }}>Internal Notes</span>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                placeholder="Any additional context for the team..." rows={2}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D1D1", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid #E8E8E8",
          display: "flex", justifyContent: "flex-end", gap: 10, background: "#fff",
        }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="teal" onClick={() => onSave({ scores, redFlags, recommendation, reviewerName, reviewDate, keyReasons, keyConcerns, internalNotes })} disabled={!valid}>
            Save Evaluation
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Signed Docs Progress Bar (for card) ───
function SignedDocsBar({ docs }) {
  if (!docs || docs.length === 0) return null;
  const done = docs.filter(d => d.done).length;
  const pct = Math.round((done / docs.length) * 100);
  const color = pct === 100 ? BRAND.green : pct >= 50 ? BRAND.teal : BRAND.midPurple;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: BRAND.gray500, fontWeight: 600 }}>Signed Docs</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {done}/{docs.length} {pct === 100 ? "✓" : ""}
        </span>
      </div>
      <div style={{ height: 5, background: BRAND.gray200, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 99,
          background: color, transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Fit Review Summary Block (shown in detail panel) ───
function FitReviewSummaryBlock({ fitReviewSummary, fitReview }) {
  if (!fitReviewSummary?.recommendation) return null;

  const { totalScore, maxScore, percentage, fitLabel, recommendation, reviewerName, reviewDate } = fitReviewSummary;

  const COLOR_MAP = {
    "Strong Fit":   { bg: "#E8F5E9", border: "#A5D6A7", color: "#2E7D32", dot: "#43A047" },
    "Moderate Fit": { bg: "#FFF8E1", border: "#FFD54F", color: "#E65100", dot: "#F9A825" },
    "Weak Fit":     { bg: "#FFF3E0", border: "#FFCC80", color: "#F57C00", dot: "#FFA726" },
    "No-Go":        { bg: "#FFEBEE", border: "#EF9A9A", color: "#C62828", dot: "#E53935" },
  };

  const style = COLOR_MAP[fitLabel] || COLOR_MAP["No-Go"];
  const rec = RECOMMENDATION_CONFIG[recommendation] || {};
  const dateStr = reviewDate
    ? new Date(reviewDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div style={{
      marginBottom: 20,
      borderRadius: 10,
      border: `1.5px solid ${style.border}`,
      background: style.bg,
      padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Score row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Score pill */}
          <span style={{
            fontSize: 15, fontWeight: 800, color: style.color,
            background: "rgba(255,255,255,0.7)", padding: "3px 12px",
            borderRadius: 20, border: `1px solid ${style.border}`,
          }}>
            {totalScore}/{maxScore}
          </span>
          {/* Fit label */}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: style.dot, display: "inline-block", flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: style.color }}>{fitLabel}</span>
          </span>
        </div>
        {/* Recommendation chip */}
        {recommendation && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            background: rec.bg || style.bg,
            color: rec.color || style.color,
            border: `1px solid ${rec.border || style.border}`,
          }}>{rec.emoji} {recommendation}</span>
        )}
      </div>

      {/* Score bar */}
      <div style={{ height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${percentage}%`, height: "100%",
          background: style.dot, borderRadius: 99, transition: "width 0.4s ease",
        }} />
      </div>

      {/* Reviewer row */}
      {(reviewerName || dateStr) && (
        <div style={{ fontSize: 11, color: style.color, opacity: 0.8 }}>
          {reviewerName && <span>Reviewed by <strong>{reviewerName}</strong></span>}
          {reviewerName && dateStr && <span> · </span>}
          {dateStr && <span>{dateStr}</span>}
          {fitReview?.keyConcerns && (
            <span style={{ display: "block", marginTop: 3, fontStyle: "italic", opacity: 0.9 }}>
              ⚑ {fitReview.keyConcerns}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RFP Detail Panel ───
function RFPDetail({ rfp, onClose, onEdit, onDelete, onFitReview, onMoveToActive, onArchiveNoGo }) {
  const urgency = getUrgencyTag(rfp.dueDate, rfp.status);
  const section = (title, children) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1,
        textTransform: "uppercase", marginBottom: 10, borderBottom: `2px solid ${BRAND.lightPurple}`,
        paddingBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
  const field = (label, val) => val ? (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>{label}: </span>
      <span style={{ fontSize: 14, color: BRAND.gray900 }}>{val}</span>
    </div>
  ) : null;

  const scopeParts = [];
  if (rfp.serviceType) scopeParts.push(rfp.serviceType);
  if (rfp.subjects?.length) scopeParts.push(rfp.subjects.join(", "));
  if (rfp.gradeLevels?.length) scopeParts.push("Grades: " + rfp.gradeLevels.join(", "));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(74,26,107,0.18)", zIndex: 1000,
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(560px, 92vw)", height: "100%", background: BRAND.white,
        boxShadow: "-8px 0 40px rgba(74,26,107,0.15)", overflowY: "auto",
        animation: "slideIn 0.25s ease-out",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.deepPurple, lineHeight: 1.2 }}>{rfp.districtName}</div>
              <div style={{ fontSize: 14, color: BRAND.gray500, marginTop: 4 }}>{rfp.rfpTitle}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: BRAND.gray500 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <StatusDot status={rfp.status} />
            {urgency && <Badge bg={urgency.bg} color={urgency.color}>{urgency.label}</Badge>}
            {rfp.state && <Badge bg={BRAND.lightPurple} color={BRAND.midPurple}>{rfp.state}</Badge>}
            {rfp.aeRequired && (
              <Badge bg="#EDE7F6" color={BRAND.midPurple}>👤 AE: {rfp.aeName || "TBD"}</Badge>
            )}
          </div>

          <FitReviewSummaryBlock fitReviewSummary={rfp.fitReviewSummary} fitReview={rfp.fitReview} />

          {scopeParts.length > 0 && section("Quick Scope of Work", <>
            {field("Service Type", rfp.serviceType)}
            {rfp.subjects?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>Subjects: </span>
                <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                  {rfp.subjects.map(s => <Badge key={s} bg="#E0F2F1" color={BRAND.tealDark}>{s}</Badge>)}
                </span>
              </div>
            )}
            {rfp.gradeLevels?.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>Grade Levels: </span>
                <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                  {rfp.gradeLevels.map(g => <Badge key={g} bg={BRAND.lightPurple} color={BRAND.midPurple}>{g}</Badge>)}
                </span>
              </div>
            )}
            {rfp.scopeNotes && field("Scope Notes", rfp.scopeNotes)}
          </>)}

          {section("Pre-Bid & Ownership", <>
            {rfp.preBidDate && field("Pre-Bid Date", formatDate(rfp.preBidDate))}
            {rfp.preBidLink && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>Pre-Bid Link: </span>
                <a href={rfp.preBidLink} target="_blank" rel="noreferrer"
                  style={{ fontSize: 14, color: BRAND.teal, wordBreak: "break-all" }}>{rfp.preBidLink}</a>
              </div>
            )}
            {field("RFP Author / Owner", rfp.rfpAuthor)}
            {rfp.aeRequired && field("Account Executive", rfp.aeName || "TBD")}
            {rfp.rfpDocLink && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>RFP Document: </span>
                <a href={rfp.rfpDocLink} target="_blank" rel="noreferrer"
                  style={{ fontSize: 14, color: BRAND.teal, wordBreak: "break-all" }}>🔗 Open Document</a>
              </div>
            )}
          </>)}

          {section("Deadline & Submission", <>
            {field("Due Date", formatDate(rfp.dueDate))}
            {field("Due Time", rfp.dueTime)}
            {field("Submission Method", rfp.submissionMethod)}
            {rfp.submissionUrl && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600 }}>Submission URL: </span>
                <a href={rfp.submissionUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: 14, color: BRAND.teal, wordBreak: "break-all" }}>{rfp.submissionUrl}</a>
              </div>
            )}
            {field("Submission Notes", rfp.submissionNotes)}
          </>)}

          {section("Primary Contact", <>
            {field("Name", rfp.contactName)}
            {field("Role", rfp.contactRole)}
            {field("Email", rfp.contactEmail)}
            {field("Phone", rfp.contactPhone)}
          </>)}

          {rfp.questionsForDistrict && section("Questions for District", (
            <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: "#FFFDE7",
              padding: 12, borderRadius: 8, lineHeight: 1.6, borderLeft: `3px solid ${BRAND.amber}` }}>{rfp.questionsForDistrict}</div>
          ))}

          {section("Requirements", <>
            {field("Estimated Value", rfp.estimatedValue)}
            {rfp.guidelines && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600, marginBottom: 4 }}>Proposal Guidelines:</div>
                <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
                  padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.guidelines}</div>
              </div>
            )}
            {Array.isArray(rfp.requiredDocs) && rfp.requiredDocs.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600, marginBottom: 6 }}>
                  Required Documents ({rfp.requiredDocs.filter(d => d.done).length}/{rfp.requiredDocs.length} complete):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {rfp.requiredDocs.map(doc => (
                    <div key={doc.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      borderRadius: 8, background: doc.done ? "#E8F5E9" : BRAND.gray100,
                      border: `1px solid ${doc.done ? "#A5D6A7" : BRAND.gray200}`,
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: `2px solid ${doc.done ? BRAND.green : BRAND.gray300}`,
                        background: doc.done ? BRAND.green : BRAND.white,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {doc.done && <span style={{ color: BRAND.white, fontSize: 12 }}>✓</span>}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: doc.done ? BRAND.green : BRAND.gray900,
                          textDecoration: doc.done ? "line-through" : "none",
                        }}>{doc.name}</div>
                        {doc.link && (
                          <a href={doc.link} target="_blank" rel="noreferrer" style={{
                            fontSize: 11, color: BRAND.teal, textDecoration: "none",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                          }}>{doc.link}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rfp.signaturesNeeded && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600, marginBottom: 4 }}>Signatures Needed:</div>
                <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
                  padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.signaturesNeeded}</div>
              </div>
            )}
          </>)}

          {rfp.notes && section("Notes", (
            <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
              padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.notes}</div>
          ))}

          {/* Fit Review Section in detail panel */}
          {rfp.status === "Under Review" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 10, borderBottom: `2px solid ${BRAND.lightPurple}`,
                paddingBottom: 6 }}>Company Fit Evaluation</div>
              {rfp.fitReview?.recommendation ? (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: BRAND.gray100, border: `1px solid ${BRAND.gray200}`, marginBottom: 12 }}>
                  <FitScoreBadge fitReview={rfp.fitReview} />
                  <div style={{ marginTop: 12 }}>
                    {FIT_SECTIONS.map(sec => {
                      const secScore = sec.questions.reduce((s, q) => s + (rfp.fitReview.scores?.[q.key] || 0), 0);
                      return <SectionBar key={sec.key} label={sec.label} score={secScore} max={sec.maxScore} />;
                    })}
                  </div>
                  {rfp.fitReview.keyReasons && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#2E7D32", background: "#E8F5E9",
                      padding: "8px 12px", borderRadius: 6, borderLeft: `3px solid #A5D6A7` }}>
                      <strong>Reasons:</strong> {rfp.fitReview.keyReasons}
                    </div>
                  )}
                  {rfp.fitReview.keyConcerns && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#C62828", background: "#FFEBEE",
                      padding: "8px 12px", borderRadius: 6, borderLeft: `3px solid #EF9A9A` }}>
                      <strong>Concerns:</strong> {rfp.fitReview.keyConcerns}
                    </div>
                  )}
                  {rfp.fitReview.internalNotes && (
                    <div style={{ marginTop: 6, fontSize: 12, color: BRAND.gray700, background: "#FFFDE7",
                      padding: "8px 12px", borderRadius: 6, borderLeft: `3px solid ${BRAND.amber}` }}>
                      <strong>Notes:</strong> {rfp.fitReview.internalNotes}
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 11, color: BRAND.gray500 }}>
                    Reviewed by {rfp.fitReview.reviewerName} · {rfp.fitReview.reviewDate ? new Date(rfp.fitReview.reviewDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </div>
                  <button onClick={onFitReview} style={{
                    marginTop: 10, fontSize: 12, fontWeight: 600, color: BRAND.midPurple,
                    background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline",
                  }}>Edit evaluation</button>
                </div>
              ) : (
                <div style={{ padding: "16px", borderRadius: 10, background: "#FFF8E1",
                  border: `1.5px dashed ${BRAND.amber}`, marginBottom: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#E65100", fontWeight: 600, marginBottom: 8 }}>No evaluation yet</div>
                  <Button variant="outline" onClick={onFitReview} style={{ fontSize: 13, padding: "8px 16px" }}>
                    🔍 Start Fit Evaluation
                  </Button>
                </div>
              )}
              {/* Move actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={onMoveToActive} style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                  background: "#E8F5E9", color: "#2E7D32", border: `1.5px solid #A5D6A7`,
                }}>✅ Move to Active</button>
                <button onClick={() => { if (window.confirm("Archive this RFP as No-Go?")) onArchiveNoGo(); }} style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                  background: "#FFEBEE", color: "#C62828", border: `1.5px solid #EF9A9A`,
                }}>🚫 Archive as No-Go</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingBottom: 28, paddingTop: 8 }}>
            <Button variant="outline" onClick={onEdit}>Edit RFP</Button>
            <Button variant="danger" onClick={() => { if (window.confirm("Delete this RFP?")) onDelete(rfp.id); }}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RFP Form Modal ───
function RFPForm({ rfp, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    ...(rfp || {}),
    subjects: rfp?.subjects || [],
    gradeLevels: rfp?.gradeLevels || [],
    requiredDocs: Array.isArray(rfp?.requiredDocs) ? rfp.requiredDocs : [],
    aeRequired: rfp?.aeRequired || false,
    aeName: rfp?.aeName || "",
  }));
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const valid = form.districtName && form.rfpTitle;
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(74,26,107,0.22)", zIndex: 1100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(680px, 95vw)", maxHeight: "90vh", background: BRAND.white,
        borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(74,26,107,0.2)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "20px 24px", background: `linear-gradient(135deg, ${BRAND.deepPurple}, ${BRAND.midPurple})`,
          color: BRAND.white, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{rfp ? "Edit RFP" : "Add New RFP"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: BRAND.white, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

          {/* District & RFP Info */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>District & RFP Info</div>
          <div style={grid2}>
            <Input label="District / Client Name" value={form.districtName} onChange={set("districtName")} placeholder="e.g. LAUSD" required />
            <Input label="RFP Title" value={form.rfpTitle} onChange={set("rfpTitle")} placeholder="e.g. K-8 Tutoring Services" required />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="State" value={form.state} onChange={set("state")} placeholder="e.g. CA" />
            <Select label="Status" value={form.status} onChange={set("status")} options={Object.keys(STATUS_CONFIG)} />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="RFP Author / Owner" value={form.rfpAuthor} onChange={set("rfpAuthor")} placeholder="Who's writing this proposal?" />
            <div />
          </div>

          {/* AE Toggle */}
          <div style={{ marginTop: 14 }}>
            <AEToggle
              aeRequired={form.aeRequired}
              aeName={form.aeName}
              onToggle={() => setForm(f => ({ ...f, aeRequired: !f.aeRequired, aeName: f.aeRequired ? "" : f.aeName }))}
              onNameChange={(val) => setForm(f => ({ ...f, aeName: val }))}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <Input label="RFP Document Link" value={form.rfpDocLink} onChange={set("rfpDocLink")}
              placeholder="Paste Google Drive, Dropbox, or any link to the RFP document" />
          </div>

          {/* Scope of Work */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Quick Scope of Work / Program Type</div>
          <Select label="Service Type" value={form.serviceType} onChange={set("serviceType")} options={SERVICE_TYPES} />
          <div style={{ marginTop: 14 }}>
            <MultiSelect label="Subject Area(s)" selected={form.subjects} options={SUBJECT_OPTIONS}
              onChange={(v) => setForm(f => ({ ...f, subjects: v }))} />
          </div>
          <div style={{ marginTop: 14 }}>
            <MultiSelect label="Grade Level(s)" selected={form.gradeLevels} options={GRADE_OPTIONS}
              onChange={(v) => setForm(f => ({ ...f, gradeLevels: v }))} />
          </div>
          <Input label="Scope Notes" value={form.scopeNotes} onChange={set("scopeNotes")} textarea
            placeholder="Any additional details about the angle or scope of this submission..." style={{ marginTop: 14 }} />

          {/* Pre-Bid */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Pre-Bid Conference</div>
          <div style={grid2}>
            <Input label="Pre-Bid Date" type="date" value={form.preBidDate} onChange={set("preBidDate")} />
            <Input label="Pre-Bid Link / Location" value={form.preBidLink} onChange={set("preBidLink")} placeholder="Zoom link, address, or URL" />
          </div>

          {/* Deadline */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Deadline & Submission</div>
          <div style={grid2}>
            <Input label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />
            <Input label="Due Time" value={form.dueTime} onChange={set("dueTime")} placeholder="e.g. 2:00 PM EST" />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="Submission Method" value={form.submissionMethod} onChange={set("submissionMethod")} placeholder="e.g. Email, Portal, Mail" />
            <Input label="Submission URL / Portal" value={form.submissionUrl} onChange={set("submissionUrl")} placeholder="https://..." />
          </div>
          <Input label="Submission Notes" value={form.submissionNotes} onChange={set("submissionNotes")} placeholder="e.g. Must include 3 hard copies" textarea style={{ marginTop: 14 }} />

          {/* Contact */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Primary Contact</div>
          <div style={grid2}>
            <Input label="Contact Name" value={form.contactName} onChange={set("contactName")} placeholder="Jane Doe" />
            <Input label="Role / Title" value={form.contactRole} onChange={set("contactRole")} placeholder="Procurement Officer" />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="Email" type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="jane@district.edu" />
            <Input label="Phone" value={form.contactPhone} onChange={set("contactPhone")} placeholder="(555) 123-4567" />
          </div>

          {/* Questions */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Questions for District</div>
          <Input label="Questions / Clarifications Needed" value={form.questionsForDistrict} onChange={set("questionsForDistrict")} textarea
            placeholder="List any questions to ask the district before or during the pre-bid..." />

          {/* Requirements */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Requirements & Documentation</div>
          <Input label="Estimated Contract Value" value={form.estimatedValue} onChange={set("estimatedValue")} placeholder="e.g. $250,000" />
          <Input label="Proposal Guidelines" value={form.guidelines} onChange={set("guidelines")} textarea
            placeholder="Page limits, formatting rules, required sections..." style={{ marginTop: 14 }} />
          <div style={{ marginTop: 14 }}>
            <RequiredDocsChecklist docs={form.requiredDocs}
              onChange={(docs) => setForm(f => ({ ...f, requiredDocs: docs }))} />
          </div>
          <Input label="Signatures Needed" value={form.signaturesNeeded} onChange={set("signaturesNeeded")} textarea
            placeholder="CEO signature on cover letter, notarized affidavit..." style={{ marginTop: 14 }} />

          {/* Notes */}
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>Additional Notes</div>
          <Input label="Notes" value={form.notes} onChange={set("notes")} textarea
            placeholder="Anything else to remember about this RFP..." />
        </div>
        <div style={{
          padding: "16px 24px", borderTop: `1px solid ${BRAND.gray200}`,
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="teal" onClick={() => onSave(form)} disabled={!valid}>
            {rfp ? "Save Changes" : "Add RFP"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── RFP Card ───
function RFPCard({ rfp, onClick }) {
  const urgency = getUrgencyTag(rfp.dueDate, rfp.status);
  const [hover, setHover] = useState(false);
  const scopeLabel = [rfp.serviceType, rfp.subjects?.length ? rfp.subjects.join(", ") : ""].filter(Boolean).join(" · ");

  const cs = getCardStyle(rfp.status);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: cs.bg,
        borderRadius: 12, padding: "18px 20px",
        cursor: "pointer", transition: "all 0.2s",
        border: `1px solid ${hover ? cs.hoverBorder : cs.border}`,
        borderTop: `3px solid ${cs.topBorder}`,
        boxShadow: hover ? "0 4px 20px rgba(74,26,107,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hover ? "translateY(-1px)" : "none",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: cs.text, marginBottom: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rfp.districtName}</div>
          <div style={{ fontSize: 13, color: cs.subtleText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rfp.rfpTitle}</div>
        </div>
        {rfp.state && <Badge bg={cs.pillBg} color={cs.pillText} style={{ marginLeft: 8 }}>{rfp.state}</Badge>}
      </div>

      {scopeLabel && (
        <div style={{ fontSize: 11, color: BRAND.tealDark, fontWeight: 600, marginBottom: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scopeLabel}</div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StatusDot status={rfp.status} />
        {urgency && <Badge bg={urgency.bg} color={urgency.color}>{urgency.label}</Badge>}
        {rfp.dueDate && (
          <span style={{ fontSize: 12, color: BRAND.gray500, marginLeft: "auto" }}>
            Due {formatDate(rfp.dueDate)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        {rfp.rfpAuthor && (
          <div style={{ fontSize: 11, color: BRAND.gray500, display: "flex", alignItems: "center", gap: 4 }}>
            <span>✍️</span> {rfp.rfpAuthor}
          </div>
        )}
        {rfp.aeRequired && (
          <div style={{ fontSize: 11, color: BRAND.midPurple, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <span>👤</span> AE: {rfp.aeName || "TBD"}
          </div>
        )}
        {rfp.submissionMethod && (
          <div style={{ fontSize: 11, color: BRAND.gray500, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📨</span> {rfp.submissionMethod}
          </div>
        )}
      </div>

      {/* Fit score badge for Under Review */}
      {rfp.status === "Under Review" && rfp.fitReview?.recommendation && (
        <div style={{ marginTop: 10 }}>
          <FitScoreBadge fitReview={rfp.fitReview} />
          {rfp.fitReview.keyConcerns && (
            <div style={{ fontSize: 11, color: "#C62828", marginTop: 5, display: "flex", gap: 4, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0 }}>⚑</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rfp.fitReview.keyConcerns}
              </span>
            </div>
          )}
        </div>
      )}
      {/* Signed docs progress bar */}
      <SignedDocsBar docs={rfp.requiredDocs} />
    </div>
  );
}

// ─── Tab definitions ───
const TABS = [
  {
    key: "active",
    label: "Active RFPs",
    statuses: ["Not Started", "In Progress"],
    activeColor:   "#1D4ED8",   // blue-700
    activeBg:      "#EFF6FF",   // blue-50
    activePill:    "#DBEAFE",   // blue-100
    activePillText:"#1D4ED8",
    underline:     "#3B82F6",   // blue-500
  },
  {
    key: "review",
    label: "Under Review",
    statuses: ["Under Review"],
    activeColor:   "#9A3412",   // orange-800
    activeBg:      "#FFF7ED",   // orange-50
    activePill:    "#FFEDD5",   // orange-100
    activePillText:"#9A3412",
    underline:     "#F97316",   // orange-500
  },
  {
    key: "archive",
    label: "Submitted Archive",
    statuses: ["Submitted", "Won", "Lost"],
    activeColor:   "#374151",   // gray-700
    activeBg:      "#F9FAFB",   // gray-50
    activePill:    "#F3F4F6",   // gray-100
    activePillText:"#374151",
    underline:     "#9CA3AF",   // gray-400
  },
];

// ─── Upcoming Deadlines – Timeline + List ───

const ACTIVE_STATUSES = ["Not Started", "In Progress", "Under Review"];

// Urgency color system for timeline markers
function getTimelineColor(days) {
  if (days === null) return { color: "#9E9E9E", bg: "#F5F5F5", label: "No date" };
  if (days < 0)   return { color: "#C62828", bg: "#FFEBEE", label: "Overdue" };
  if (days <= 3)  return { color: "#E65100", bg: "#FBE9E7", label: `${days}d left` };
  if (days <= 7)  return { color: "#F57F17", bg: "#FFF8E1", label: `${days}d left` };
  if (days <= 14) return { color: BRAND.tealDark, bg: "#E0F2F1", label: `${days}d left` };
  return           { color: "#1565C0", bg: "#E3F2FD", label: `${days}d left` };
}

const TIMELINE_LEGEND = [
  { label: "Overdue",    color: "#C62828", bg: "#FFEBEE" },
  { label: "≤ 3 days",  color: "#E65100", bg: "#FBE9E7" },
  { label: "≤ 7 days",  color: "#F57F17", bg: "#FFF8E1" },
  { label: "≤ 14 days", color: BRAND.tealDark, bg: "#E0F2F1" },
  { label: "15+ days",  color: "#1565C0", bg: "#E3F2FD" },
  { label: "No date",   color: "#9E9E9E", bg: "#F5F5F5" },
];

// Compact card used in BOTH timeline and list views
function DeadlineCard({ rfp, onClick, style }) {
  const [hover, setHover] = useState(false);
  const days = getDaysUntil(rfp.dueDate);
  const tc = getTimelineColor(days);
  const urgency = getUrgencyTag(rfp.dueDate, rfp.status);
  const cs = getCardStyle(rfp.status);
  return (
    <div
      onClick={() => onClick(rfp)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: cs.bg,
        border: `1.5px solid ${hover ? cs.hoverBorder : cs.border}`,
        borderTop: `3px solid ${cs.topBorder}`,
        borderRadius: 8, padding: "10px 12px", cursor: "pointer",
        transition: "all 0.18s",
        boxShadow: hover ? "0 3px 12px rgba(74,26,107,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
        width: 190, flexShrink: 0,
        ...style,
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 800, color: cs.text,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        marginBottom: 2,
      }}>{rfp.districtName}</div>
      <div style={{
        fontSize: 11, color: cs.subtleText,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        marginBottom: 7,
      }}>{rfp.rfpTitle}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", marginBottom: 5 }}>
        <StatusDot status={rfp.status} />
        {urgency
          ? <Badge bg={urgency.bg} color={urgency.color}>{urgency.label}</Badge>
          : <Badge bg={tc.bg} color={tc.color}>No date</Badge>
        }
      </div>
      {rfp.dueDate && (
        <div style={{ fontSize: 10, color: BRAND.gray500, fontWeight: 500 }}>
          📅 {formatDate(rfp.dueDate)}
        </div>
      )}
    </div>
  );
}

// ─── Timeline View ───
function TimelineView({ items, noDate, onCardClick }) {
  const sorted = [...items].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const allItems = [...sorted, ...noDate];

  return (
    <div style={{ position: "relative", overflowX: "auto", paddingBottom: 8 }}>
      {/* Scrollable track */}
      <div style={{ minWidth: 600, paddingTop: 52, paddingBottom: 8, position: "relative" }}>

        {/* Horizontal line */}
        <div style={{
          position: "absolute", top: 32, left: 0, right: 0,
          height: 3, background: `linear-gradient(to right, ${BRAND.deepPurple}, ${BRAND.teal})`,
          borderRadius: 99,
        }} />

        {/* Today marker */}
        <div style={{ position: "absolute", top: 14, left: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: BRAND.white,
            background: BRAND.deepPurple, padding: "2px 8px", borderRadius: 10, marginBottom: 4,
            whiteSpace: "nowrap",
          }}>TODAY</div>
          <div style={{ width: 3, height: 22, background: BRAND.deepPurple, borderRadius: 2 }} />
        </div>

        {/* Cards row */}
        <div style={{ display: "flex", gap: 16, paddingLeft: 48, paddingRight: 16, alignItems: "flex-start" }}>
          {allItems.map((rfp) => {
            const days = getDaysUntil(rfp.dueDate);
            const tc = getTimelineColor(days);
            return (
              <div key={rfp.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                {/* Date marker above the line */}
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: tc.color, background: tc.bg,
                  padding: "2px 8px", borderRadius: 10,
                  whiteSpace: "nowrap", marginBottom: 4,
                  border: `1px solid ${tc.color}33`,
                }}>{rfp.dueDate ? formatDate(rfp.dueDate) : "No date"}</div>
                {/* Tick */}
                <div style={{ width: 2, height: 10, background: tc.color, borderRadius: 2 }} />
                {/* Card */}
                <DeadlineCard rfp={rfp} onClick={onCardClick} style={{ width: 190, marginTop: 6 }} />
              </div>
            );
          })}
          {allItems.length === 0 && (
            <div style={{ fontSize: 13, color: BRAND.gray500, paddingTop: 8, paddingLeft: 8 }}>
              No active RFPs on the timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List View ───
function ListView({ items, noDate, onCardClick }) {
  const sorted = [...items].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const allItems = [...sorted, ...noDate];
  if (allItems.length === 0) return (
    <div style={{ fontSize: 13, color: BRAND.gray500, padding: "12px 0" }}>No active RFPs.</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {allItems.map(rfp => {
        const days = getDaysUntil(rfp.dueDate);
        const tc = getTimelineColor(days);
        const urgency = getUrgencyTag(rfp.dueDate, rfp.status);
        return (
          <div key={rfp.id} onClick={() => onCardClick(rfp)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: BRAND.white, border: `1px solid ${BRAND.gray200}`,
              borderLeft: `4px solid ${getCardStyle(rfp.status).topBorder}`, background: getCardStyle(rfp.status).bg,
              borderRadius: 8, padding: "10px 14px", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = BRAND.midPurple}
            onMouseLeave={e => e.currentTarget.style.borderColor = BRAND.gray200}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: getCardStyle(rfp.status).text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rfp.districtName}
              </div>
              <div style={{ fontSize: 11, color: getCardStyle(rfp.status).subtleText,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rfp.rfpTitle}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <StatusDot status={rfp.status} />
              {urgency
                ? <Badge bg={urgency.bg} color={urgency.color}>{urgency.label}</Badge>
                : <Badge bg={tc.bg} color={tc.color}>No date</Badge>
              }
              {rfp.dueDate && (
                <span style={{ fontSize: 11, color: BRAND.gray500, whiteSpace: "nowrap" }}>
                  📅 {formatDate(rfp.dueDate)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── UpcomingDeadlines wrapper ───
function UpcomingDeadlines({ rfps, onCardClick }) {
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "list"

  const active = rfps.filter(r => ACTIVE_STATUSES.includes(r.status) && r.dueDate);
  const noDate = rfps.filter(r => ACTIVE_STATUSES.includes(r.status) && !r.dueDate);
  const totalActive = active.length + noDate.length;

  if (totalActive === 0) return null;

  return (
    <div style={{
      marginBottom: 28,
      background: BRAND.white,
      borderRadius: 14,
      border: `1px solid ${BRAND.gray200}`,
      padding: "16px 20px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: collapsed ? 0 : 14 }}>
        {/* Left: title + count + toggle buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: BRAND.deepPurple }}>📅 Upcoming Deadlines</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: BRAND.lightPurple, color: BRAND.midPurple,
          }}>{totalActive} active</span>

          {/* Timeline / List toggle */}
          {!collapsed && (
            <div style={{
              display: "flex", borderRadius: 8, overflow: "hidden",
              border: `1.5px solid ${BRAND.gray200}`, flexShrink: 0,
            }}>
              {["timeline", "list"].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: "4px 12px", fontSize: 12, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer", border: "none",
                  background: viewMode === mode ? BRAND.deepPurple : BRAND.white,
                  color: viewMode === mode ? BRAND.white : BRAND.gray500,
                  transition: "all 0.15s", textTransform: "capitalize",
                }}>{mode === "timeline" ? "📊 Timeline" : "☰ List"}</button>
              ))}
            </div>
          )}
        </div>

        {/* Right: legend + hide toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Legend */}
          {!collapsed && viewMode === "timeline" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TIMELINE_LEGEND.map(l => (
                <span key={l.label} style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                  background: l.bg, color: l.color, border: `1px solid ${l.color}33`,
                }}>{l.label}</span>
              ))}
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: BRAND.gray500,
          }}>{collapsed ? "Show ▼" : "Hide ▲"}</button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        viewMode === "timeline"
          ? <TimelineView items={active} noDate={noDate} onCardClick={onCardClick} />
          : <ListView items={active} noDate={noDate} onCardClick={onCardClick} />
      )}
    </div>
  );
}


// Summary card token map — one color role per concept
const SUMMARY_TOKENS = {
  "Active RFPs":  { bg: "#EFF6FF", border: "#3B82F6", number: "#1D4ED8", label: "#3B82F6" },
  "In Progress":  { bg: "#FEFCE8", border: "#EAB308", number: "#854D0E", label: "#A16207" },
  "Under Review": { bg: "#FFF7ED", border: "#F97316", number: "#9A3412", label: "#C2410C" },
  "Due ≤ 7 Days": { bg: "#FEFCE8", border: "#EAB308", number: "#854D0E", label: "#A16207" },
  "Overdue":      { bg: "#FFF1F2", border: "#F43F5E", number: "#9F1239", label: "#BE123C" },
  "Won":          { bg: "#F0FDF4", border: "#22C55E", number: "#15803D", label: "#16A34A" },
  "Submitted":    { bg: "#F9FAFB", border: "#9CA3AF", number: "#374151", label: "#6B7280" },
  "Lost":         { bg: "#FFF1F2", border: "#F43F5E", number: "#9F1239", label: "#BE123C" },
};

function SummaryCards({ rfps, activeTab }) {
  const active = rfps.filter(r => ["Not Started", "In Progress"].includes(r.status));
  const review = rfps.filter(r => r.status === "Under Review");
  const overdue = active.filter(r => getDaysUntil(r.dueDate) !== null && getDaysUntil(r.dueDate) < 0).length;
  const dueSoon = active.filter(r => { const d = getDaysUntil(r.dueDate); return d !== null && d >= 0 && d <= 7; }).length;
  const won = rfps.filter(r => r.status === "Won").length;
  const submitted = rfps.filter(r => r.status === "Submitted").length;

  const cardsByTab = {
    active: [
      { label: "Active RFPs",  value: active.length,                                                                                            token: "Active RFPs"  },
      { label: "Due ≤ 7 Days", value: dueSoon,                                                                                                   token: "Due ≤ 7 Days" },
      { label: "Overdue",      value: overdue,                                                                                                   token: "Overdue"      },
      { label: "Won",          value: won,                                                                                                       token: "Won"          },
    ],
    review: [
      { label: "Under Review", value: review.length,                                                                                            token: "Under Review" },
      { label: "Due ≤ 7 Days", value: review.filter(r => { const d = getDaysUntil(r.dueDate); return d !== null && d >= 0 && d <= 7; }).length, token: "Due ≤ 7 Days" },
      { label: "Active RFPs",  value: active.length,                                                                                            token: "Active RFPs"  },
      { label: "Won",          value: won,                                                                                                       token: "Won"          },
    ],
    archive: [
      { label: "Submitted",    value: submitted,                                                                                                 token: "Submitted"    },
      { label: "Won",          value: won,                                                                                                       token: "Won"          },
      { label: "Lost",         value: rfps.filter(r => r.status === "Lost").length,                                                             token: "Lost"         },
      { label: "Active RFPs",  value: active.length,                                                                                            token: "Active RFPs"  },
    ],
  };

  const cards = cardsByTab[activeTab] || cardsByTab.active;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
      {cards.map(c => {
        const t = SUMMARY_TOKENS[c.token] || SUMMARY_TOKENS["Active RFPs"];
        return (
          <div key={c.label} style={{
            background: t.bg, borderRadius: 12, padding: "16px 18px",
            borderLeft: `4px solid ${t.border}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: t.number, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.label, marginTop: 5, letterSpacing: 0.2 }}>{c.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main App ───
export default function HeyTutorRFPTracker() {
  const [rfps, setRfps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState(null);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [archiveFilter, setArchiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [fitReviewTarget, setFitReviewTarget] = useState(null);

  useEffect(() => {
    loadRFPs().then(data => { setRfps(data); setLoaded(true); });
  }, []);

  const handleSave = useCallback(async (form) => {
    let updated;
    if (editing && editing !== "new") {
      updated = { ...form, id: editing.id };
      setRfps(prev => prev.map(r => r.id === editing.id ? updated : r));
      setView(updated);
    } else {
      updated = { ...form, id: Date.now().toString() };
      setRfps(prev => [...prev, updated]);
    }
    await saveRFP(updated);
    setEditing(null);
  }, [editing]);

  const handleFitReviewSave = useCallback(async (rfpId, fitReview) => {
    const total = calcFitTotal(fitReview.scores);
    const rfCount = calcRedFlagCount(fitReview.redFlags);
    const band = getScoreBand(total, rfCount);
    const fitReviewSummary = {
      totalScore: total,
      maxScore: TOTAL_MAX,
      percentage: Math.round((total / TOTAL_MAX) * 100),
      fitLabel: band.statusLabel,
      recommendation: fitReview.recommendation,
      reviewerName: fitReview.reviewerName,
      reviewDate: fitReview.reviewDate,
    };
    setRfps(prev => prev.map(r => {
      if (r.id !== rfpId) return r;
      const updated = { ...r, fitReview, fitReviewSummary };
      saveRFP(updated);
      if (view && view.id === rfpId) setView(updated);
      return updated;
    }));
    setFitReviewTarget(null);
  }, [view]);

  const handleMoveToActive = useCallback(async (rfpId) => {
    setRfps(prev => prev.map(r => {
      if (r.id !== rfpId) return r;
      const updated = { ...r, status: "In Progress" };
      saveRFP(updated);
      return updated;
    }));
    setView(null);
  }, []);

  const handleArchiveNoGo = useCallback(async (rfpId) => {
    setRfps(prev => prev.map(r => {
      if (r.id !== rfpId) return r;
      const updated = { ...r, status: "Lost" };
      saveRFP(updated);
      return updated;
    }));
    setView(null);
  }, []);

  const handleDelete = useCallback(async (id) => {
    setRfps(prev => prev.filter(r => r.id !== id));
    setView(null);
    await deleteRFP(id);
  }, []);

  // ─── Filtering ───
  const currentTab = TABS.find(t => t.key === activeTab);
  const filtered = rfps
    .filter(r => currentTab.statuses.includes(r.status))
    .filter(r => activeTab === "archive" && archiveFilter !== "All" ? r.status === archiveFilter : true)
    .filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return r.districtName.toLowerCase().includes(s) || r.rfpTitle.toLowerCase().includes(s) ||
        r.state?.toLowerCase().includes(s) || r.contactName?.toLowerCase().includes(s) ||
        r.rfpAuthor?.toLowerCase().includes(s) || r.serviceType?.toLowerCase().includes(s) ||
        r.aeName?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1; if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "district") return a.districtName.localeCompare(b.districtName);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: BRAND.offWhite }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.deepPurple} 0%, ${BRAND.midPurple} 100%)`,
        padding: "24px 32px", color: BRAND.white,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
                <span style={{ color: BRAND.teal }}>Hey</span>Tutor RFP Tracker
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>Manage proposals, deadlines & submissions</div>
            </div>
            <Button variant="teal" onClick={() => setEditing("new")} style={{ fontWeight: 700 }}>+ New RFP</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        <SummaryCards rfps={rfps} activeTab={activeTab} />

        <UpcomingDeadlines rfps={rfps} onCardClick={(rfp) => setView(rfp)} />

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
          borderBottom: `2px solid ${BRAND.gray200}`,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = rfps.filter(r => tab.statuses.includes(r.status)).length;
            return (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(""); setArchiveFilter("All"); }}
                style={{
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                  transition: "all 0.18s", marginBottom: -2,
                  display: "flex", alignItems: "center", gap: 7,
                  background: isActive ? tab.activeBg : "transparent",
                  color: isActive ? tab.activeColor : BRAND.gray500,
                  borderBottom: isActive ? `3px solid ${tab.underline}` : "3px solid transparent",
                  borderRadius: isActive ? "8px 8px 0 0" : 0,
                }}>
                {tab.label}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                  background: isActive ? tab.activePill : BRAND.gray200,
                  color: isActive ? tab.activePillText : BRAND.gray500,
                  transition: "all 0.18s",
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${currentTab.label.toLowerCase()}...`}
            style={{
              flex: "1 1 220px", padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${BRAND.gray300}`, fontSize: 14,
              fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 180,
            }} />
          {activeTab === "archive" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Submitted", "Won", "Lost"].map(f => (
                <button key={f} onClick={() => setArchiveFilter(f)} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s",
                  border: `1.5px solid ${archiveFilter === f ? BRAND.midPurple : BRAND.gray300}`,
                  background: archiveFilter === f ? BRAND.lightPurple : BRAND.white,
                  color: archiveFilter === f ? BRAND.midPurple : BRAND.gray700,
                }}>{f}</button>
              ))}
            </div>
          )}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: "10px 14px", borderRadius: 8, border: `1px solid ${BRAND.gray300}`,
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: BRAND.white, cursor: "pointer",
          }}>
            <option value="dueDate">Sort: Due Date</option>
            <option value="district">Sort: District</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>

        {/* Grid */}
        {!loaded ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: BRAND.gray500 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Loading RFPs...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", color: BRAND.gray500,
            background: BRAND.white, borderRadius: 16, border: `1px dashed ${BRAND.gray300}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === "archive" ? "🗂️" : "📋"}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {rfps.length === 0 ? "No RFPs yet" : `No ${currentTab.label.toLowerCase()} found`}
            </div>
            <div style={{ fontSize: 13 }}>
              {rfps.length === 0 ? `Click "+ New RFP" to start tracking your first proposal.` : "Try adjusting your search or filters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {filtered.map(rfp => (
              <RFPCard key={rfp.id} rfp={rfp} onClick={() => setView(rfp)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {view && !editing && (
        <RFPDetail rfp={view} onClose={() => setView(null)}
          onEdit={() => setEditing(view)} onDelete={handleDelete}
          onFitReview={() => setFitReviewTarget(view)}
          onMoveToActive={() => handleMoveToActive(view.id)}
          onArchiveNoGo={() => handleArchiveNoGo(view.id)} />
      )}
      {fitReviewTarget && (
        <FitReviewModal rfp={fitReviewTarget}
          onSave={(fitReview) => handleFitReviewSave(fitReviewTarget.id, fitReview)}
          onClose={() => setFitReviewTarget(null)} />
      )}
      {editing && (
        <RFPForm rfp={editing === "new" ? null : editing}
          onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
