"use client";

import { CohortProvider } from "../lib/CohortContext";

export default function Providers({ children }) {
  return <CohortProvider>{children}</CohortProvider>;
}
