// Every piece of content on the page lives here. Edit this file, not the
// components — they only decide how it is laid out.

export const profile = {
  name: 'Muhammad Usmonov',
  first: 'Muhammad',
  last: 'Usmonov',
  role: 'AI Engineer — LLM, RAG & agent systems',
  location: 'Tashkent, Uzbekistan',
  email: 'me@ameer.uz',
  phone: '+998 (95) 010-1606',
  available: true,
  tagline:
    'I build production LLM systems in Python — conversation intelligence, retrieval pipelines and the backend services around them, designed to stay reliable once real traffic hits.',
}

export const socials = [
  { label: 'GitHub', key: 'github', href: 'https://github.com/ameer611' },
  { label: 'LinkedIn', key: 'linkedin', href: 'https://linkedin.com/in/muhammad-usmonov-oo1' },
  { label: 'Medium', key: 'medium', href: 'https://usmon-muxammad.medium.com/' },
]

export const profileCopy = {
  heading: 'Bridging applied AI and dependable backend engineering',
  paragraphs: [
    "I'm an AI Engineer at Metasell AI, where I own the pipeline that transcribes, scores and reports on sales conversations — from the model behind the analysis to the alerting and CRM workflows built on top of it.",
    'Before that I shipped a full commerce, search and AI-observability stack for a business platform in Uzbekistan, and built RESTful services for a large governmental system at the Ministry of Economy and Finance.',
    'My work runs on Python, FastAPI and LangGraph, with RAG and vector search where retrieval matters — and I stay close enough to the frontend to ship a product end to end when that is what the job needs.',
  ],
  focus: [
    'LLM Systems',
    'RAG Architectures',
    'Agent Workflows',
    'Backend Engineering',
    'API Design',
    'System Design',
    'Data Pipelines',
    'Full-Stack Delivery',
  ],
}

export const jobs = [
  {
    role: 'AI Engineer',
    company: 'Metasell AI',
    detail: 'Conversation intelligence for sales teams · Tashkent',
    period: 'Jul 2026 — Present',
    stack: ['Python', 'FastAPI', 'LangGraph', 'LLM APIs', 'Speech-to-text', 'PostgreSQL'],
    points: [
      'Migrated the production model behind analysis and scoring, cutting model running costs by roughly 30% while holding output quality steady.',
      "Extended the scoring pipeline with reasoning in the model's output, and defined the manager rating formula across conversation volume, quality, and average and total talk time.",
      'Built an automated alerting channel that fires when a conversation score falls outside configurable thresholds, delivering the score, a link to the conversation and total talk time.',
      'Own reliability of the analysis pipeline — diagnosing and resolving calls that were not transcribed, scored or reported correctly across production accounts.',
      'Delivered CRM and analytics work — lost-lead reassignment, follow-up tracking, pipeline and date-filter fixes, custom analytics date ranges — alongside an architecture review of the CRM and a technical audit of the AI stack.',
    ],
  },
  {
    role: 'Full Stack Developer',
    company: 'I4Solutions Startup Studio',
    detail: 'BizLink — business platform for Uzbekistan · Tashkent',
    period: 'Apr 2026 — Jun 2026',
    stack: ['Next.js', 'TypeScript', 'React', 'SSR / SEO', 'Telegram Bot API', 'Click Payments'],
    points: [
      'Owned three epics end to end: the commerce system, the search growth engine and the AI observability layer.',
      'Designed the product model for physical, digital and donation offerings, then built cart, orders and checkout with Telegram handoff and Click payment.',
      'Implemented digital delivery — file, link or access — on successful payment, and enforced TIN requirements for shop-enabled businesses.',
      'Built a geo index across country, city and district that drives dynamically generated search pages, with pagination and canonical rules.',
      'Shipped SEO-friendly search and geo layouts, a filtered search UI, the product catalogue, cart UI and an embeddable donation widget.',
      'Added machine-readable blocks and public data endpoints with freshness timestamps so AI systems and crawlers can read BizLink data, plus an AI-assisted summary generator surfaced in SSR-visible sections.',
    ],
  },
  {
    role: 'Python Developer — Intern',
    company: 'Ministry of Economy and Finance',
    detail: 'Republic of Uzbekistan',
    period: 'Jul 2025 — Jan 2026',
    stack: ['Python', 'FastAPI', 'Apache Kafka', 'PostgreSQL', 'Docker', 'Microservices'],
    points: [
      'Designed RESTful APIs for datasets exceeding 100k records, adding pagination and query optimisation that cut response latency by 40%.',
      'Built the region, district, planning, statistics and reporting modules on hierarchical region–district data models.',
      'Delivered analytics and quarterly reporting endpoints with aggregated metrics, improving data visibility for multiple departments.',
      'Built a centralised logging system on Apache Kafka handling 50k+ events per day, enabling real-time monitoring and faster incident resolution.',
      'Developed and deployed an MD5-hashing URL shortener microservice to manage links for SMS marketing campaigns and improve campaign tracking.',
      'Analysed and tested the existing architecture and endpoints, contributing to backend design and code review across multiple services.',
    ],
  },
  {
    role: 'Software Developer — Volunteer',
    company: 'United Nations Development Programme',
    detail: 'UNDP',
    period: 'Nov 2025 — Jan 2026',
    stack: ['Python'],
    points: [
      'Contributed development work to UNDP digital initiatives alongside a distributed volunteer engineering team.',
    ],
  },
]

