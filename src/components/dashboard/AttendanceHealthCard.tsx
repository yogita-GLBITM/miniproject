import React from 'react';
import { SubjectAttendance, AttendanceSummary } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { AlertCircle, ArrowUpRight, Calculator, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AttendanceHealthCardProps {
  summary: AttendanceSummary;
  subjects: SubjectAttendance[];
}

export const AttendanceHealthCard: React.FC<AttendanceHealthCardProps> = ({
  summary,
  subjects
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Health</h3>
            <p className="text-xs text-slate-500">Subject-wise status vs mandatory 75% university eligibility</p>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
          >
            Details &amp; Simulator
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Subject-wise bars */}
        <div className="space-y-4 mb-5">
          {subjects.slice(0, 4).map((sub) => {
            const isAtRisk = sub.percentage < 75.0;
            return (
              <div key={sub.subjectCode} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-800 truncate">{sub.subjectName}</span>
                    <span className="text-[10px] font-mono text-slate-600 font-medium">({sub.subjectCode})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900">{sub.percentage.toFixed(1)}%</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isAtRisk
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
                <ProgressBar value={sub.percentage} threshold={75} size="md" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Insight Card */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-900">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              Attendance Insight
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {summary?.insight?.message || 'Attendance records synchronized. Maintain attendance above 75% for exam eligibility.'}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/attendance')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2"
              >
                <Calculator className="w-3.5 h-3.5" />
                Launch Attendance Simulator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
