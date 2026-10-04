# Academic Path Smart Guide

A personalized academic recommendation engine, prerequisite-aware learning roadmap builder, skill-gap analyzer, resource library, mentor console, and curriculum administration suite designed for college students.

## Features
- **Profile & Onboarding**: Qualification details, interest sliders (1–5), career goals, and preferred learning modalities.
- **Weighted Recommendations**: Formula-driven ranking (`0.35*interest + 0.25*readiness + 0.25*career + 0.15*weak_area`) with instant recalibration and interactive feedback.
- **Prerequisite-Aware Roadmaps**: Topological course sequencing with locked/unlocked state progression.
- **Progress Tracking & Analytics**: Skill gap benchmark comparison against career goals, diagnostic quiz tracking, and weak-area alerts.
- **Resource Repository**: Curated videos, structured notes, and hands-on practice labs with bookmarking.
- **Mentor Guidance Console**: Faculty advice feed and progress monitoring.
- **Admin Panel**: Full CRUD for curriculum subjects, units, topics, prerequisites, and study materials.
- **Export & Offline Resilience**: One-click printable PDF study plan and localStorage persistence.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Test production build locally
npm run build
npm run preview
```

---

## Deploying to Vercel

This repository is optimized for **zero-configuration Vercel deployment**:

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Go to the [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Vercel automatically detects the build parameters:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` (runs `tsc --noEmit && vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. No environment variables are required to run the demo.
5. Click **Deploy**.

Client-side SPA route rewrites and asset caching headers are pre-configured in `vercel.json` to prevent 404s on page refresh.
