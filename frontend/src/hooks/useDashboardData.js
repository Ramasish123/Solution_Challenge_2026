import { useEffect, useState } from "react";
import {
  fetchAnalytics,
  fetchProfile,
  fetchTimetables,
  generateTimetable,
  login,
  rescheduleTimetable,
  signup,
} from "../lib/api";

const defaultGenerationConfig = {
  population_size: 60,
  generations: 120,
  mutation_rate: 0.12,
  elite_count: 5,
  solution_count: 5,
};

function getErrorMessage(err, fallbackMessage) {
  if (err.response?.data?.detail) {
    return err.response.data.detail;
  }

  if (err.request) {
    return "Backend server is not running. Start the backend on http://127.0.0.1:8000 and try again.";
  }

  return fallbackMessage;
}

export function useDashboardData() {
  const rememberedIdentifier = localStorage.getItem("smart-classroom-last-identifier") || "";
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem("smart-classroom-token"),
    role: localStorage.getItem("smart-classroom-role") || "",
    fullName: localStorage.getItem("smart-classroom-name") || "",
    username: localStorage.getItem("smart-classroom-username") || "",
  }));
  const [analytics, setAnalytics] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Explainable AI state
  const [explanation, setExplanation] = useState(null);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [baselineMetrics, setBaselineMetrics] = useState(null);

  // Comparison state
  const [beforeTimetable, setBeforeTimetable] = useState(null);
  const [afterTimetable, setAfterTimetable] = useState(null);
  const [disruption, setDisruption] = useState(0);
  const [changedCount, setChangedCount] = useState(0);
  const [changedSlotIds, setChangedSlotIds] = useState([]);

  const refresh = async () => {
    if (!localStorage.getItem("smart-classroom-token")) {
      return;
    }
    try {
      const [analyticsResponse, timetableResponse, profileResponse] = await Promise.all([
        fetchAnalytics(),
        fetchTimetables(),
        fetchProfile(),
      ]);
      setAnalytics(analyticsResponse);
      setTimetables(timetableResponse.timetables || []);
      setProfile(profileResponse);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load dashboard data."));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const persistSession = (response) => {
    localStorage.setItem("smart-classroom-token", response.access_token);
    localStorage.setItem("smart-classroom-role", response.role);
    localStorage.setItem("smart-classroom-name", response.full_name);
    localStorage.setItem("smart-classroom-username", response.username);
    localStorage.setItem("smart-classroom-last-identifier", response.username);
    setSession({
      token: response.access_token,
      role: response.role,
      fullName: response.full_name,
      username: response.username,
    });
  };

  const signIn = async (identifier, password) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await login(identifier, password);
      persistSession(response);
      await refresh();
      setNotice(`Welcome back, ${response.full_name}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Sign in failed."));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (payload) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await signup(payload);
      persistSession(response);
      await refresh();
      setNotice("Account created and signed in successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Sign up failed."));
    } finally {
      setLoading(false);
    }
  };

  const runGeneration = async (config = defaultGenerationConfig) => {
    setLoading(true);
    setError("");
    setNotice("");
    setBeforeTimetable(null);
    setAfterTimetable(null);
    try {
      const response = await generateTimetable(config);
      setStats(response.stats);
      setTimetables(response.timetables);
      setExplanation(response.explanation || null);
      setGenerationHistory(response.generation_history || []);
      setBaselineMetrics(response.baseline_metrics || null);
      const analyticsResponse = await fetchAnalytics();
      setAnalytics(analyticsResponse);
      setNotice(`Generated ${response.timetables.length} timetable candidates.`);
    } catch (err) {
      setError(getErrorMessage(err, "Generation failed."));
    } finally {
      setLoading(false);
    }
  };

  const runReschedule = async (payload) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await rescheduleTimetable(payload);
      setStats(response.stats);
      setTimetables(response.timetables);
      setBeforeTimetable(response.before_timetable || null);
      setAfterTimetable(response.after_timetable || null);
      setDisruption(response.disruption_score || 0);
      setChangedCount(response.changed_slots_count || 0);
      setChangedSlotIds(response.changed_slot_ids || []);
      setGenerationHistory(response.generation_history || []);
      const analyticsResponse = await fetchAnalytics();
      setAnalytics(analyticsResponse);
      setNotice("Timetable repaired for the selected disruption.");
    } catch (err) {
      setError(getErrorMessage(err, "Rescheduling failed."));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("smart-classroom-token");
    localStorage.removeItem("smart-classroom-role");
    localStorage.removeItem("smart-classroom-name");
    localStorage.removeItem("smart-classroom-username");
    setSession({ token: "", role: "", fullName: "", username: "" });
    setAnalytics(null);
    setTimetables([]);
    setStats(null);
    setProfile(null);
    setNotice("");
    setError("");
    setExplanation(null);
    setGenerationHistory([]);
    setBaselineMetrics(null);
    setBeforeTimetable(null);
    setAfterTimetable(null);
  };

  return {
    session,
    profile,
    analytics,
    timetables,
    stats,
    loading,
    error,
    notice,
    rememberedIdentifier,
    explanation,
    generationHistory,
    baselineMetrics,
    beforeTimetable,
    afterTimetable,
    disruption,
    changedCount,
    changedSlotIds,
    signIn,
    signUp,
    runGeneration,
    runReschedule,
    refresh,
    logout,
  };
}
