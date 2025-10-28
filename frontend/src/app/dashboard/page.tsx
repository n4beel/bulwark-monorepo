"use client";

import DashboardPageContent from "@/components/Dashboard/DageboardPageContent";
import { Suspense } from "react";


export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
