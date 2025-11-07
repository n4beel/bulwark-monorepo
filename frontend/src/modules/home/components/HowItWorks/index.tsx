import HowStepContainer from './HowItWorksStep';

const steps = [
  {
    step: '01',
    title: 'INGEST',
    description:
      'Paste a repo, upload a ZIP, or connect GitHub. We fetch the tree & commit meta securely.',
    icon: '/images/Ingest.png',
    image: '/icons/HowItWorkStep1.svg',
  },
  {
    step: '02',
    title: 'ANALYZE',
    description:
      'See hotspots by file/line, dependency advisories, and AEU p50/p90 with Scope Confidence %.',
    icon: '/images/Analyze.png',
    image: '/icons/HowItWorkStep2.svg',
  },
  {
    step: '03',
    title: 'REPORT',
    description:
      'One-click Scope Pack (JSON + PDF) for Areta or your auditor shortlist.',
    icon: '/images/Report.png',
    image: '/icons/HowItWorkStep3.svg',
  },
];
export default function HowItWorks() {
  return (
    <section
      className="w-full max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24"
      id="how"
    >
      <h2
        className="text-center text-2xl md:text-3xl font-normal mb-12"
        style={{ fontFamily: '"Doto", sans-serif' }}
      >
        How It Works
      </h2>

      <div className="flex flex-col gap-10">
        {steps.map((s, i) => (
          <HowStepContainer key={i} step={s} reversed={false} />
        ))}
      </div>
    </section>
  );
}
