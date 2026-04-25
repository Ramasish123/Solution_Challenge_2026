import { motion } from "framer-motion";
import { CalendarSync, Sparkles, WandSparkles } from "lucide-react";

export function OptimizationControlPanel({ loading, onGenerate, onReschedule }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel grid gap-6 p-6 lg:grid-cols-[1.25fr,0.95fr]"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-100 p-3 text-primary-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Optimization Engine</h3>
            <p className="text-sm text-slate-500">
              Adaptive mutation, elite preservation, and multi-solution output for realistic planning.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => onGenerate()}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 text-left text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-600/20 disabled:opacity-60"
          >
            <p className="font-bold">Generate Timetables</p>
            <p className="mt-1 text-sm opacity-80">Create top 5 optimized timetable candidates.</p>
          </button>
          <button
            onClick={() =>
              onReschedule({
                timetable_id: 1,
                faculty_id: 1,
                unavailable_timeslot_ids: [1, 2],
              })
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-primary-300 hover:bg-primary-50 hover:shadow-md disabled:opacity-60"
          >
            <p className="font-bold text-slate-800">Dynamic Reschedule</p>
            <p className="mt-1 text-sm text-slate-500">Repair impacted slots only when a faculty becomes unavailable.</p>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
            <CalendarSync className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Live system behaviors</h4>
            <p className="text-sm text-slate-500">What the engine is optimizing in every generation.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {[
            "Faculty and room clash elimination",
            "Balanced workload distribution across departments",
            "Reduced teaching gaps and better room utilization",
            "Heavy subject spacing and smarter slot repair",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <WandSparkles className="h-4 w-4 text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
