import { useState, useEffect, useCallback } from "react";

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

// A required doc item: { id, label, url, checked }
function makeDoc(label = "", url = "") {
  return { id: Date.now().toString() + Math.random(), label, url, checked: false };
}

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
  requiredDocs: [],   // now an array of doc objects
  signaturesNeeded: "",
  estimatedValue: "",
  notes: "",
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

// Migrate old string requiredDocs to array format
function normalizeForm(form) {
  if (typeof form.requiredDocs === "string") {
    const lines = form.requiredDocs.split("\n").filter(l => l.trim());
    return {
      ...form,
      requiredDocs: lines.length > 0 ? lines.map(l => makeDoc(l.trim())) : [],
    };
  }
  return form;
}

// ─── Persistent Storage Helpers ───
const STORAGE_KEY = "heytutor-rfps";

async function loadRFPs() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (!result) return [];
    const parsed = JSON.parse(result.value);
    return parsed.map(normalizeForm);
  } catch { return []; }
}

async function saveRFPs(rfps) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(rfps));
  } catch (e) { console.error("Storage save error:", e); }
}

// ─── Components ───

function Badge({ children, bg, color, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.3, background: bg, color, whiteSpace: "nowrap", ...style,
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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
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

// ─── Required Docs Checklist Editor (used in Form) ───
function DocChecklistEditor({ docs, onChange }) {
  const add = () => onChange([...docs, makeDoc()]);
  const remove = (id) => onChange(docs.filter(d => d.id !== id));
  const update = (id, field, val) => onChange(docs.map(d => d.id === id ? { ...d, [field]: val } : d));

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray700, letterSpacing: 0.3, marginBottom: 8 }}>
        Required Documents
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {docs.map((doc) => (
          <div key={doc.id} style={{
            display: "grid", gridTemplateColumns: "auto 1fr 1fr auto",
            gap: 8, alignItems: "center",
            background: doc.checked ? "#F3EBF9" : BRAND.gray100,
            borderRadius: 8, padding: "8px 10px",
            border: `1px solid ${doc.checked ? BRAND.midPurple + "44" : BRAND.gray200}`,
            transition: "all 0.2s",
          }}>
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={doc.checked}
              onChange={e => update(doc.id, "checked", e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: BRAND.midPurple }}
            />
            {/* Label */}
            <input
              type="text"
              value={doc.label}
              onChange={e => update(doc.id, "label", e.target.value)}
              placeholder="Document name (e.g. W-9)"
              style={{
                padding: "6px 10px", border: `1px solid ${BRAND.gray300}`, borderRadius: 6,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
                background: BRAND.white, textDecoration: doc.checked ? "line-through" : "none",
                color: doc.checked ? BRAND.gray500 : BRAND.gray900,
              }}
              onFocus={e => e.target.style.borderColor = BRAND.midPurple}
              onBlur={e => e.target.style.borderColor = BRAND.gray300}
            />
            {/* URL */}
            <input
              type="url"
              value={doc.url}
              onChange={e => update(doc.id, "url", e.target.value)}
              placeholder="Link (optional)"
              style={{
                padding: "6px 10px", border: `1px solid ${BRAND.gray300}`, borderRadius: 6,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
                background: BRAND.white, color: BRAND.teal,
              }}
              onFocus={e => e.target.style.borderColor = BRAND.midPurple}
              onBlur={e => e.target.style.borderColor = BRAND.gray300}
            />
            {/* Remove */}
            <button onClick={() => remove(doc.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: BRAND.gray500, fontSize: 16, lineHeight: 1, padding: "0 4px",
            }} title="Remove">×</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{
        marginTop: 10, padding: "7px 14px", borderRadius: 7, fontSize: 13,
        fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
        background: BRAND.lightPurple, color: BRAND.midPurple,
        border: `1.5px dashed ${BRAND.midPurple}`, transition: "all 0.2s",
      }}>+ Add Document</button>
    </div>
  );
}

// ─── Required Docs Checklist Display (used in Detail panel) ───
function DocChecklistDisplay({ docs, onToggle }) {
  if (!docs || docs.length === 0) return <div style={{ fontSize: 13, color: BRAND.gray500 }}>No documents listed.</div>;
  const completed = docs.filter(d => d.checked).length;
  const pct = Math.round((completed / docs.length) * 100);

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, background: BRAND.gray200, borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: 99,
            background: pct === 100 ? BRAND.green : BRAND.midPurple,
            transition: "width 0.3s ease",
          }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? BRAND.green : BRAND.midPurple, whiteSpace: "nowrap" }}>
          {completed}/{docs.length} done
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {docs.map(doc => (
          <div key={doc.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 8,
            background: doc.checked ? "#F3EBF9" : BRAND.gray100,
            border: `1px solid ${doc.checked ? BRAND.midPurple + "44" : BRAND.gray200}`,
            transition: "all 0.2s",
          }}>
            <input
              type="checkbox"
              checked={doc.checked}
              onChange={() => onToggle(doc.id)}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: BRAND.midPurple, flexShrink: 0 }}
            />
            <span style={{
              fontSize: 13, flex: 1,
              textDecoration: doc.checked ? "line-through" : "none",
              color: doc.checked ? BRAND.gray500 : BRAND.gray900,
            }}>{doc.label || <em style={{ color: BRAND.gray500 }}>Unnamed document</em>}</span>
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noreferrer" style={{
                fontSize: 12, color: BRAND.teal, fontWeight: 600, whiteSpace: "nowrap",
                textDecoration: "none", padding: "2px 8px", borderRadius: 5,
                background: "#E0F7F6", flexShrink: 0,
              }}>🔗 Open</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RFP Detail Panel ───
