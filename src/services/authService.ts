import { UserProfile, UserRole } from '../types';
import { apiClient } from './api';
import { mockCurrentStudent, mockFacultyUser } from '../data/mock/mockStudents';

const mockAdminUser: UserProfile = {
  ...mockFacultyUser,
  id: 'admin-001',
  name: 'Dr. P. K. Singh',
  role: 'admin',
  collegeId: 'ADMIN001',
  email: 'director@glbitm.ac.in',
  department: 'Director Office',
};

const AUTH_STORAGE_KEY = 'glb_campusos_user';
const ROLE_STORAGE_KEY = 'glb_campusos_role';
const TOKEN_KEY = 'glb_auth_token';

export interface EnrolledStudentItem {
  id: string;
  name: string;
  rollNumber: string;
  collegeId: string;
  branch: string;
  semester: string;
  section: string;
}

export const authService = {
  /**
   * Retrieves list of all enrolled students from database for easy login selection.
   */
  async getEnrolledStudents(): Promise<EnrolledStudentItem[]> {
    try {
      const data = await apiClient<EnrolledStudentItem[]>('/auth/students');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('Backend unavailable, using local student roster:', err);
    }
    return [
      { id: 'st-01', name: 'Yuvraj Singh', rollNumber: '2101920100189', collegeId: 'GLB21CS0892', branch: 'Computer Science & Engineering', semester: 'Semester VI', section: 'CSE-A' },
      { id: 'st-02', name: 'Aarav Sharma', rollNumber: '2101920100004', collegeId: 'GLB21CS0012', branch: 'Computer Science & Engineering', semester: 'Semester VI', section: 'CSE-A' },
      { id: 'st-03', name: 'Priya Patel', rollNumber: '2101920100112', collegeId: 'GLB21CS0451', branch: 'Computer Science & Engineering', semester: 'Semester VI', section: 'CSE-B' },
      { id: 'st-04', name: 'Rohan Gupta', rollNumber: '2101920100135', collegeId: 'GLB21CS0582', branch: 'Computer Science & Engineering', semester: 'Semester VI', section: 'CSE-B' },
      { id: 'st-05', name: 'Ananya Verma', rollNumber: '2101920100021', collegeId: 'GLB21CS0104', branch: 'Computer Science & Engineering', semester: 'Semester VI', section: 'CSE-A' },
    ];
  },

  /**
   * Retrieves profile of currently authenticated student, faculty, or administrator.
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const user = await apiClient<UserProfile>('/auth/me');
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_STORAGE_KEY, user.role);
      return user;
    } catch (err) {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
      const role = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRole) || 'student';
      if (role === 'faculty') return mockFacultyUser;
      if (role === 'admin') return mockAdminUser;
      return mockCurrentStudent;
    }
  },

  /**
   * Performs real login with roll number, name, collegeId, or email via POST /api/v1/auth/login
   */
  async login(
    credentials: string | { rollNumber?: string; name?: string; collegeId?: string; password?: string; role?: UserRole },
    password?: string,
    role: UserRole = 'student'
  ): Promise<UserProfile> {
    const payload =
      typeof credentials === 'string'
        ? {
            identifier: credentials,
            college_id: credentials,
            password: password || 'password123',
            role,
          }
        : {
            roll_number: credentials.rollNumber,
            name: credentials.name,
            college_id: credentials.collegeId,
            identifier: credentials.rollNumber || credentials.name || credentials.collegeId,
            password: credentials.password || 'password123',
            role: credentials.role || role,
          };

    try {
      const data = await apiClient<{ access_token: string; role: UserRole; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(ROLE_STORAGE_KEY, data.role);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));

      return data.user;
    } catch (err) {
      console.warn('Backend login unavailable, activating local session:', err);
      const studentName = typeof credentials === 'object' && credentials.name ? credentials.name : 'Yuvraj Singh';
      const studentRoll = typeof credentials === 'object' && credentials.rollNumber ? credentials.rollNumber : '2101920100189';
      const demoUser: UserProfile = {
        ...mockCurrentStudent,
        name: studentName,
        rollNumber: studentRoll,
        enrollmentNo: studentRoll,
        collegeId: typeof credentials === 'object' && credentials.collegeId ? credentials.collegeId : 'GLB21CS0892',
        role: (typeof credentials === 'object' && credentials.role) || role || 'student',
      };
      localStorage.setItem(TOKEN_KEY, 'demo-token-student');
      localStorage.setItem(ROLE_STORAGE_KEY, demoUser.role);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      return demoUser;
    }
  },

  /**
   * Switches active role for demo / multi-role preview via POST /api/v1/auth/role-switch-demo
   */
  async switchRole(role: UserRole): Promise<UserProfile> {
    try {
      const data = await apiClient<{ access_token: string; role: UserRole; user: UserProfile }>('/auth/role-switch-demo', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(ROLE_STORAGE_KEY, data.role);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));

      return data.user;
    } catch (err) {
      console.warn('Backend unavailable, activating standalone demo profile for role:', role);
      let demoUser: UserProfile;
      if (role === 'faculty') {
        demoUser = mockFacultyUser;
      } else if (role === 'admin') {
        demoUser = mockAdminUser;
      } else {
        demoUser = mockCurrentStudent;
      }
      localStorage.setItem(TOKEN_KEY, `demo-token-${role}`);
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      return demoUser;
    }
  },

  /**
   * Updates student profile contact and personal details via PUT /api/v1/students/me
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const updated = await apiClient<UserProfile>('/students/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Logout user, notify backend, and clear active tokens.
   */
  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem(ROLE_STORAGE_KEY, 'student');
    }
  }
};
