import { motion } from "framer-motion";

const datasets = {
  faculty: [
    ["Dr. Ananya Rao", "Algorithms, Database Systems", "0.08"],
    ["Prof. Vikram Shah", "Operating Systems, Software Engineering", "0.12"],
    ["Dr. Meera Iyer", "Digital Signal Processing", "0.15"],
  ],
  rooms: [
    ["LH-201", "80", "Lecture"],
    ["Lab-A", "35", "Lab"],
    ["Embedded Lab", "30", "Lab"],
  ],
  subjects: [
    ["Algorithms", "4", "Heavy"],
    ["Database Systems", "3", "Heavy"],
    ["Embedded Systems Lab", "2", "Lab"],
  ],
};

export function InputPanel() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Input Panels</p>
      <h3 className="mt-2 text-xl font-bold text-slate-800">Faculty, subjects, and room inputs</h3>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {Object.entries(datasets).map(([key, rows]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold uppercase tracking-wider text-primary-600">{key}</p>
            <div className="mt-4 space-y-3">
              {rows.map((row) => (
                <div key={row[0]} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-slate-800">{row[0]}</p>
                  <p className="mt-1 text-sm text-slate-500">{row[1]}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-400">{row[2]}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
