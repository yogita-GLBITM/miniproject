import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, EnrolledStudentItem } from '../services/authService';
import { CollegeBrand } from '../components/common/CollegeBrand';
import {
  User,
  ArrowRight,
  BookOpen,
  Building2,
  Hash,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Search,
  ChevronDown,
  Layers,
  ChevronRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Fetch live student roster from database
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        const students = await authService.getEnrolledStudents();
        if (isMounted) {
          setEnrolledStudents(students);
          // If roster loaded, optionally initialize with Yuvraj or Aarav
          if (students.length > 0 && !rollNumber && !studentName) {
            const defaultStudent = students.find((s) => s.name.toLowerCase().includes('yuvraj')) || students[0];
            setRollNumber(defaultStudent.rollNumber);
            setStudentName(defaultStudent.name);
          }
        }
      } catch (err) {
        console.warn('Could not load student roster:', err);
      } finally {
        if (isMounted) setIsLoadingRoster(false);
      }
    };

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute matched student from live database roster
  const matchedStudent = useMemo(() => {
    if (!enrolledStudents.length) return null;
    const cleanRoll = rollNumber.trim().toLowerCase();
    const cleanName = studentName.trim().toLowerCase();

    // Priority 1: Match by Roll Number (exact or last 6 digits for batch prefix tolerance)
    if (cleanRoll) {
      const matchRoll =
        enrolledStudents.find(
          (s) => s.rollNumber.toLowerCase() === cleanRoll || s.collegeId.toLowerCase() === cleanRoll
        ) ||
        (cleanRoll.length >= 6
          ? enrolledStudents.find((s) => s.rollNumber.toLowerCase().includes(cleanRoll.slice(-6)))
          : null);
      if (matchRoll) return matchRoll;
    }

    // Priority 2: Match by Name
    if (cleanName) {
      return (
        enrolledStudents.find((s) => s.name.toLowerCase() === cleanName) ||
        enrolledStudents.find((s) => s.name.toLowerCase().includes(cleanName))
      );
    }

    return null;
  }, [rollNumber, studentName, enrolledStudents]);

  // Filtered students for quick picker
  const filteredStudents = useMemo(() => {
    if (!filterQuery.trim()) return enrolledStudents;
    const q = filterQuery.toLowerCase();
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q) ||
        s.semester.toLowerCase().includes(q)
    );
  }, [enrolledStudents, filterQuery]);

  const selectStudent = (student: EnrolledStudentItem) => {
    setRollNumber(student.rollNumber);
    setStudentName(student.name);
    setErrorMessage(null);
    setShowQuickPicker(false);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      if (selectedRole === 'student') {
        const cleanRoll = rollNumber.trim();
        const cleanName = studentName.trim();

        if (matchedStudent) {
          await authService.login({
            rollNumber: matchedStudent.rollNumber,
            name: matchedStudent.name,
            role: 'student',
          });
        } else if (cleanRoll || cleanName) {
          await authService.login({
            rollNumber: cleanRoll || undefined,
            name: cleanName || undefined,
            role: 'student',
          });
        } else {
          await authService.switchRole('student');
        }
        navigate('/dashboard');
      } else if (selectedRole === 'faculty') {
        await authService.switchRole('faculty');
        navigate('/faculty');
      } else if (selectedRole === 'admin') {
        await authService.switchRole('admin');
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(
        err.message || 'Authentication failed. Please verify that the Roll Number or Name matches an enrolled student.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2FB] via-[#E8EDFA] to-[#FAF3EB] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/50 via-purple-100/40 to-amber-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_25px_60px_-15px_rgba(79,70,229,0.08)] border border-white p-6 sm:p-8 space-y-5">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <CollegeBrand variant="login" />
          <div className="pt-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sign In to CampusOS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Academic ERP &amp; AI Intelligence Workspace • GLBITM
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Select Role Experience
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'student'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <span className="text-xs font-bold block">Student</span>
              <span className="text-[10px] text-slate-500 truncate block">
                {matchedStudent ? matchedStudent.name : 'Enrolled Student'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('faculty');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'faculty'
                  ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <span className="text-xs font-bold block">Faculty</span>
              <span className="text-[10px] text-slate-500 block">Dr. Sharma</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setErrorMessage(null);
              }}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-5 h-5 mx-auto mb-1 text-amber-600" />
              <span className="text-xs font-bold block">Admin</span>
              <span className="text-[10px] text-slate-500 block">Dean Office</span>
            </button>
          </div>
        </div>

        {/* Dynamic Form Area Based on Selected Role */}
        {selectedRole === 'student' ? (
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Student Credentials (Database Verified)
                </span>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  {enrolledStudents.length} Students Active
                </span>
              </div>

              {/* Roll Number Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  University Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRollNumber(val);
                      setErrorMessage(null);
                      const clean = val.trim().toLowerCase();
                      if (clean) {
                        const found = enrolledStudents.find(
                          (s) => s.rollNumber.toLowerCase() === clean || (clean.length >= 6 && s.rollNumber.toLowerCase().includes(clean.slice(-6)))
                        );
                        if (found) {
                          setStudentName(found.name);
                        }
                      }
                    }}
                    placeholder="e.g. 2101920100142 or 2501920100012"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Student Name Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Student Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. Yuvraj, Ishaan Sen, Aryan Mishra"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Live Database Match Preview */}
              {matchedStudent ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                      <span>{matchedStudent.name}</span>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                        {matchedStudent.rollNumber}
                      </span>
                    </div>
                    <p className="text-emerald-700 mt-0.5">
                      {matchedStudent.branch} • {matchedStudent.semester} (Sec {matchedStudent.section})
                    </p>
                  </div>
                </div>
              ) : (rollNumber.trim() || studentName.trim()) ? (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Will search database records on sign in</span>
                </div>
              ) : null}

              {/* Quick Roster Selector Dropdown / Popover Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowQuickPicker(!showQuickPicker)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 text-blue-800 text-[11px] font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Browse All {enrolledStudents.length} Database Students (Sem I to VIII)
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-blue-600 transition-transform ${showQuickPicker ? 'rotate-180' : ''}`} />
                </button>

                {showQuickPicker && (
                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder="Search student by name, roll, or branch..."
                        className="w-full pl-8 pr-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => selectStudent(st)}
                            className="w-full text-left py-2 px-2 hover:bg-blue-50/60 rounded-lg flex items-center justify-between group transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900 truncate">
                                {st.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {st.rollNumber} • {st.branch} ({st.semester})
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 shrink-0" />
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 text-center py-3">
                          No student matching "{filterQuery}" found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>
                {isAuthenticating
                  ? 'Authenticating...'
                  : matchedStudent
                  ? `Enter as ${matchedStudent.name.toUpperCase()}`
                  : 'Enter as STUDENT'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : selectedRole === 'faculty' ? (
          <div className="space-y-4 pt-1">
            <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <BookOpen className="w-4 h-4 text-purple-700" />
                Faculty Portal Access
              </div>
              <p className="text-xs text-purple-800/80">
                Authorized Faculty Profile: <strong>Dr. Sharma</strong> (Dept. of Computer Science &amp; Engineering)
              </p>
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-purple-100 flex items-center justify-between">
                <span>Faculty ID: <code className="font-mono font-bold text-slate-800">GLBFAC001</code></span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">Active Instructor</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'Connecting...' : 'Enter as FACULTY'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Building2 className="w-4 h-4 text-amber-700" />
                Institutional Administration Access
              </div>
              <p className="text-xs text-amber-800/80">
                Dean Office: <strong>Prof. (Dr.) Manas Kumar Mishra</strong> (Academic Affairs)
              </p>
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between">
                <span>Admin Code: <code className="font-mono font-bold text-slate-800">GLB-ADMIN-001</code></span>
                <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold text-[10px]">SuperAdmin</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{isAuthenticating ? 'Connecting...' : 'Enter as ADMIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="pt-1 text-center">
          <p className="text-[11px] text-slate-400">
            GL Bajaj Institute of Technology &amp; Management • Greater Noida, Uttar Pradesh, India
          </p>
        </div>
      </div>
    </div>
  );
};
