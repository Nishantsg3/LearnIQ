import api from '../utils/api';

/**
 * API Service for Test Management
 * Centralized API calls for tests
 */

// Normalize backend status (UPPERCASE) to frontend status (lowercase)
const normalizeTest = (test) => ({
  ...test,
  status: test.status ? test.status.toLowerCase() : 'draft'
});

export const getTests = async () => {
  const res = await api.get('/tests');
  // Handle both array responses and nested data property if applicable
  const data = Array.isArray(res.data) ? res.data : res.data.tests || [];
  return data.map(normalizeTest);
};

export const adminGetTests = async () => {
  const res = await api.get('/admin/tests');
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(normalizeTest);
};

export const getArchivedTests = async () => {
  const res = await api.get('/admin/tests/archived');
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(normalizeTest);
};

export const createTest = async (data) => {
  // Map frontend lowercase back to backend UPPERCASE for submission
  const payload = {
    ...data,
    status: data.status ? data.status.toUpperCase() : 'DRAFT'
  };
  const res = await api.post('/tests', payload);
  return normalizeTest(res.data);
};

export const updateTest = async (id, data) => {
  const payload = {
    ...data,
    status: data.status ? data.status.toUpperCase() : 'DRAFT'
  };
  const res = await api.put(`/tests/${id}`, payload);
  return normalizeTest(res.data);
};

export const deleteTest = async (id) => {
  const res = await api.delete(`/tests/${id}`);
  return res.data;
};

export const toggleTestActive = async (id) => {
  const res = await api.post(`/tests/${id}/toggle-active`);
  return normalizeTest(res.data);
};

export const getTestById = async (id) => {
  const res = await api.get(`/tests/${id}`);
  return normalizeTest(res.data);
};

export const submitTestQuestion = async (testId, answers) => {
  const res = await api.post(`/questions/test/${testId}/submit`, { answers });
  return res.data;
};
