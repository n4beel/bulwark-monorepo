import HowStepContainer from "./HowItWorksStep";

const steps = [
  {
    step: "01",
    title: "INGEST",
    description:
      "Paste a repo, upload a ZIP, or connect GitHub. We fetch the tree & commit meta securely.",
    icon: "/images/Ingest.png",
    image: "/icons/HowItWorkStep1.svg",
  },
  {
    step: "02",
    title: "ANALYZE",
    description:
      "See hotspots by file/line, dependency advisories, and AEU p50/p90 with Scope Confidence %.",
    icon: "/images/Analyze.png",
    image: "/icons/HowItWorkStep2.svg",
  },
  {
    step: "03",
    title: "REPORT",
    description:
      "One-click Scope Pack (JSON + PDF) for Areta or your auditor shortlist.",
    icon: "/images/Report.png",
    image: "/icons/HowItWorkStep3.svg",
  },
];

export default function HowItWorks() {
  return (
    <div className="mt-20 w-4/5 mx-auto">
      <h1
        className="text-3xl font-bold"
        style={{
          fontFamily: '"Doto", sans-serif',
          color: "var(--black-primary)",
        }}
      >
        How It Works
      </h1>
      <p
        className="mt-2 text-sm font-medium opacity-60"
        // style={{ color: "var(--blue-primary)" }}
      >
        From repo to pre-audit report in minutes
      </p>
      {steps.map((s, i) => (
        <HowStepContainer
          key={i}
          step={s}
          reversed={false} // alternate layout
        />
      ))}
    </div>
  );
}
