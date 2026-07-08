"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "./supabase/client";

const CohortContext = createContext(null);

export function CohortProvider({ children }) {
  const supabase = createClient();
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCohorts() {
      const { data, error } = await supabase
        .from("cohorts")
        .select("id, name, start_date, end_date, is_active")
        .order("start_date", { ascending: false });

      if (error) { console.error(error); setLoading(false); return; }

      setCohorts(data);
      const active = data.find(c => c.is_active);
      setSelectedCohortId(active ? active.id : data[0]?.id ?? null);
      setLoading(false);
    }
    fetchCohorts();
  }, []);

  const selectedCohort = cohorts.find(c => c.id === selectedCohortId) || null;

  return (
    <CohortContext.Provider value={{ cohorts, selectedCohort, selectedCohortId, setSelectedCohortId, loading }}>
      {children}
    </CohortContext.Provider>
  );
}

export function useCohort() {
  const ctx = useContext(CohortContext);
  if (!ctx) throw new Error("useCohort must be used inside a CohortProvider");
  return ctx;
}