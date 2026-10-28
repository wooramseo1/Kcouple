"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { MatchSummary } from "@/lib/services";

export function useMatches(pollMs = 5000) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => api<{ matches: MatchSummary[] }>("/api/matches").then((d) => alive && setMatches(d.matches)).catch(() => {});
    load();
    const id = setInterval(load, pollMs);
    return () => { alive = false; clearInterval(id); };
  }, [pollMs]);
  return matches;
}
