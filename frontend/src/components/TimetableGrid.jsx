import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, AlertTriangle, X, ArrowRight } from "lucide-react";
import { validateSlotChange, applySlotChange } from "../lib/api";

const subjectColors = [
  "bg-primary-50 text-primary-700 border-primary-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-sky-50 text-sky-700 border-sky-200",
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function ConflictPopup({ conflicts, fixes, onClose, onForce }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="absolute z-40 top-full left-0 mt-2 w-72 rounded-xl border border-rose-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-rose-600 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4" />Conflict Detected
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-2 mb-3">
        {conflicts.map((c, i) => (
          <p key={i} className="text-xs text-rose-600">{c.description}</p>
        ))}
      </div>
      {fixes.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] uppercase font-semibold text-slate-400 mb-2">Suggested Fixes</p>
          {fixes.map((f, i) => (
            <p key={i} className="text-xs text-emerald-600 flex items-center gap-1"><ArrowRight className="h-3 w-3" />{f.detail}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function TimetableGrid({ timetable, onRefresh }) {
  const [dragEntry, setDragEntry] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [conflictCell, setConflictCell] = useState(null);

  if (!timetable) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(timetable, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${timetable.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const grouped = timetable.entries.reduce((acc, entry) => {
    const key = `${entry.day}-${entry.time_range}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const hours = [...new Set(timetable.entries.map((entry) => entry.time_range))];

  // Find timeslot_id for a given day + time_range
  const findTimeslotId = (day, timeRange) => {
    const entry = timetable.entries.find((e) => e.day === day && e.time_range === timeRange);
    return entry?.timeslot_id;
  };

  const handleDragStart = (e, entry) => {
    setDragEntry(entry);
    setConflict(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: entry.id, timeslot_id: entry.timeslot_id }));
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDrop = async (e, day, timeRange) => {
    e.preventDefault();
    if (!dragEntry) return;

    const targetTimeslotId = findTimeslotId(day, timeRange);
    if (!targetTimeslotId || targetTimeslotId === dragEntry.timeslot_id) {
      setDragEntry(null);
      return;
    }

    try {
      const result = await validateSlotChange({
        timetable_id: timetable.timetable_id,
        entry_id: dragEntry.id,
        new_timeslot_id: targetTimeslotId,
      });

      if (result.is_valid) {
        await applySlotChange({
          timetable_id: timetable.timetable_id,
          entry_id: dragEntry.id,
          new_timeslot_id: targetTimeslotId,
        });
        if (onRefresh) onRefresh();
      } else {
        setConflict(result);
        setConflictCell(`${day}-${timeRange}`);
      }
    } catch (err) {
      setConflict({ conflicts: [{ description: "Validation request failed." }], suggested_fixes: [] });
      setConflictCell(`${day}-${timeRange}`);
    }
    setDragEntry(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel overflow-hidden p-6" id="timetable-grid">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timetable View</p>
          <h3 className="mt-2 text-xl font-bold text-slate-800">{timetable.name}</h3>
          <p className="text-xs text-slate-400 mt-1">Drag & drop slots to rearrange • Conflicts detected in real-time</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600 font-medium">Fitness {timetable.fitness_score}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600 font-medium">Conflicts {timetable.conflict_count}</span>
          <button type="button" onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 font-medium transition hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50">
            <Download className="h-4 w-4" />Export JSON
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[920px] grid-cols-[140px,repeat(5,minmax(140px,1fr))] gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Time</div>
          {days.map((day) => (
            <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{day}</div>
          ))}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-5 text-sm text-slate-500 font-medium">{hour}</div>
              {days.map((day, columnIndex) => {
                const cellKey = `${day}-${hour}`;
                const items = grouped[cellKey] || [];
                const hasConflict = conflictCell === cellKey && conflict;
                return (
                  <div key={cellKey}
                    className={`relative min-h-32 rounded-xl border p-2.5 transition-colors ${hasConflict ? "border-rose-300 bg-rose-50" : dragEntry ? "border-dashed border-primary-300 bg-primary-50/30" : "border-slate-100 bg-white"}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, hour)}>
                    <div className="flex flex-col gap-2">
                      {items.map((entry, index) => (
                        <div key={`${entry.batch_id}-${entry.subject_id}-${index}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, entry)}
                          className={`group rounded-xl border p-3 transition cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md ${subjectColors[(index + columnIndex) % subjectColors.length]}`}
                          title={`${entry.subject_name} | ${entry.faculty_name} | ${entry.classroom_name} — Drag to move`}>
                          <p className="font-semibold text-sm">{entry.subject_name}</p>
                          <p className="mt-1 text-xs opacity-75">{entry.batch_name}</p>
                          <p className="mt-2 text-xs opacity-65">{entry.faculty_name}</p>
                          <p className="text-xs opacity-65">{entry.classroom_name}</p>
                        </div>
                      ))}
                    </div>
                    {hasConflict && (
                      <ConflictPopup
                        conflicts={conflict.conflicts}
                        fixes={conflict.suggested_fixes}
                        onClose={() => { setConflict(null); setConflictCell(null); }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
