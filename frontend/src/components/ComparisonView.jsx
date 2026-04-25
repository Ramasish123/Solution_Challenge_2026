import { motion } from "framer-motion";
import { ArrowLeftRight, TrendingUp } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function MiniGrid({ timetable, changedSlotIds = [], label, accent }) {
  if (!timetable) return null;
  const grouped = timetable.entries.reduce((acc, e) => {
    const k = `${e.day}-${e.time_range}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {});
  const hours = [...new Set(timetable.entries.map((e) => e.time_range))];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>{label}</p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[500px] gap-1" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
          <div className="text-[10px] font-medium text-slate-400 p-1">Time</div>
          {days.map((d) => <div key={d} className="text-[10px] font-medium text-slate-500 text-center p-1">{d.slice(0, 3)}</div>)}
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="text-[10px] text-slate-400 p-1 flex items-center">{h}</div>
              {days.map((d) => {
                const items = grouped[`${d}-${h}`] || [];
                return (
                  <div key={`${d}-${h}`} className="min-h-[28px] rounded-lg p-0.5">
                    {items.map((e, i) => {
                      const isChanged = changedSlotIds.includes(e.id) || changedSlotIds.includes(e.timeslot_id);
                      return (
                        <div key={i} className={`rounded-md px-1.5 py-0.5 text-[9px] mb-0.5 border ${isChanged ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-100 bg-slate-50 text-slate-600"}`}>
                          {e.subject_name.slice(0, 12)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComparisonView({ beforeTimetable, afterTimetable, disruption, changedCount, changedSlotIds = [] }) {
  if (!beforeTimetable || !afterTimetable) return null;

  const improvement = afterTimetable.fitness_score - beforeTimetable.fitness_score;
  const stabilityScore = Math.max(0, 100 - (disruption || 0));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6" id="comparison-view">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-2xl bg-primary-100 p-3 text-primary-600"><ArrowLeftRight className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Visual Comparison</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800">Before vs After</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Improvement</p>
          <p className={`text-xl font-bold mt-2 ${improvement >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {improvement >= 0 ? "+" : ""}{improvement.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Slots Changed</p>
          <p className="text-xl font-bold text-amber-600 mt-2">{changedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stability</p>
          <p className="text-xl font-bold text-primary-600 mt-2">{stabilityScore.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MiniGrid timetable={beforeTimetable} label="Before" accent="text-rose-600" />
        <MiniGrid timetable={afterTimetable} changedSlotIds={changedSlotIds} label="After" accent="text-emerald-600" />
      </div>
    </motion.div>
  );
}
