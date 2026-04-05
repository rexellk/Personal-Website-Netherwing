// ============================================================
//  MASTER PORTFOLIO DATA FILE
//  Edit everything about your portfolio content right here.
//  The site auto-updates — no touching component files needed.
// ============================================================

import amazonLogo  from "../images/amazon-logo.jpg";
import desaiLogo   from "../images/desai-logo.jpeg";
import permiasLogo from "../images/permias-logo.jpeg";
import permiasWebsite from "../images/permias-website.png"


// ─────────────────────────────────────────────
//  HERO
// ─────────────────────────────────────────────
export const HERO = {
  firstName:  "Rexell",
  lastName:   "Kurniawan",
  tagline:    "Software Engineer · Builder · U of Michigan",
  sub:        "Ann Arbor, Michigan · San Francisco → May 2026",
  resumeUrl:  "https://drive.google.com/file/d/10dNoRvINeiCV5MuUxld_YrD9HZ1axYkH/view?usp=sharing",
  email:      "k.rexnath@gmail.com",
};

// ─────────────────────────────────────────────
//  ABOUT
// ─────────────────────────────────────────────
export const ABOUT = {
  // Section heading — "Engineer with <em>business instinct</em>"
  headingLine1: "Engineer with",
  headingEm:    "business instinct",

  // Body paragraphs — each string is one <p>
  paragraphs: [
    `CS student at <strong>University of Michigan</strong> (Dec 2026),
     incoming <strong>Amazon SDE intern</strong> on the eero iOS team in San Francisco.
     I build things that ship, from production features at five early-stage startups
     to a national website serving 8,000+ students.`,
    `I moved from Indonesia to Seattle at 16 and found software as the intersection
     of everything I love: systems thinking, building for real people, and the
     compounding nature of good ideas.`,
    `My edge is being equally comfortable in a founder conversation and a code review.
     Startup speed, engineering craft, <strong>no separation between the two.</strong>`,
  ],

  // Stat bento boxes — add/remove freely (always 4 to fill the 2×2 grid)
  stats: [
    { num: "5",    sup: "+",  label: "Startups shipped" },
    { num: "8k",   sup: "+",  label: "Users served"     },
    { num: "80",   sup: "%",  label: "Search latency cut"},
    { num: "3.56", sup: "",   label: "GPA · UMich CS"   },
  ],

  // Skill pills — add as many as you want, they wrap automatically
  coreStack: ["C++", "Python", "TypeScript", "React", "Swift / SwiftUI", "Kotlin", "SQL"],
  tools:     ["Node.js", "Supabase", "FastAPI", "Docker", "AWS / GCP", "GraphQL", "PyTorch", "Three.js"],
};

// ─────────────────────────────────────────────
//  EXPERIENCE
//  Add a new object to add a new experience card.
//  logo: import at top of this file, or set null to show initials.
// ─────────────────────────────────────────────
export const EXPERIENCES = [
  {
    company:   "Amazon Eero",
    role:      "Software Developer Engineer Intern · iOS",
    period:    "May – Aug 2026 · San Francisco",
    desc:      "Joining the eero iOS team in SOMA San Francisco. Building features for the home networking app used by millions. Swift, TCA architecture, SwiftUI. Deep-diving into consumer iOS product at scale.",
    tags:      ["Swift", "SwiftUI", "TCA", "iOS"],
    logo:      amazonLogo,
    initials:  "AE",
    iconColor: "#ff9900",
    iconGlow:  "rgba(255,153,0,0.35)",
  },
  {
    company:   "Desai Accelerator",
    role:      "Software Engineer Intern",
    period:    "May – Aug 2025 · Ann Arbor",
    desc:      "Shipped production-ready features for five early-stage startups in under three weeks each: a React Native cross-cultural e-commerce MVP (50+ beta users, 4.5/5 rating), an 80% faster Algolia search engine (2.5s → 0.5s), a Bluetooth/Wi-Fi Kotlin module for an AI wellness platform, and power management code for 48V LFP battery systems.",
    tags:      ["React Native", "TypeScript", "GraphQL", "Kotlin", "GCP", "Embedded C"],
    logo:      desaiLogo,
    initials:  "DA",
    iconColor: "#c77dff",
    iconGlow:  "rgba(199,125,255,0.35)",
  },
  {
    company:   "PERMIAS Nasional",
    role:      "Website Developer · Technical Lead",
    period:    "Nov 2024 – Present",
    desc:      "Led a team of three to rebuild the national Indonesian student org website (8,000+ users, 80+ sub-orgs) from TypeDream to a custom Astro + React stack. Cut annual costs 100% ($240 → $0), reduced manual data entry 80%, increased engagement 30% in the first month.",
    tags:      ["Astro", "React", "Tailwind", "Airtable", "Firebase"],
    logo:      permiasLogo,
    initials:  "PN",
    iconColor: "#48cae4",
    iconGlow:  "rgba(72,202,228,0.35)",
  },
  // ── Add more experiences below ──────────────────────────────
  // {
  //   company:   "Your Company",
  //   role:      "Your Role",
  //   period:    "Month Year – Month Year · City",
  //   desc:      "What you did.",
  //   tags:      ["Tag1", "Tag2"],
  //   logo:      null,          // or: import myLogo from "../images/mylogo.png"
  //   initials:  "YC",
  //   iconColor: "#c77dff",
  //   iconGlow:  "rgba(199,125,255,0.35)",
  // },
];


