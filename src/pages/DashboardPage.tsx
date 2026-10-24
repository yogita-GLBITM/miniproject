import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Award,
  Clock,
  ClipboardList,
  ShieldAlert,
  Sparkles,
  BookOpen,
  FileText,
  GraduationCap,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Plus,
  Mic,
  Send,
  Layers,
  CalendarDays,
  Bot,
  ChevronDown
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { TodayTimetableCard } from '../components/dashboard/TodayTimetableCard';
import { AttendanceHealthCard } from '../components/dashboard/AttendanceHealthCard';
import { AcademicPerformanceCard } from '../components/dashboard/AcademicPerformanceCard';
import { AIRecommendationCard } from '../components/dashboard/AIRecommendationCard';
import { UpcomingDeadlinesCard } from '../components/dashboard/UpcomingDeadlinesCard';
import { LoadingState } from '../components/common/LoadingState';

import { attendanceService } from '../services/attendanceService';
import { academicService } from '../services/academicService';
import { riskService } from '../services/riskService';
import { authService } from '../services/authService';
import {
  AttendanceSummary,
  SubjectAttendance,
  TimetableSlot,
  SubjectMarks,
  AcademicRiskReport,
  UserProfile
} from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [todayClasses, setTodayClasses] = useState<TimetableSlot[]>([]);
  const [marks, setMarks] = useState<SubjectMarks[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState<{ id: string; title: string; message: string }[]>([]);
  const [riskReport, setRiskReport] = useState<AcademicRiskReport | null>(null);
  const [quickPrompt, setQuickPrompt] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let u: UserProfile | null = null;
        try {
          u = await authService.getCurrentUser();
        } catch {
          u = await authService.login('GLB21CS0892', 'password123', 'student').catch(() => null);
        }
        setUser(u);

        const [attSummRes, attSubsRes, ttRes, mksRes, mksInsightsRes, riskRes] = await Promise.allSettled([
          attendanceService.getAttendanceSummary(),
          attendanceService.getSubjectAttendance(),
          academicService.getTodayClasses(),
          academicService.getSubjectMarks(),
          academicService.getMarksInsights(),
          riskService.getRiskReport()
        ]);

        if (attSummRes.status === 'fulfilled') setAttendanceSummary(attSummRes.value);
        else {
          setAttendanceSummary({
            overallPercentage: 78.4,
            classesAttended: 45,
            totalClasses: 58,
            classesMissed: 13,
            subjectsAtRiskCount: 1,
            safeMarginClasses: 3,
            targetRequirement: 75.0,
            insight: {
              subject: 'Database Management Systems',
              currentPercentage: 73.0,
              classesNeeded: 2,
              message: 'Attend next 2 DBMS lectures to cross the mandatory 75% eligibility threshold.'
            }
          });
        }

        if (attSubsRes.status === 'fulfilled') setSubjectAttendance(attSubsRes.value);
        if (ttRes.status === 'fulfilled') setTodayClasses(ttRes.value);
        if (mksRes.status === 'fulfilled') setMarks(mksRes.value);
        if (mksInsightsRes.status === 'fulfilled') setPerformanceInsights(mksInsightsRes.value);
        
        if (riskRes.status === 'fulfilled') setRiskReport(riskRes.value);
        else {
          setRiskReport({
            overallRisk: 'MEDIUM',
            score: 42,
            title: 'Moderate Academic Health Indicator',
            whyExplanation: 'DBMS attendance is at 73.0% (below 75% AKTU condonation threshold).',
            factors: [
              {
                id: 'f-1',
                factor: 'Attendance',
                status: 'Warning',
                value: '78.4%',
                impactScore: 42,
                detail: 'DBMS attendance requires 2 more attended classes to reach 75% safety.'
              }
            ],
            recommendedActions: [
              {
                id: 'a-1',
                action: 'Attend next 2 DBMS lectures without absences',
                priority: 'Immediate',
                subject: 'KCS-601'
              }
            ]
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickPrompt.trim()) return;
    navigate(`/copilot?prompt=${encodeURIComponent(quickPrompt.trim())}`);
  };

  if (loading || !attendanceSummary || !riskReport) {
    return <LoadingState message="Loading GL Bajaj CampusOS Dashboard..." subMessage="Syncing attendance metrics and academic records" />;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Yuvraj';

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* THEME HERO WORKSPACE (Matches exact theme from Image 1)       */}
      {/* ============================================================ */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[36px] p-6 sm:p-10 border border-white shadow-[0_20px_50px_rgba(79,70,229,0.06)] overflow-hidden">
        {/* Soft atmospheric gradient orbs */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-amber-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Status & Campus Tag */}
        <div className="relative z-10 flex items-center justify-between pb-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-800 font-bold border border-slate-200/60 shadow-2xs hover:bg-slate-200/70 transition-colors cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assistant v2.6</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px] sm:text-xs">
            <span>Daily CampusOS</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{user?.semester} • {user?.section}</span>
          </div>
        </div>

        {/* Hero Title & Mascot Header */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2 pb-6">
          <div className="lg:col-span-8 space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Hi <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{firstName}</span>, Ready to <br />
              Achieve Great Things?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              Your AI-powered academic workspace for GL Bajaj Institute of Technology &amp; Management. Real-time attendance health, exam readiness &amp; AKTU syllabus copilot.
            </p>
          </div>

          {/* 3D Mascot Character with Floating Speech Bubble (Exact match to Image 1) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end relative">
            <div className="relative flex flex-col items-center">
              {/* Floating Speech Bubble */}
              <div className="absolute -top-7 -left-12 sm:-left-16 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl rounded-br-none shadow-md border border-slate-200/90 text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap animate-bounce-subtle">
                <span>Hey there! 👋</span>
                <span className="text-indigo-600">Need a boost?</span>
              </div>

              {/* 3D Glossy Mascot Avatar */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 group cursor-pointer" onClick={() => navigate('/copilot')}>
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-blue-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <img
                  src="/mascot.png"
                  alt="Campus AI Mascot"
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-xl transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Iconic Feature Cards (Matches the 3 cards in user screenshot) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-8">
          {/* Card 1: Fast Start / Academics */}
          <div
            onClick={() => navigate('/academics')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-amber-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                Contribute ideas, track course modules, and manage academic submissions — all in sync.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-amber-700">
              <span>Fast Start</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: AI Bot / Copilot */}
          <div
            onClick={() => navigate('/copilot')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                Stay connected with syllabus archives, query PYQs, and align exam goals effortlessly with AI Bot.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-700">
              <span>Collaborate with AI</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Planning / Timetable */}
          <div
            onClick={() => navigate('/study-planner')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-blue-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                Organize your study hours efficiently, set clear revision priorities, and stay focused.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-700">
              <span>Planning</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Bottom Interactive AI Prompt Search Bar (Matches Image 1 bottom bar) */}
        <div className="relative z-10 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between pb-3 px-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Unlock academic insights with Campus AI
            </span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Powered by Assistant v2.6</span>
          </div>

          <form
            onSubmit={handlePromptSubmit}
            className="flex items-center gap-2 p-2 rounded-full bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 shadow-[0_4px_16px_rgba(0,0,0,0.02)] focus-within:bg-white focus-within:border-indigo-500 focus-within:shadow-md transition-all"
          >
            <button
              type="button"
              onClick={() => navigate('/copilot')}
              className="p-2 rounded-full hover:bg-slate-200/70 text-slate-500 transition-colors shrink-0"
              title="Add Context / Document"
            >
              <Plus className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder='Example: "Explain DBMS Normalization (3NF vs BCNF) with AKTU PYQ examples"'
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none px-2"
            />

            <button
              type="button"
              onClick={() => setQuickPrompt('Summarize high-frequency AKTU questions for DBMS Unit 3')}
              className="p-2 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              title="Voice Prompt or Preset"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all shrink-0"
              title="Send to Campus AI"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6 SUMMARY STAT CARDS (Curated Modern Styling)                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          id="stat-attendance"
          title="Attendance"
          value={`${attendanceSummary.overallPercentage.toFixed(1)}%`}
          subtitle="45 / 58 Sessions"
          icon={CalendarCheck}
          badgeText={attendanceSummary.overallPercentage < 75 ? "At Risk" : "Safe"}
          badgeVariant={attendanceSummary.overallPercentage < 75 ? "warning" : "safe"}
          onClick={() => navigate('/attendance')}
        />

        <StatCard
          id="stat-cgpa"
          title="Cumulative CGPA"
          value={user?.cgpa ? user.cgpa.toFixed(2) : '8.65'}
          subtitle="SGPA: 8.82 (Sem V)"
          icon={Award}
          badgeText="Top 10%"
          badgeVariant="safe"
          onClick={() => navigate('/marks')}
        />

        <StatCard
          id="stat-classes"
          title="Today's Classes"
          value={`${todayClasses.length || 4}`}
          subtitle="Next: DBMS at 10:00 AM"
          icon={Clock}
          badgeText="1 Completed"
          badgeVariant="neutral"
          onClick={() => navigate('/timetable')}
        />

        <StatCard
          id="stat-assignments"
          title="Pending Tasks"
          value="3"
          subtitle="1 Due Tomorrow"
          icon={ClipboardList}
          badgeText="Action Req."
          badgeVariant="critical"
          onClick={() => navigate('/assignments')}
        />

        <StatCard
          id="stat-risk"
          title="Academic Risk"
          value={riskReport.overallRisk}
          subtitle={`Score: ${riskReport.score} / 100`}
          icon={ShieldAlert}
          badgeText="Attendance Margin"
          badgeVariant="warning"
          onClick={() => navigate('/academic-risk')}
        />

        <StatCard
          id="stat-credits"
          title="Earned Credits"
          value="118 / 160"
          subtitle="24 in Current Sem"
          icon={GraduationCap}
          badgeText="AKTU Track"
          badgeVariant="accent"
          onClick={() => navigate('/academics')}
        />
      </div>

      {/* AI Recommendation Engine Card */}
      <AIRecommendationCard
        recommendationText="Revise DBMS Normalization for 40 minutes and solve 5 related AKTU PYQs."
        subjectCode="KCS-601"
      />

      {/* Grid: Today's Timetable & Attendance Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTimetableCard slots={todayClasses} />
        <AttendanceHealthCard summary={attendanceSummary} subjects={subjectAttendance} />
      </div>

      {/* Grid: Academic Performance & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcademicPerformanceCard subjectMarks={marks} insights={performanceInsights} />
        <UpcomingDeadlinesCard />
      </div>
    </div>
  );
};
