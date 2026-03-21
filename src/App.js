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

// ─── RFP Detail Panel ───
function RFPDetail({ rfp, onClose, onEdit, onDelete }) {
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

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: BRAND.white, borderRadius: 12, padding: "18px 20px",
        cursor: "pointer", transition: "all 0.2s",
        border: `1px solid ${hover ? BRAND.midPurple : BRAND.gray200}`,
        boxShadow: hover ? "0 4px 20px rgba(74,26,107,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hover ? "translateY(-1px)" : "none",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.deepPurple, marginBottom: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rfp.districtName}</div>
          <div style={{ fontSize: 13, color: BRAND.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rfp.rfpTitle}</div>
        </div>
        {rfp.state && <Badge bg={BRAND.lightPurple} color={BRAND.midPurple} style={{ marginLeft: 8 }}>{rfp.state}</Badge>}
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

      {/* Signed docs progress bar */}
      <SignedDocsBar docs={rfp.requiredDocs} />
    </div>
  );
}

// ─── Tab definitions ───
const TABS = [
  { key: "active", label: "Active RFPs", statuses: ["Not Started", "In Progress"] },
  { key: "review", label: "Under Review", statuses: ["Under Review"] },
  { key: "archive", label: "Submitted Archive", statuses: ["Submitted", "Won", "Lost"] },
];

// ─── Summary Cards ───
function SummaryCards({ rfps, activeTab }) {
  const active = rfps.filter(r => ["Not Started", "In Progress"].includes(r.status));
  const review = rfps.filter(r => r.status === "Under Review");
  const overdue = active.filter(r => getDaysUntil(r.dueDate) !== null && getDaysUntil(r.dueDate) < 0).length;
  const dueSoon = active.filter(r => { const d = getDaysUntil(r.dueDate); return d !== null && d >= 0 && d <= 7; }).length;
  const won = rfps.filter(r => r.status === "Won").length;
  const submitted = rfps.filter(r => r.status === "Submitted").length;

  const cardsByTab = {
    active: [
      { label: "Active RFPs", value: active.length, color: BRAND.midPurple, bg: "#EDE7F6" },
      { label: "Due ≤ 7 Days", value: dueSoon, color: "#E65100", bg: "#FFF8E1" },
      { label: "Overdue", value: overdue, color: BRAND.red, bg: "#FFEBEE" },
      { label: "Won", value: won, color: BRAND.teal, bg: "#E0F2F1" },
    ],
    review: [
      { label: "Under Review", value: review.length, color: "#E65100", bg: "#FFF8E1" },
      { label: "Due ≤ 7 Days", value: review.filter(r => { const d = getDaysUntil(r.dueDate); return d !== null && d >= 0 && d <= 7; }).length, color: BRAND.red, bg: "#FFEBEE" },
      { label: "Active RFPs", value: active.length, color: BRAND.midPurple, bg: "#EDE7F6" },
      { label: "Won", value: won, color: BRAND.teal, bg: "#E0F2F1" },
    ],
    archive: [
      { label: "Submitted", value: submitted, color: BRAND.green, bg: "#E8F5E9" },
      { label: "Won", value: won, color: BRAND.teal, bg: "#E0F2F1" },
      { label: "Lost", value: rfps.filter(r => r.status === "Lost").length, color: BRAND.red, bg: "#FFEBEE" },
      { label: "Active RFPs", value: active.length, color: BRAND.midPurple, bg: "#EDE7F6" },
    ],
  };

  const cards = cardsByTab[activeTab] || cardsByTab.active;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: "16px 18px", borderLeft: `4px solid ${c.color}` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.color, marginTop: 4, opacity: 0.8 }}>{c.label}</div>
        </div>
      ))}
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

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          borderBottom: `2px solid ${BRAND.gray200}`,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = rfps.filter(r => tab.statuses.includes(r.status)).length;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); setArchiveFilter("All"); }}
                style={{
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
                  background: "transparent", transition: "all 0.2s",
                  color: isActive ? BRAND.deepPurple : BRAND.gray500,
                  borderBottom: isActive ? `3px solid ${BRAND.deepPurple}` : "3px solid transparent",
                  marginBottom: -2, display: "flex", alignItems: "center", gap: 8,
                }}>
                {tab.label}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                  background: isActive ? BRAND.lightPurple : BRAND.gray200,
                  color: isActive ? BRAND.midPurple : BRAND.gray500,
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
          onEdit={() => setEditing(view)} onDelete={handleDelete} />
      )}
      {editing && (
        <RFPForm rfp={editing === "new" ? null : editing}
          onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