export const projects = [
  {
    title: 'Ofiyat Med',
    kind: 'Trilingual clinic website',
    period: 'Aug 2026',
    blurb:
      'A dependency-free trilingual site for a multi-specialty private medical centre and 24/7 inpatient hospital in Tashkent.',
    points: [
      'Hand-written HTML, CSS and vanilla JavaScript — no framework and no build step.',
      'One set of markup serves Uzbek, Russian and English: content and UI strings live in separate data and i18n modules, with the language auto-selected from browser locale, remembered in localStorage and forceable via a ?lang= parameter for campaign links.',
      'Structured for search with MedicalClinic JSON-LD, per-language titles and descriptions, canonical and hreflang alternates, robots.txt and a sitemap.',
      'Colour system derived from the brand red so that deepened shades carry text and buttons, clearing WCAG AA contrast.',
      'Deployed on GitHub Pages behind a custom .uz domain — apex A records, www CNAME, Let’s Encrypt certificate and enforced HTTPS.',
    ],
    tech: ['HTML', 'CSS', 'JavaScript', 'i18n', 'JSON-LD', 'GitHub Pages'],
    link: 'https://ofiyatmed.uz',
    linkLabel: 'Visit ofiyatmed.uz',
  },
  {
    title: 'TAVFIQNASHR',
    kind: 'Bilingual publishing house website',
    period: 'Aug 2026',
    blurb:
      'A bilingual site for a publishing house specialising in classical and Islamic literature, built to load fast on the phones its readers actually use.',
    points: [
      'Two fully translated pages sharing one stylesheet and script, cross-linked with hreflang and localised section anchors.',
      'Mobile designed as its own layout rather than a narrowed desktop one: slide-down menu with blurred backdrop, body scroll lock, close on Esc, backdrop or link tap, and safe-area insets for notched phones.',
      'Re-anchored image crops so cover headlines survive narrow viewports, with touch targets kept at 36px or larger.',
      'Images self-hosted from the publisher’s own channel, so the page carries no external image dependencies.',
      'Shipped on GitHub Pages with a custom .uz domain, then migrated to Cloudflare DNS with Full SSL and Always Use HTTPS, preserving mail records through the move.',
    ],
    tech: ['HTML', 'CSS', 'JavaScript', 'hreflang', 'Cloudflare', 'GitHub Pages'],
    link: 'https://tavfiqnashr.uz',
    linkLabel: 'Visit tavfiqnashr.uz',
  },
  {
    title: 'Postgres Pro Support',
    kind: 'Retrieval-augmented assistant',
    period: 'May — Jun 2026',
    blurb:
      'A production RAG assistant over the PostgreSQL 14 documentation that answers technical questions with exact source citations.',
    points: [
      'Built the retrieval stack on LangChain, Qdrant, Hugging Face embeddings and Groq LLMs.',
      'Engineered the full semantic pipeline: preprocessing, chunking, embedding generation and vector similarity search.',
      'Grounded every response strictly in the official documentation to minimise hallucination.',
    ],
    tech: ['LangChain', 'Qdrant', 'Hugging Face', 'Groq API', 'Streamlit', 'Python'],
    link: 'https://huggingface.co/spaces/Ameer1606/PostgresPro-Support',
    linkLabel: 'View on Hugging Face Spaces',
  },
  {
    title: 'AI Medicine Reminder',
    kind: 'Multimodal Telegram assistant',
    period: 'Apr 2026',
    blurb:
      'A Telegram bot that reads a photograph of a prescription and turns it into a scheduled course of medication reminders.',
    points: [
      'Built scheduling and notification delivery on FastAPI, Aiogram and APScheduler.',
      'Integrated Google Gemini for multimodal prescription processing, automating data entry through image-to-text OCR.',
      'Used the Cerebras AI API to validate and normalise extracted drug information, improving data accuracy.',
    ],
    tech: ['FastAPI', 'Aiogram', 'APScheduler', 'Google Gemini', 'Cerebras AI'],
    link: 'https://t.me/dorivor_eslatma_bot',
    linkLabel: 'Open the Telegram bot',
  },
]

