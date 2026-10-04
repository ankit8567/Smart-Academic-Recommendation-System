import React, { useRef, useState } from 'react';
import { StudentProfile, Subject, GamificationState } from '../types/academic';
import { calculateLevel } from '../utils/gamification';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Flame,
  Trophy,
  Award,
  Sparkles,
  QrCode,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface ShareableProfileCardModalProps {
  profile: StudentProfile;
  subjects: Subject[];
  gamification: GamificationState;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareableProfileCardModal: React.FC<ShareableProfileCardModalProps> = ({
  profile,
  subjects,
  gamification,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const levelInfo = calculateLevel(gamification.totalXP);
  const completedSubjectsCount = profile.completedSubjects.length;
  const completedTopicsCount = profile.completedTopicIds.length;

  const topInterest = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, val]) => val > 0)
    .slice(0, 4)
    .map(([dom]) => dom);

  const handleCopySummary = () => {
    const text =
      `🎓 Academic Portfolio Card: ${profile.name}\n` +
      `🏛️ ${profile.program} in ${profile.branch} (Sem ${profile.semester}) | CGPA: ${profile.cgpa.toFixed(2)}\n` +
      `🎯 Career Objective: ${profile.careerGoal}\n` +
      `🔥 Active Study Streak: ${gamification.streakDays} Days | Level ${levelInfo.level} (${levelInfo.title})\n` +
      `⚡ Total XP: ${gamification.totalXP} | Completed Units: ${completedTopicsCount}\n` +
      `⭐ Focus Domains: ${topInterest.join(', ')}\n` +
      `Verified via Academic Path Smart Guide`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    setDownloadingImg(true);

    try {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2x retina
      const width = 640;
      const height = 400;

      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a'); // slate-900
      bgGrad.addColorStop(0.5, '#1e293b'); // slate-800
      bgGrad.addColorStop(1, '#0284c7'); // sky-600
      ctx.fillStyle = bgGrad;
      ctx.roundRect(0, 0, width, height, 20);
      ctx.fill();

      // Top glowing accent line
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 20, 160, 4);

      // Header Text
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('ACADEMIC PASSPORT & SMART GUIDE', 20, 40);

      // Student Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(profile.name || 'Student Scholar', 20, 70);

      // Degree & Semester
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(
        `${profile.program} in ${profile.branch} • Semester ${profile.semester}`,
        20,
        92
      );

      // Career Goal Badge
      ctx.fillStyle = '#0369a1';
      ctx.roundRect(20, 108, 220, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`Target: ${profile.careerGoal}`, 30, 125);

      // Stats Grid Boxes
      const drawStatBox = (x: number, y: number, label: string, val: string, sub: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.roundRect(x, y, 130, 75, 10);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(label, x + 12, y + 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText(val, x + 12, y + 46);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(sub, x + 12, y + 64);
      };

      drawStatBox(20, 150, 'ACADEMIC CGPA', profile.cgpa.toFixed(2), 'Top Tier Merit');
      drawStatBox(160, 150, 'DAILY STREAK', `${gamification.streakDays} Days 🔥`, 'Active Learner');
      drawStatBox(300, 150, 'SCHOLAR LEVEL', `Lvl ${levelInfo.level}`, levelInfo.title);
      drawStatBox(440, 150, 'TOTAL XP', `${gamification.totalXP} XP`, 'Diagnostic Score');

      // Key Skill / Interest Chips
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('CORE COMPETENCIES & DOMAINS:', 20, 255);

      let chipX = 20;
      for (const dom of topInterest) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.roundRect(chipX, 268, 90, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillText(dom, chipX + 10, 284);
        chipX += 100;
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(20, 320, width - 40, 1);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(
        `Enrollment ID: ${profile.enrollmentNo || 'ACAD-2026-X'} • Completed Courses: ${completedSubjectsCount} • Verified by AI Engine`,
        20,
        350
      );

      // Simulated QR / Verification Stamp
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.roundRect(width - 95, 30, 75, 75, 8);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText('VERIFIED', width - 82, 60);
      ctx.fillText('SMART ID', width - 82, 75);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `academic_profile_${profile.name?.toLowerCase().replace(/\s+/g, '_') || 'card'}.png`;
      a.click();
    } finally {
      setDownloadingImg(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Shareable Academic Profile Card
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                High-resolution digital student passport exportable as PNG or PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
          <div
            ref={cardRef}
            className="w-full max-w-xl rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white border border-sky-500/30 shadow-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Academic Passport</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {profile.name || 'Student Scholar'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {profile.program} in {profile.branch} • Sem {profile.semester}
                </p>
              </div>

              {/* Verified Digital Seal */}
              <div className="w-16 h-16 rounded-xl border border-sky-400/40 bg-sky-950/60 p-2 flex flex-col items-center justify-center text-center">
                <QrCode className="w-6 h-6 text-sky-400" />
                <span className="text-[8px] font-mono uppercase text-sky-300 font-bold mt-1">
                  Verified
                </span>
              </div>
            </div>

            {/* Career Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Target: {profile.careerGoal}</span>
            </div>

            {/* Key Stat Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono">CGPA</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {profile.cgpa.toFixed(2)}
                </div>
                <div className="text-[9px] text-sky-400">Merit Standing</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span>Streak</span>
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {gamification.streakDays} Days
                </div>
                <div className="text-[9px] text-orange-400">Active Study</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Level</div>
                <div className="text-lg font-black text-white mt-0.5">
                  Lvl {levelInfo.level}
                </div>
                <div className="text-[9px] text-indigo-400 truncate">{levelInfo.title}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Total XP</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">
                  {gamification.totalXP}
                </div>
                <div className="text-[9px] text-amber-300">Points</div>
              </div>
            </div>

            {/* Competencies */}
            <div className="mt-5">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1.5">
                Focus Competency Domains:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topInterest.map((dom) => (
                  <span
                    key={dom}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-400/20"
                  >
                    {dom}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>ID: {profile.enrollmentNo || 'ACAD-2026-091'}</span>
              <span>Academic Path Smart Guide</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="no-print p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export as PDF</span>
            </button>

            <button
              type="button"
              disabled={downloadingImg}
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingImg ? 'Generating...' : 'Download Image (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
