import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Upload, X, Check, Calendar } from "lucide-react";
import { useDataManagement } from "../hooks/useDataManagement";

const tabs = ["Faculty", "Subjects", "Classrooms", "Batches", "Constraints"];

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-lg p-6 mx-4 shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-600">{label}</span>{children}</label>;
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm";
const btnPrimary = "rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2.5 text-sm font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-600/20 disabled:opacity-60";
const btnDanger = "p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition";
const btnEdit = "p-2 rounded-xl text-primary-500 hover:bg-primary-50 transition";

function AvailabilityGrid({ faculty, timeslots, availability, onSave, onClose }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hours = [...new Set(timeslots.map((s) => `${s.start_time}-${s.end_time}`))];
  const slotMap = {};
  timeslots.forEach((s) => { slotMap[`${s.day}-${s.start_time}-${s.end_time}`] = s; });
  const initial = {};
  (availability?.slots || []).forEach((s) => { initial[s.timeslot_id] = s.is_available; });
  const [grid, setGrid] = useState(initial);
  const toggle = (id) => setGrid((p) => ({ ...p, [id]: !p[id] }));
  const save = () => {
    const slots = Object.entries(grid).map(([id, v]) => ({ timeslot_id: parseInt(id), is_available: v }));
    onSave(faculty.id, slots);
    onClose();
  };
  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Click slots to toggle availability for <span className="text-slate-800 font-semibold">{faculty.name}</span></p>
      <div className="overflow-x-auto">
        <div className="grid gap-1 min-w-[600px]" style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}>
          <div className="text-xs font-medium text-slate-400 p-2">Time</div>
          {days.map((d) => <div key={d} className="text-xs text-slate-600 text-center p-2 font-semibold">{d.slice(0, 3)}</div>)}
          {hours.map((h) => {
            const [st, et] = h.split("-");
            return (
              <div key={h} className="contents">
                <div className="text-xs text-slate-500 p-2 flex items-center">{h}</div>
                {days.map((d) => {
                  const slot = slotMap[`${d}-${st}-${et}`];
                  if (!slot) return <div key={`${d}-${h}`} className="rounded-lg bg-slate-50 p-2" />;
                  const avail = grid[slot.id] !== undefined ? grid[slot.id] : true;
                  return (
                    <button key={slot.id} onClick={() => toggle(slot.id)}
                      className={`rounded-lg p-2 text-xs font-semibold transition cursor-pointer ${avail ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-500 border border-rose-200"}`}>
                      {avail ? "✓" : "✗"}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 mt-5 justify-end">
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition">Cancel</button>
        <button onClick={save} className={btnPrimary}>Save Availability</button>
      </div>
    </div>
  );
}

export function DataManagementPanel() {
  const dm = useDataManagement();
  const [tab, setTab] = useState("Faculty");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [availFaculty, setAvailFaculty] = useState(null);
  const csvRef = useRef(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const openAdd = (defaults = {}) => { setEditId(null); setForm(defaults); setModal("form"); };
  const openEdit = (item) => { setEditId(item.id); setForm({ ...item }); setModal("form"); };
  const close = () => { setModal(null); setEditId(null); setForm({}); setAvailFaculty(null); };

  const openAvailability = async (f) => {
    await dm.loadAvailability(f.id);
    setAvailFaculty(f);
    setModal("availability");
  };

  const handleCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (tab === "Faculty") await dm.importFaculty(file);
    else if (tab === "Subjects") await dm.importSubjects(file);
    if (csvRef.current) csvRef.current.value = "";
  };

  const handleSave = async () => {
    if (tab === "Faculty") {
      const payload = { name: form.name, email: form.email, department_id: parseInt(form.department_id), leave_probability: parseFloat(form.leave_probability || 0), max_hours_per_week: parseInt(form.max_hours_per_week || 18), subject_ids: form.subject_ids || [] };
      editId ? await dm.editFaculty(editId, payload) : await dm.addFaculty(payload);
    } else if (tab === "Subjects") {
      const payload = { name: form.name, code: form.code, hours_per_week: parseInt(form.hours_per_week), is_heavy: !!form.is_heavy, is_lab: !!form.is_lab };
      editId ? await dm.editSubject(editId, payload) : await dm.addSubject(payload);
    } else if (tab === "Classrooms") {
      const payload = { name: form.name, capacity: parseInt(form.capacity), room_type: form.room_type || "lecture", department_id: parseInt(form.department_id) };
      editId ? await dm.editClassroom(editId, payload) : await dm.addClassroom(payload);
    } else if (tab === "Batches") {
      const payload = { name: form.name, students: parseInt(form.students), semester: parseInt(form.semester), shift: form.shift || "morning", department_id: parseInt(form.department_id) };
      editId ? await dm.editBatch(editId, payload) : await dm.addBatch(payload);
    } else if (tab === "Constraints") {
      const payload = { name: form.name, category: form.category || "soft", weight: parseInt(form.weight || 0), scope: form.scope || "global", rule_definition: form.rule_definition || "" };
      editId ? await dm.editConstraint(editId, payload) : await dm.addConstraint(payload);
    }
    close();
  };

  const handleDelete = async (id) => {
    if (tab === "Faculty") await dm.removeFaculty(id);
    else if (tab === "Subjects") await dm.removeSubject(id);
    else if (tab === "Classrooms") await dm.removeClassroom(id);
    else if (tab === "Batches") await dm.removeBatch(id);
    else if (tab === "Constraints") await dm.removeConstraint(id);
  };

  const renderForm = () => {
    if (tab === "Faculty") return (
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Jane Doe" /></Field>
        <Field label="Email"><input className={inputClass} value={form.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="jane@university.local" /></Field>
        <Field label="Department">
          <select className={inputClass} value={form.department_id || ""} onChange={(e) => set("department_id", e.target.value)}>
            <option value="">Select department</option>
            {dm.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Leave Probability"><input type="number" step="0.01" min="0" max="1" className={inputClass} value={form.leave_probability ?? 0} onChange={(e) => set("leave_probability", e.target.value)} /></Field>
          <Field label="Max Hours/Week"><input type="number" min="1" max="40" className={inputClass} value={form.max_hours_per_week ?? 18} onChange={(e) => set("max_hours_per_week", e.target.value)} /></Field>
        </div>
        <Field label="Assign Subjects">
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
            {dm.subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded accent-primary-600" 
                  checked={(form.subject_ids || []).includes(s.id)}
                  onChange={(e) => {
                    const ids = form.subject_ids || [];
                    if (e.target.checked) {
                      set("subject_ids", [...ids, s.id]);
                    } else {
                      set("subject_ids", ids.filter(id => id !== s.id));
                    }
                  }}
                />
                <span className="text-sm text-slate-700">{s.name} ({s.code})</span>
              </label>
            ))}
            {dm.subjects.length === 0 && (
              <p className="text-sm text-slate-400 italic">No subjects available.</p>
            )}
          </div>
        </Field>
      </div>
    );
    if (tab === "Subjects") return (
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Algorithms" /></Field>
        <Field label="Code"><input className={inputClass} value={form.code || ""} onChange={(e) => set("code", e.target.value)} placeholder="CS301" /></Field>
        <Field label="Hours/Week"><input type="number" min="1" max="20" className={inputClass} value={form.hours_per_week ?? ""} onChange={(e) => set("hours_per_week", e.target.value)} /></Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={!!form.is_heavy} onChange={(e) => set("is_heavy", e.target.checked)} className="rounded accent-primary-600" />Heavy Subject</label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={!!form.is_lab} onChange={(e) => set("is_lab", e.target.checked)} className="rounded accent-emerald-600" />Lab Course</label>
        </div>
      </div>
    );
    if (tab === "Classrooms") return (
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="LH-201" /></Field>
        <Field label="Capacity"><input type="number" min="1" className={inputClass} value={form.capacity ?? ""} onChange={(e) => set("capacity", e.target.value)} /></Field>
        <Field label="Type">
          <select className={inputClass} value={form.room_type || "lecture"} onChange={(e) => set("room_type", e.target.value)}>
            <option value="lecture">Lecture</option><option value="lab">Lab</option>
          </select>
        </Field>
        <Field label="Department">
          <select className={inputClass} value={form.department_id || ""} onChange={(e) => set("department_id", e.target.value)}>
            <option value="">Select</option>
            {dm.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
    );
    if (tab === "Batches") return (
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="CSE 6A" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Students"><input type="number" min="1" className={inputClass} value={form.students ?? ""} onChange={(e) => set("students", e.target.value)} /></Field>
          <Field label="Semester"><input type="number" min="1" max="12" className={inputClass} value={form.semester ?? ""} onChange={(e) => set("semester", e.target.value)} /></Field>
        </div>
        <Field label="Shift">
          <select className={inputClass} value={form.shift || "morning"} onChange={(e) => set("shift", e.target.value)}>
            <option value="morning">Morning</option><option value="afternoon">Afternoon</option>
          </select>
        </Field>
        <Field label="Department">
          <select className={inputClass} value={form.department_id || ""} onChange={(e) => set("department_id", e.target.value)}>
            <option value="">Select</option>
            {dm.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
    );
    if (tab === "Constraints") return (
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass} value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className={inputClass} value={form.category || "soft"} onChange={(e) => set("category", e.target.value)}>
              <option value="hard">Hard</option><option value="soft">Soft</option>
            </select>
          </Field>
          <Field label="Weight"><input type="number" min="0" className={inputClass} value={form.weight ?? 0} onChange={(e) => set("weight", e.target.value)} /></Field>
        </div>
        <Field label="Scope"><input className={inputClass} value={form.scope || ""} onChange={(e) => set("scope", e.target.value)} placeholder="global, batch, faculty" /></Field>
        <Field label="Rule Definition"><textarea className={inputClass + " h-20 resize-none"} value={form.rule_definition || ""} onChange={(e) => set("rule_definition", e.target.value)} /></Field>
      </div>
    );
    return null;
  };

  const items = tab === "Faculty" ? dm.faculty : tab === "Subjects" ? dm.subjects : tab === "Classrooms" ? dm.classrooms : tab === "Batches" ? dm.batches : dm.constraints;

  const renderRow = (item) => {
    if (tab === "Faculty") return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.email} · {item.department_name}</p>
          {item.subject_names?.length > 0 && <p className="text-xs text-primary-600 mt-1">{item.subject_names.join(", ")}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => openAvailability(item)} className={btnEdit} title="Availability"><Calendar className="h-4 w-4" /></button>
          <button onClick={() => openEdit(item)} className={btnEdit}><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(item.id)} className={btnDanger}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
    if (tab === "Subjects") return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{item.name} <span className="text-xs text-slate-400">({item.code})</span></p>
          <p className="text-xs text-slate-500 mt-0.5">{item.hours_per_week}h/week {item.is_heavy && "· Heavy"} {item.is_lab && "· Lab"}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => openEdit(item)} className={btnEdit}><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(item.id)} className={btnDanger}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
    if (tab === "Classrooms") return (
      <div className="flex items-center justify-between gap-3">
        <div><p className="font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500 mt-0.5">Cap: {item.capacity} · {item.room_type} · {item.department_name}</p></div>
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className={btnEdit}><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(item.id)} className={btnDanger}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
    if (tab === "Batches") return (
      <div className="flex items-center justify-between gap-3">
        <div><p className="font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500 mt-0.5">Sem {item.semester} · {item.students} students · {item.shift} · {item.department_name}</p></div>
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className={btnEdit}><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(item.id)} className={btnDanger}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
    return (
      <div className="flex items-center justify-between gap-3">
        <div><p className="font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500 mt-0.5">{item.category} · weight {item.weight} · {item.scope}</p><p className="text-xs text-slate-400 mt-1">{item.rule_definition}</p></div>
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(item)} className={btnEdit}><Pencil className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(item.id)} className={btnDanger}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="data-management-panel">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data Management</p>
          <h3 className="mt-2 text-xl font-bold text-slate-800">Full control over scheduling inputs</h3>
        </div>
        <div className="flex gap-2">
          {(tab === "Faculty" || tab === "Subjects") && (
            <>
              <input ref={csvRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
              <button onClick={() => csvRef.current?.click()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-primary-300 hover:bg-primary-50 transition inline-flex items-center gap-2 font-medium">
                <Upload className="h-4 w-4" />CSV Import
              </button>
            </>
          )}
          <button onClick={() => openAdd()} className={btnPrimary + " inline-flex items-center gap-2"}><Plus className="h-4 w-4" />Add {tab.replace(/s$/, "")}</button>
        </div>
      </div>

      {dm.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 mb-4">{dm.error}</div>}
      {dm.notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 mb-4">{dm.notice}</div>}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap ${tab === t ? "bg-primary-700 text-white shadow-md shadow-primary-700/20" : "border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {dm.loading && items.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 animate-pulse h-16" />)
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No {tab.toLowerCase()} found. Add one to get started.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-200 hover:shadow-sm transition">{renderRow(item)}</div>
          ))
        )}
      </div>

      <Modal open={modal === "form"} onClose={close} title={`${editId ? "Edit" : "Add"} ${tab.replace(/s$/, "")}`}>
        {renderForm()}
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={close} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={dm.loading} className={btnPrimary}>{dm.loading ? "Saving..." : "Save"}</button>
        </div>
      </Modal>

      <Modal open={modal === "availability"} onClose={close} title="Faculty Availability">
        {availFaculty && <AvailabilityGrid faculty={availFaculty} timeslots={dm.timeslots} availability={dm.availability} onSave={dm.saveAvailability} onClose={close} />}
      </Modal>
    </motion.div>
  );
}