export const skillGroups = [
  {
    title: 'Programming languages',
    tags: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'C++', 'HTML', 'CSS'],
  },
  {
    title: 'LLM, agents & retrieval',
    tags: [
      'LangGraph', 'LangChain', 'RAG', 'OpenAI', 'Anthropic (Claude)', 'Google Gemini',
      'Groq', 'Cerebras', 'Hugging Face', 'Speech-to-text', 'EasyOCR', 'Prompt engineering',
    ],
  },
  {
    title: 'Machine learning & data',
    tags: ['pandas', 'polars', 'numpy', 'Scikit-learn', 'Keras', 'matplotlib', 'seaborn', 'Power BI'],
  },
  {
    title: 'Agentic tooling',
    tags: ['MCP', 'Claude Code', 'Codex', 'GitHub Copilot', 'Antigravity', 'Cursor'],
  },
  {
    title: 'Backend & web',
    tags: [
      'FastAPI', 'Django', 'Django REST Framework', 'Next.js', 'React',
      'SSR / SEO', 'Nginx', 'Docker', 'CI/CD',
    ],
  },
  {
    title: 'Databases & vector search',
    tags: ['PostgreSQL', 'Qdrant', 'MySQL', 'SQLite', 'MongoDB', 'Redis'],
  },
  { title: 'Cloud & hosting', tags: ['GCP', 'AWS', 'DigitalOcean', 'Cloudflare', 'GitHub Pages'] },
  {
    title: 'Infrastructure & tools',
    tags: ['Git', 'Linux', 'Kafka', 'RabbitMQ', 'Celery', 'SQLAlchemy', 'Alembic', 'Postman', 'Swagger', 'Jira'],
  },
  {
    title: 'Concepts',
    tags: [
      'System design', 'Scalability', 'Fault tolerance', 'Microservices', 'Async processing',
      'Caching', 'WebSockets', 'tRPC', 'JWT', 'OOP', 'Multiprocessing', 'Multithreading',
      'Model evaluation', 'Tokenisation', 'Agile / Kanban',
    ],
  },
]

export const education = [
  {
    qualification: "Bachelor's degree, Computer Science",
    field: 'Artificial Intelligence Solutions and Applications',
    institution: 'PDP University',
    institutionUrl: 'https://pdpu.uz/',
    place: 'Tashkent, Uzbekistan',
    period: 'Oct 2023 — May 2027',
    grade: '4.8 / 5.0',
  },
]

export const awards = [
  {
    title: 'AI500! Hackathon — Top 4% finalist',
    issuer: 'Agrobank & IT Community of Uzbekistan',
    period: 'Dec 2025',
    detail:
      'Built AirWatch AI, an air-quality prediction project, with the AiGroup team — selected among the Top 50 of more than 1,300 competing teams.',
  },
]

export const certifications = [
  {
    title: 'Python Development',
    issuer: 'PDP Academy',
    period: 'Nov 2024',
    detail: 'Credential ID 05139',
  },
  {
    title: 'FastAPI — The Complete Course (Beginner + Advanced)',
    issuer: 'Udemy',
    period: 'Dec 2024',
    detail: 'JWT authentication, SQLAlchemy and production deployment',
  },
]

export const spokenLanguages = [
  { name: 'Uzbek', level: 'Native' },
  { name: 'English', level: 'Professional working proficiency' },
  { name: 'Russian', level: 'Limited working proficiency' },
]

export const resumes = [
  {
    code: 'EN',
    label: 'English',
    href: '/resume-en.pdf',
    file: 'Muhammad_Usmonov_Resume_EN.pdf',
  },
  {
    code: 'RU',
    label: 'Русский',
    href: '/resume-ru.pdf',
    file: 'Muhammad_Usmonov_Resume_RU.pdf',
  },
]

// Recruiters read in this order: who you are, where you've worked, whether
// your stack matches the brief, proof you can build, credentials, how to
// reach you. Skills sit above projects because a first pass is a keyword
// match — the deep read of the project write-ups only happens after it.
// This array drives both the nav and the scroll spy, so keep it in step
// with the component order in App.jsx.
export const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]
