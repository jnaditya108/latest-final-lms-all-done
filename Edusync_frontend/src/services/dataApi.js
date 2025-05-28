// src/services/dataApi.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5121/api';

// Create axios instance with default config
const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to add auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear local storage and redirect to login
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- Auth Endpoints ---
export const login = (credentials) => {
    return API.post('/auth/login', credentials);
};

export const register = (userData) => {
    return API.post('/auth/register', userData);
};

// --- Course Endpoints ---
export const getCourses = () => {
    return API.get('/courses');
};

export const getCourseById = (courseId) => {
    return API.get(`/courses/${courseId}`);
};

export const createCourse = (formData) => {
    return API.post('/courses', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const updateCourse = (courseId, formData) => {
    return API.put(`/courses/${courseId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const deleteCourse = (courseId) => {
    return API.delete(`/courses/${courseId}`);
};

// --- Enrollment Endpoints ---
export const getEnrolledCourses = (userId) => {
    return API.get(`/enrollments/student/${userId}`);
};

export const enrollInCourse = (enrollmentData) => {
    return API.post('/enrollments/enroll', enrollmentData);
};

// --- Assessment Endpoints ---
export const getAssessments = () => {
    return API.get('/assessments');
};

export const getAssessmentById = (assessmentId) => {
    return API.get(`/assessments/${assessmentId}`);
};

export const getAssessmentQuestions = (assessmentId) => {
    return API.get(`/assessments/${assessmentId}/questions`);
};

export const submitAssessment = (assessmentId, answers) => {
    return API.post(`/assessments/${assessmentId}/submit`, answers);
};

export const getAssessmentResult = (assessmentId, userId) => {
    return API.get(`/assessments/${assessmentId}/result/${userId}`);
};

// --- Question Endpoints ---
export const getQuestions = (assessmentId) => {
    return API.get(`/assessments/${assessmentId}/questions`);
};

export const createQuestion = (assessmentId, questionData) => {
    return API.post(`/assessments/${assessmentId}/questions`, questionData);
};

export const updateQuestion = (assessmentId, questionId, questionData) => {
    return API.put(`/assessments/${assessmentId}/questions/${questionId}`, questionData);
};

export const deleteQuestion = (assessmentId, questionId) => {
    return API.delete(`/assessments/${assessmentId}/questions/${questionId}`);
};

// --- Assessment API Functions ---
export const createAssessment = (assessmentData) => {
    const formattedData = {
        ...assessmentData,
        startDate: new Date(assessmentData.startDate).toISOString(),
        endDate: new Date(assessmentData.endDate).toISOString()
    };
    return API.post('/assessments', formattedData);
};

export const updateAssessment = (assessmentId, assessmentData) => {
    const formattedData = {
        ...assessmentData,
        startDate: new Date(assessmentData.startDate).toISOString(),
        endDate: new Date(assessmentData.endDate).toISOString()
    };
    return API.put(`/assessments/${assessmentId}`, formattedData);
};

export const deleteAssessment = (assessmentId) => {
    return API.delete(`/assessments/${assessmentId}`);
};

// --- Course Content Functions ---
export const getCourseContent = (courseId) => {
    return API.get(`/courses/${courseId}/content`);
};

export const uploadCourseContent = (courseId, contentData) => {
    return API.post(`/courses/${courseId}/content`, contentData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getStudentAssessments = (userId) => {
    return API.get(`/assessments/student/${userId}`);
};

export const toggleCourseCompletion = (enrollmentId) => {
    return API.put(`/enrollments/complete/${enrollmentId}`);
};

export default API;