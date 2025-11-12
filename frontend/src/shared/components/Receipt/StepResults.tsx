'use client';

import Image from 'next/image';
import Chip from '../../../components/ui/Chip';
import AuditEffortCard from '../AuditEffortCard';
import ComplexityCard from '../ComplexityCard';
import HotspotsCard from '../HotspotCards';

export default function StepResults({ report }: any) {
  // Determine if this is GitHub or Upload source
  const isGitHubSource = !!report?.repository?.includes('/');
  const sourceLabel = isGitHubSource
    ? `GitHub: ${report.repository}`
    : 'Uploaded Archive';

  return (
    <div
      className="relative px-4 md:px-8 pt-6 pb-0 min-h-[520px] flex flex-col"
      style={{
        backgroundImage:
          'radial-gradient(var(--border-color) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    >
      {/* Top Chips */}
      <div className="flex gap-0 flex-wrap mb-2">
        <Chip
          label="Encrypted by Arcium"
          iconSrc="https://res.cloudinary.com/ahmed8215/image/upload/Arcium_jqbxu1.svg"
          iconAlt="Arcium"
          iconSide="right"
          variant="filled"
          size="sm"
        />
      </div>

      {/* Success Section */}
      <div className=" flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--green-light)] flex items-center justify-center">
          <Image
            src="/icons/GreenCheck.svg"
            alt="done"
            width={28}
            height={28}
          />
        </div>
        <h2 className=" text-[18px] font-semibold text-[var(--text-primary)]">
          Scan complete!
        </h2>

        <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[560px] flex items-start gap-1.5 justify-center">
          <Image
            src="/icons/InfoIcon.svg"
            alt="info"
            width={14}
            height={14}
            className="flex-shrink-0 mt-0.5"
          />
          <span>
            Disclaimer: The results of this scan are bound to the commit of the
            codebase shared. These results are presented with a scope confidence
            of ~60% or more, based on the current Bulwark Scoping Framework™.
          </span>
        </p>
      </div>

      {/* Divider */}

      <div className="my-4 w-full h-[2px] bg-[repeating-linear-gradient(to_right,var(--blue-light)_0_12px,transparent_12px_22px)]"></div>

      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-primary)] font-medium">
            {sourceLabel}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {report?.scanMetadata?.scannedFiles || 0} files •{' '}
            {report?.scanMetadata?.sizeKB || 0} KB
          </p>
        </div>
        <div className="text-end text-[10px] text-[var(--text-secondary)]">
          <p>
            Receipt ID:{' '}
            <a
              href={report?.report?.hrefUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[var(--blue-primary)] hover:text-[var(--blue-hover)]"
            >
              {(report?.report?.receiptId ?? '').length > 8
                ? `${(report?.report?.receiptId ?? '').slice(0, 8)}...`
                : (report?.report?.receiptId ?? '')}
            </a>
          </p>

          {report?.commitHash && (
            <p>
              Bound to commit:{' '}
              <a
                href={report?.report?.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--blue-primary)] hover:text-[var(--blue-hover)] cursor-pointer"
              >
                {report?.commitHash?.slice(0, 7)}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex flex-col md:flex-row justify-between gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
        <div className="w-full md:w-[40%]">
          <ComplexityCard
            complexityScore={Number(report?.scores?.total) || 0}
          />
        </div>

        <div className="w-full md:w-[60%]">
          <AuditEffortCard report={report} />
        </div>
      </div>

      {/* Hotspots - Use real data if available */}
      <div className="mt-4">
        <HotspotsCard
          findings={{
            totalFindings: report?.report?.hotspots?.totalCount || 0,
            severityCounts: {
              high: report?.report?.hotspots?.highRiskCount || 0,
              medium: report?.report?.hotspots?.mediumRiskCount || 0,
              low: report?.report?.hotspots?.lowPriorityCount || 0,
            },
          }}
        />
      </div>

      <Image
        src="/icons/Wave.svg"
        alt="wave"
        width={1200}
        height={20}
        className="w-full h-4 md:h-5 mt-4"
      />
    </div>
  );
}
