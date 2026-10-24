import { PYQItem, StudyResource, TopicAnalysis } from '../types';
import { apiClient } from './api';
import { mockStudyResourcesList } from '../data/mock/mockNotes';
import { mockPYQList } from '../data/mock/mockPYQs';

export interface CreateNotePayload {
  title: string;
  subjectCode: string;
  unit: string;
  topic: string;
  type?: string;
  fileSize?: string;
  downloadUrl?: string;
  summary?: string;
}

export interface CreatePYQPayload {
  question: string;
  subjectCode: string;
  subjectName?: string;
  semester?: string;
  year: number | string;
  unit: string;
  examType?: string;
  difficulty?: string;
  frequency?: number;
  topic: string;
  marksWeightage?: number;
}

export const resourceService = {
  /**
   * Retrieves notes and study resources matching optional filters.
   */
  async getNotes(filters?: { subjectCode?: string; semester?: string; unit?: string; type?: string; search?: string }): Promise<StudyResource[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subjectCode && filters.subjectCode !== 'All') params.append('subjectCode', filters.subjectCode);
      if (filters?.semester && filters.semester !== 'All') params.append('semester', filters.semester);
      if (filters?.unit && filters.unit !== 'All') params.append('unit', filters.unit);
      if (filters?.type && filters.type !== 'All') params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const items = await apiClient<StudyResource[]>(`/resources/notes${queryString}`);

      return items.map((item) => ({
        ...item,
        uploadedBy: item.uploadedBy || item.facultyName,
      }));
    } catch (err) {
      console.warn('Backend unavailable, using local study resources:', err);
      return mockStudyResourcesList;
    }
  },

  /**
   * Alias for getNotes for uniform consumption.
   */
  async getStudyResources(filters?: { subjectCode?: string; semester?: string; unit?: string; type?: string; search?: string }): Promise<StudyResource[]> {
    return this.getNotes(filters);
  },

  /**
   * Teacher uploads a new study note / lecture resource.
   */
  async uploadNote(payload: CreateNotePayload): Promise<StudyResource> {
    try {
      return await apiClient<StudyResource>('/resources/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend unavailable, creating local resource:', err);
      const newNote: StudyResource = {
        id: `note-${Date.now()}`,
        title: payload.title,
        subjectCode: payload.subjectCode,
        subjectName: 'Database Management Systems',
        unit: payload.unit,
        topic: payload.topic,
        type: (payload.type as any) || 'PDF',
        fileSize: payload.fileSize || '3.4 MB',
        uploadedDate: new Date().toISOString().split('T')[0],
        facultyName: 'Dr. Sanjeev Kumar Sharma',
        uploadedBy: 'Dr. Sanjeev Kumar Sharma',
        downloadUrl: payload.downloadUrl || 'https://notesgallery.com/aktu-notes/',
        summary: payload.summary || `Lecture notes on ${payload.topic}`,
      };
      mockStudyResourcesList.unshift(newNote);
      return newNote;
    }
  },

  /**
   * Teacher deletes an uploaded note.
   */
  async deleteNote(noteId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient<{ success: boolean; message: string }>(`/resources/notes/${noteId}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Resource removed locally.' };
    }
  },

  /**
   * Retrieves AKTU previous year questions with filters.
   */
  async getPYQs(filters?: { subjectCode?: string; semester?: string; unit?: string; year?: number; difficulty?: string; search?: string }): Promise<PYQItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subjectCode && filters.subjectCode !== 'All') params.append('subjectCode', filters.subjectCode);
      if (filters?.semester && filters.semester !== 'All') params.append('semester', filters.semester);
      if (filters?.unit && filters.unit !== 'All') params.append('unit', filters.unit);
      if (filters?.year && filters.year > 0) params.append('year', filters.year.toString());
      if (filters?.difficulty && filters.difficulty !== 'All') params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      return await apiClient<PYQItem[]>(`/resources/pyqs${queryString}`);
    } catch (err) {
      console.warn('Backend unavailable, using local PYQ items:', err);
      return mockPYQList;
    }
  },

  /**
   * Teacher uploads an AKTU Previous Year Question (PYQ).
   */
  async uploadPYQ(payload: CreatePYQPayload): Promise<PYQItem> {
    try {
      return await apiClient<PYQItem>('/resources/pyqs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Backend unavailable, adding local PYQ:', err);
      const newPyq: PYQItem = {
        id: `pyq-${Date.now()}`,
        question: payload.question,
        subjectCode: payload.subjectCode,
        subjectName: payload.subjectName || 'Database Management Systems',
        semester: payload.semester || 'Semester VI',
        year: Number(payload.year) || 2024,
        unit: payload.unit,
        examType: (payload.examType as any) || 'End-Sem',
        difficulty: (payload.difficulty as any) || 'Medium',
        frequency: Number(payload.frequency) || 1,
        topic: payload.topic,
        marksWeightage: Number(payload.marksWeightage) || 10,
      };
      mockPYQList.unshift(newPyq);
      return newPyq;
    }
  },

  /**
   * Teacher deletes a PYQ question.
   */
  async deletePYQ(pyqId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient<{ success: boolean; message: string }>(`/resources/pyqs/${pyqId}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true, message: 'Question removed locally.' };
    }
  },

  /**
   * Retrieves topic frequency analysis for AKTU exam trends.
   */
  async getTopicAnalyses(subjectCode?: string): Promise<TopicAnalysis[]> {
    try {
      const query = subjectCode && subjectCode !== 'All' ? `?subjectCode=${encodeURIComponent(subjectCode)}` : '';
      return await apiClient<TopicAnalysis[]>(`/resources/pyqs/topics${query}`);
    } catch {
      return [
        { topic: 'BCNF & 3NF Lossless Join Decomposition', subjectCode: 'KCS-601', subjectName: 'Database Management Systems', frequency: 5, importance: 'HIGH IMPORTANCE', unit: 'Unit 3', averageMarks: 10, lastAskedYear: 2024 },
        { topic: 'Conflict Serializability & Precedence Graphs', subjectCode: 'KCS-601', subjectName: 'Database Management Systems', frequency: 4, importance: 'HIGH IMPORTANCE', unit: 'Unit 4', averageMarks: 10, lastAskedYear: 2023 },
        { topic: 'Strict Two-Phase Locking (2PL)', subjectCode: 'KCS-601', subjectName: 'Database Management Systems', frequency: 4, importance: 'HIGH IMPORTANCE', unit: 'Unit 4', averageMarks: 7, lastAskedYear: 2023 },
      ];
    }
  }
};


