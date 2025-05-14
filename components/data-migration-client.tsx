"use client"

import { useEffect } from "react"
import { migrateJobData } from "@/lib/migration"

export function DataMigrationClient() {
  useEffect(() => {
    // Run migration on client-side only
    migrateJobData();
  }, []);

  // This component doesn't render anything
  return null;
}