function RFPDetail({ rfp, onClose, onEdit, onDelete, onToggleDoc }) {
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

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(74,26,107,0.18)", zIndex: 1000,
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(520px, 92vw)", height: "100%", background: BRAND.white,
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
          </div>

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

          {section("Requirements", <>
            {field("Estimated Value", rfp.estimatedValue)}
            {rfp.guidelines && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: BRAND.gray500, fontWeight: 600, marginBottom: 4 }}>Proposal Guidelines:</div>
                <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
                  padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.guidelines}</div>
              </div>
            )}
          </>)}

          {section("Required Documents", (
            <DocChecklistDisplay
              docs={rfp.requiredDocs || []}
              onToggle={(docId) => onToggleDoc(rfp.id, docId)}
            />
          ))}

          {rfp.signaturesNeeded && section("Signatures Needed", (
            <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
              padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.signaturesNeeded}</div>
          ))}

          {rfp.notes && section("Notes", (
            <div style={{ fontSize: 13, color: BRAND.gray700, whiteSpace: "pre-wrap", background: BRAND.gray100,
              padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{rfp.notes}</div>
          ))}

          <div style={{ display: "flex", gap: 10, paddingBottom: 28, paddingTop: 8 }}>
            <Button variant="outline" onClick={onEdit}>Edit RFP</Button>
            <Button variant="danger" onClick={() => { if (confirm("Delete this RFP?")) onDelete(rfp.id); }}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RFP Form Modal ───
function RFPForm({ rfp, onSave, onClose }) {
  const [form, setForm] = useState(() => normalizeForm(rfp || INITIAL_FORM));
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const valid = form.districtName && form.rfpTitle;
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(74,26,107,0.22)", zIndex: 1100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(640px, 95vw)", maxHeight: "90vh", background: BRAND.white,
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
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
            District & RFP Info
          </div>
          <div style={grid2}>
            <Input label="District / Client Name" value={form.districtName} onChange={set("districtName")} placeholder="e.g. LAUSD" required />
            <Input label="RFP Title" value={form.rfpTitle} onChange={set("rfpTitle")} placeholder="e.g. K-8 Tutoring Services" required />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="State" value={form.state} onChange={set("state")} placeholder="e.g. CA" />
            <Select label="Status" value={form.status} onChange={set("status")} options={Object.keys(STATUS_CONFIG)} />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />
            <Input label="Due Time" value={form.dueTime} onChange={set("dueTime")} placeholder="e.g. 2:00 PM EST" />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>
            Primary Contact
          </div>
          <div style={grid2}>
            <Input label="Contact Name" value={form.contactName} onChange={set("contactName")} placeholder="Jane Doe" />
            <Input label="Role / Title" value={form.contactRole} onChange={set("contactRole")} placeholder="Procurement Officer" />
          </div>
          <div style={{ ...grid2, marginTop: 14 }}>
            <Input label="Email" type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="jane@district.edu" />
            <Input label="Phone" value={form.contactPhone} onChange={set("contactPhone")} placeholder="(555) 123-4567" />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>
            Submission Details
          </div>
          <div style={grid2}>
            <Input label="Submission Method" value={form.submissionMethod} onChange={set("submissionMethod")} placeholder="e.g. Email, Portal, Mail" />
            <Input label="Submission URL / Portal" value={form.submissionUrl} onChange={set("submissionUrl")} placeholder="https://..." />
          </div>
          <Input label="Submission Notes" value={form.submissionNotes} onChange={set("submissionNotes")} placeholder="e.g. Must include 3 hard copies" textarea style={{ marginTop: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>
            Requirements & Documentation
          </div>
          <Input label="Estimated Contract Value" value={form.estimatedValue} onChange={set("estimatedValue")} placeholder="e.g. $250,000" />
          <Input label="Proposal Guidelines" value={form.guidelines} onChange={set("guidelines")} textarea
            placeholder="Page limits, formatting rules, required sections..." style={{ marginTop: 14 }} />

          <div style={{ marginTop: 14 }}>
            <DocChecklistEditor
              docs={form.requiredDocs || []}
              onChange={(docs) => setForm(f => ({ ...f, requiredDocs: docs }))}
            />
          </div>

          <Input label="Signatures Needed" value={form.signaturesNeeded} onChange={set("signaturesNeeded")} textarea
            placeholder="CEO signature on cover letter, notarized affidavit..." style={{ marginTop: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.midPurple, letterSpacing: 1, textTransform: "uppercase", marginTop: 28, marginBottom: 14 }}>
            Additional Notes
          </div>
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
  const docs = rfp.requiredDocs || [];
  const checkedCount = docs.filter(d => d.checked).length;

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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StatusDot status={rfp.status} />
        {urgency && <Badge bg={urgency.bg} color={urgency.color}>{urgency.label}</Badge>}
        {rfp.dueDate && (
          <span style={{ fontSize: 12, color: BRAND.gray500, marginLeft: "auto" }}>
            Due {formatDate(rfp.dueDate)}
          </span>
        )}
      </div>
      {rfp.submissionMethod && (
        <div style={{ fontSize: 12, color: BRAND.gray500, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14 }}>📨</span> {rfp.submissionMethod}
        </div>
      )}
      {/* Doc progress mini-bar on card */}
      {docs.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: BRAND.gray500 }}>Docs</span>
            <span style={{ fontSize: 11, color: checkedCount === docs.length ? BRAND.green : BRAND.midPurple, fontWeight: 600 }}>
              {checkedCount}/{docs.length}
            </span>
          </div>
          <div style={{ height: 4, background: BRAND.gray200, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${Math.round((checkedCount / docs.length) * 100)}%`,
              height: "100%", borderRadius: 99,
              background: checkedCount === docs.length ? BRAND.green : BRAND.midPurple,
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary Cards ───
function SummaryCards({ rfps }) {
  const active = rfps.filter(r => !["Won", "Lost", "Submitted"].includes(r.status));
  const overdue = active.filter(r => getDaysUntil(r.dueDate) !== null && getDaysUntil(r.dueDate) < 0).length;
  const dueSoon = active.filter(r => { const d = getDaysUntil(r.dueDate); return d !== null && d >= 0 && d <= 7; }).length;
  const won = rfps.filter(r => r.status === "Won").length;

  const cards = [
    { label: "Active RFPs", value: active.length, color: BRAND.midPurple, bg: "#EDE7F6" },
    { label: "Due ≤ 7 Days", value: dueSoon, color: "#E65100", bg: "#FFF8E1" },
    { label: "Overdue", value: overdue, color: BRAND.red, bg: "#FFEBEE" },
    { label: "Won", value: won, color: BRAND.teal, bg: "#E0F2F1" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: c.bg, borderRadius: 12, padding: "16px 18px",
          borderLeft: `4px solid ${c.color}`,
        }}>
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
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");

  useEffect(() => { loadRFPs().then(data => { setRfps(data); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) saveRFPs(rfps); }, [rfps, loaded]);

  const handleSave = useCallback((form) => {
    if (editing && editing !== "new") {
      const updated = { ...form, id: editing.id };
      setRfps(prev => prev.map(r => r.id === editing.id ? updated : r));
      setView(updated);
    } else {
      const newRfp = { ...form, id: Date.now().toString() };
      setRfps(prev => [...prev, newRfp]);
    }
    setEditing(null);
  }, [editing]);

  const handleDelete = useCallback((id) => {
    setRfps(prev => prev.filter(r => r.id !== id));
    setView(null);
  }, []);

  // Toggle a doc's checked state directly from the detail panel
  const handleToggleDoc = useCallback((rfpId, docId) => {
    setRfps(prev => prev.map(r => {
      if (r.id !== rfpId) return r;
      const updatedDocs = (r.requiredDocs || []).map(d =>
        d.id === docId ? { ...d, checked: !d.checked } : d
      );
      const updated = { ...r, requiredDocs: updatedDocs };
      // Keep view in sync
      setView(v => v && v.id === rfpId ? updated : v);
      return updated;
    }));
  }, []);

  const filtered = rfps
    .filter(r => filter === "All" || r.status === filter)
    .filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return r.districtName.toLowerCase().includes(s) || r.rfpTitle.toLowerCase().includes(s) ||
        r.state?.toLowerCase().includes(s) || r.contactName?.toLowerCase().includes(s);
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
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      minHeight: "100vh", background: BRAND.offWhite,
    }}>
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
            <Button variant="teal" onClick={() => setEditing("new")} style={{ fontWeight: 700 }}>
              + New RFP
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        <SummaryCards rfps={rfps} />

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search districts, titles, contacts..."
            style={{
              flex: "1 1 220px", padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${BRAND.gray300}`, fontSize: 14,
              fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 180,
            }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{
            padding: "10px 14px", borderRadius: 8, border: `1px solid ${BRAND.gray300}`,
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: BRAND.white, cursor: "pointer",
          }}>
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", color: BRAND.gray500,
            background: BRAND.white, borderRadius: 16, border: `1px dashed ${BRAND.gray300}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {rfps.length === 0 ? "No RFPs yet" : "No matches found"}
            </div>
            <div style={{ fontSize: 13 }}>
              {rfps.length === 0 ? "Click \"+ New RFP\" to start tracking your first proposal." : "Try adjusting your filters or search."}
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
          onToggleDoc={handleToggleDoc} />
      )}
      {editing && (
        <RFPForm rfp={editing === "new" ? null : editing}
          onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
