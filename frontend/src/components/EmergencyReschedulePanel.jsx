import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, User } from "lucide-react";
import { fetchFaculty, fetchTimeslots } from "../lib/api";

export function EmergencyReschedulePanel({ timetables, onReschedule, loading }) {
  const [open, setOpen] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [timeslotList, setTimeslotList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    if (open) {
      fetchFaculty().then((d) => setFacultyList(d.items || [])).catch(() => {});
      fetchTimeslots().then((d) => setTimeslotList(d.items || [])).catch(() => {});
    }
  }, [open]);

  const currentTimetable = timetables?.[0];
  const facultySlots = currentTimetable?.entries?.filter((e) => e.faculty_id === parseInt(selectedFaculty)) || [];

  const toggleSlot = (id) => {
    setSelectedSlots((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleReschedule = () => {
    if (!currentTimetable || !selectedFaculty || selectedSlots.length === 0) return;
    onReschedule({
      timetable_id: currentTimetable.timetable_id,
      faculty_id: parseInt(selectedFaculty),
      unavailable_timeslot_ids: selectedSlots,
    });
    setOpen(false);
    setSelectedFaculty("");
    setSelectedSlots([]);
  };

  if (!open) {
    return (
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setOpen(true)}
        className="glass-panel w-full p-5 text-left hover:border-amber-300 transition group" id="emergency-reschedule-btn">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 group-hover:bg-amber-200 transition">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">🚨 Faculty Absent Now</h3>
            <p className="text-sm text-slate-500 mt-1">Emergency rescheduling — repair only affected slots</p>
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-panel p-6" id="emergency-reschedule-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600"><AlertTriangle className="h-6 w-6" /></div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Emergency Rescheduling</h3>
          <p className="text-sm text-slate-500 mt-1">Select absent faculty and their unavailable slots</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600">Select Faculty</span>
            <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setSelectedSlots([]); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none text-sm focus:border-primary-400 transition">
              <option value="">Choose faculty member</option>
              {facultyList.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>

          {selectedFaculty && (
            <div>
              <p className="text-sm font-medium text-slate-600 mb-3">Select unavailable timeslots:</p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {timeslotList.map((slot) => (
                  <button key={slot.id} onClick={() => toggleSlot(slot.id)}
                    className={`rounded-xl border px-3 py-2 text-xs text-left transition ${selectedSlots.includes(slot.id) ? "border-amber-300 bg-amber-50 text-amber-700 font-semibold" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {slot.day.slice(0, 3)} {slot.start_time}-{slot.end_time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedFaculty && facultySlots.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3">Current slots for selected faculty:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {facultySlots.map((e, i) => (
                <div key={i} className={`rounded-xl border p-3 text-sm ${selectedSlots.includes(e.timeslot_id) ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600"}`}>
                  <span className="font-semibold">{e.day} {e.time_range}</span> — {e.subject_name} ({e.batch_name})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => { setOpen(false); setSelectedFaculty(""); setSelectedSlots([]); }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition">Cancel</button>
        <button onClick={handleReschedule} disabled={!selectedFaculty || selectedSlots.length === 0 || loading}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.01] hover:shadow-lg disabled:opacity-60 inline-flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />{loading ? "Rescheduling..." : "Reschedule Now"}
        </button>
      </div>
    </motion.div>
  );
}