// ─────────────────────────────────────────────
//  PROJECTS
//  Add a new object to add a new project card.
//
//  featured: true  → spans 2 columns (use for your best work, max 1)
//    image: import a screenshot/preview from src/images/, or set null
//           for the default gradient placeholder.
//  featured: false → normal card (fills the grid automatically)
//
//  The grid is smart — it always fills completely with no orphan gaps.
// ─────────────────────────────────────────────

// ── Drop your featured project screenshot here ──────────────────
// import permiasPreview from "../images/permias-preview.png";
// Then set  image: permiasPreview  on the featured project below.

export const PROJECTS = [
  {
    featured: true,
    name:     "PERMIAS Nasional",
    desc:     "Complete rebuild of Indonesia's national student org website. Migrated 8,000+ users from a paid platform to a free, custom-built stack with automated data pipelines and form handling.",
    metrics:  ["30% engagement", "80% less manual work", "$240/yr saved"],
    stack:    ["Astro", "React TS", "Tailwind", "Airtable", "Firebase", "GitHub Pages"],
    image:    permiasWebsite,
    link:     "https://permiasnas.org", 
  },
  {
    featured: false,
    name:     "MailMind",
    desc:     "AI-powered email sorter using Gmail API and GPT-3.5. Real-time dashboard analytics, smart priority filtering, and Supabase auth.",
    metrics:  ["80% inbox automated", "60% less nav time"],
    stack:    ["React", "Supabase", "PostgreSQL", "GPT-3.5"],
  },
  {
    featured: false,
    name:     "Cross-Cultural E-Commerce MVP",
    desc:     "iOS/Android furnishing app for a non-English-speaking founder. Full RESTful backend, headless e-commerce, shipped in under three weeks.",
    metrics:  ["50 beta users", "4.5/5 rating"],
    stack:    ["React Native", "Expo", "PostgreSQL", "GCP"],
  },
  {
    featured: false,
    name:     "Euchre AI",
    desc:     "C++ implementation of Euchre with a Bayesian inference AI opponent. 30% higher win rate vs baseline bots using strategic heuristics.",
    metrics:  ["30% better win rate"],
    stack:    ["C++", "Bayesian inference", "Game theory"],
  },
  {
    featured: false,
    name:     "REVO",
    desc:     "Automotive marketplace startup co-founded and piloting in Ann Arbor. Built customer-facing onboarding, mechanic portal, and welcome flows.",
    metrics:  ["Actively piloting"],
    stack:    ["React", "Startup"],
  },
  // ── Add more projects below ──────────────────────────────────
  // {
  //   featured: false,
  //   name:     "Your Project",
  //   desc:     "What it does.",
  //   metrics:  ["Key metric"],
  //   stack:    ["Tech1", "Tech2"],
  // },
];


// ─────────────────────────────────────────────
//  CONTACT
// ─────────────────────────────────────────────
export const CONTACT = {
  headingLine1: "Let's",
  headingEm:    "build",
  sub:          `Open to conversations about interesting problems, full-time roles after Dec 2026,
                 or anything you're building that needs someone who ships.`,

  // Links shown as buttons — set primary: true on the one you want highlighted
  links: [
    { label: "Email Me",  href: "mailto:k.rexnath@gmail.com",                     primary: true  },
    { label: "LinkedIn",  href: "https://linkedin.com/in/rexellkurniawan",         primary: false },
    { label: "GitHub",    href: "https://github.com/rexellk",                      primary: false },
    // { label: "Resume", href: "https://...",                                      primary: false },
  ],

  footerName: "Rexell Kurniawan",
  footerCopy: "© 2026 · Built with intent",
};
