import { FeatureCardItem } from "@/components/FeatureCards";

export const features: FeatureCardItem[] = [
  {
    title: "Solana-specific signals",
    description:
      "Bulwark parses Solana-native primitives; compute budgets, rent behavior, signer/writable flags, and CPI signer calls to surface patterns that directly affect audit scope and validator behavior. You see the same risk dimensions an auditor would flag before manual review.",
    icon: "/icons/Badge.svg",
  },
  {
    title: "Calibrated ranges",
    description:
      "Each complexity range (p50/p90) is evidence-backed. Bulwark shows what drives the number: so auditors can trace effort estimates to concrete code realities instead of arbitrary scoring.",
    icon: "/icons/Dart.svg",
    highlighted: true,
  },
  {
    title: "Privacy-End-to-end Privacy",
    description:
      "For all scans, Bulwark enlists the encryption infrastructure offered by Arcium; every scan is privately processed to Arcium MPCs that manage the compute and deliver results to the user in the form of a commit-bound receipt that is verifiable on-chain. Private, end-to-end  without ever seeing/revealing raw source, preserving both client code integrity and evidence credibility.",
    icon: "/icons/Shield.svg",
  },
];

export const teamItems = [
  {
    title: "Founders",
    icon: "/icons/Founder.svg",
    description:
      "Specialized analysis for Solidity, Vyper, Rust, Move, and Cairo with framework-specific checks.",
  },
  {
    title: "Auditors",
    icon: "/icons/Auditor.svg",
    description:
      "Standardized vulnerability classification aligned with industry best practices.",
  },
  {
    title: "Security Researchers",
    icon: "/icons/Security.svg",
    description:
      "Get accurate audit cost ranges and duration estimates based on your codebase complexity.",
  },
  {
    title: "Devs",
    icon: "/icons/Dev.svg",
    description:
      "Seamlessly connect with vetted auditors when you're ready for a full professional audit.",
  },
  {
    title: "Protocol DAOs",
    icon: "/icons/Dao.svg",
    description:
      "Smart re-analysis that focuses only on changed code for faster iteration cycles.",
  },
  {
    title: "VCs & Analysts",
    icon: "/icons/Vc.svg",
    description:
      "OAuth integration and signed URLs ensure your proprietary code stays secure.",
  },
];
