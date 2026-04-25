import { useCallback, useEffect, useState } from "react";
import {
  fetchFaculty,
  fetchSubjects,
  fetchClassrooms,
  fetchBatches,
  fetchConstraints,
  fetchDepartments,
  fetchTimeslots,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  createSubject,
  updateSubject,
  deleteSubject,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  createBatch,
  updateBatch,
  deleteBatch,
  createConstraint,
  updateConstraint,
  deleteConstraint,
  fetchFacultyAvailability,
  updateFacultyAvailability,
  importFacultyCSV,
  importSubjectsCSV,
} from "../lib/api";

export function useDataManagement() {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timeslots, setTimeslots] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const clearMessages = () => { setError(""); setNotice(""); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const [f, s, c, b, cn, d, t] = await Promise.all([
        fetchFaculty(), fetchSubjects(), fetchClassrooms(),
        fetchBatches(), fetchConstraints(), fetchDepartments(), fetchTimeslots(),
      ]);
      setFaculty(f.items || []);
      setSubjects(s.items || []);
      setClassrooms(c.items || []);
      setBatches(b.items || []);
      setConstraints(cn.items || []);
      setDepartments(d.items || []);
      setTimeslots(t.items || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const wrap = async (fn, successMsg) => {
    setLoading(true);
    clearMessages();
    try {
      await fn();
      setNotice(successMsg);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Faculty
  const addFaculty = (p) => wrap(() => createFaculty(p), "Faculty added.");
  const editFaculty = (id, p) => wrap(() => updateFaculty(id, p), "Faculty updated.");
  const removeFaculty = (id) => wrap(() => deleteFaculty(id), "Faculty deleted.");

  // Subjects
  const addSubject = (p) => wrap(() => createSubject(p), "Subject added.");
  const editSubject = (id, p) => wrap(() => updateSubject(id, p), "Subject updated.");
  const removeSubject = (id) => wrap(() => deleteSubject(id), "Subject deleted.");

  // Classrooms
  const addClassroom = (p) => wrap(() => createClassroom(p), "Classroom added.");
  const editClassroom = (id, p) => wrap(() => updateClassroom(id, p), "Classroom updated.");
  const removeClassroom = (id) => wrap(() => deleteClassroom(id), "Classroom deleted.");

  // Batches
  const addBatch = (p) => wrap(() => createBatch(p), "Batch added.");
  const editBatch = (id, p) => wrap(() => updateBatch(id, p), "Batch updated.");
  const removeBatch = (id) => wrap(() => deleteBatch(id), "Batch deleted.");

  // Constraints
  const addConstraint = (p) => wrap(() => createConstraint(p), "Constraint added.");
  const editConstraint = (id, p) => wrap(() => updateConstraint(id, p), "Constraint updated.");
  const removeConstraint = (id) => wrap(() => deleteConstraint(id), "Constraint deleted.");

  // Availability
  const loadAvailability = async (facultyId) => {
    try {
      const data = await fetchFacultyAvailability(facultyId);
      setAvailability(data);
    } catch { setError("Failed to load availability."); }
  };
  const saveAvailability = async (facultyId, slots) => {
    await wrap(() => updateFacultyAvailability(facultyId, { slots }), "Availability updated.");
    await loadAvailability(facultyId);
  };

  // CSV
  const importFaculty = (file) => wrap(() => importFacultyCSV(file), "Faculty CSV imported.");
  const importSubjects = (file) => wrap(() => importSubjectsCSV(file), "Subjects CSV imported.");

  return {
    faculty, subjects, classrooms, batches, constraints, departments, timeslots,
    availability, loading, error, notice,
    loadAll, addFaculty, editFaculty, removeFaculty,
    addSubject, editSubject, removeSubject,
    addClassroom, editClassroom, removeClassroom,
    addBatch, editBatch, removeBatch,
    addConstraint, editConstraint, removeConstraint,
    loadAvailability, saveAvailability,
    importFaculty, importSubjects,
  };
}
