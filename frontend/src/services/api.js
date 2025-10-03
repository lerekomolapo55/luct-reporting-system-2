const API_BASE_URL = 'https://luct-reporting-system-2-4.onrender.com/api';

const apiCall = async (endpoint, options = {}) => {
    try {
        console.log(`API Call: ${endpoint}`, options.body ? JSON.parse(options.body) : '');
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        // First try to parse the response as JSON
        let data;
        const text = await response.text();
        
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                // If it's HTML, it's probably a 404 error
                if (text.includes('<!DOCTYPE html>')) {
                    throw new Error(`Server error: Endpoint ${endpoint} not found. Please check if the backend server is running on port 5000.`);
                }
                throw new Error(`Server returned invalid response: ${text.substring(0, 100)}...`);
            }
        } else {
            throw new Error('Server returned empty response');
        }

        if (!response.ok) {
            throw new Error(data?.error || data?.message || `Server error: ${response.status} ${response.statusText}`);
        }

        console.log(`API Success: ${endpoint}`, data);
        return data;
        
    } catch (error) {
        console.error(`API Error: ${endpoint}`, error.message);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
        }
        
        throw error;
    }
};

// Health check
export const healthCheck = () => apiCall('/health');

// Authentication
export const login = async (credentials) => {
    return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
};

export const register = async (userData) => {
    return apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

// Student Reports
export const getStudentReports = async (programType = 'degree') => {
    return apiCall(`/reports/student?programType=${programType}`);
};

export const submitStudentReport = async (reportData) => {
    return apiCall('/reports/student', {
        method: 'POST',
        body: JSON.stringify(reportData),
    });
};

export const downloadStudentReports = async (programType = 'degree') => {
    return apiCall(`/reports/download/student/${programType}`);
};

// Lecturer Reports
export const getLecturerReports = async (programType = 'degree') => {
    return apiCall(`/reports/lecturer?programType=${programType}`);
};

export const submitLecturerReport = async (reportData) => {
    return apiCall('/reports/lecturer', {
        method: 'POST',
        body: JSON.stringify(reportData),
    });
};

export const downloadLecturerReports = async (programType = 'degree') => {
    return apiCall(`/reports/download/lecturer/${programType}`);
};

// PRL Reports
export const getPRLReports = async (stream = 'IT', programType = 'degree') => {
    return apiCall(`/reports/prl?stream=${stream}&programType=${programType}`);
};

export const createPRLReport = async (reportData) => {
    return apiCall('/reports/prl', {
        method: 'POST',
        body: JSON.stringify(reportData),
    });
};

export const downloadPRLReports = async (stream = 'IT', programType = 'degree') => {
    return apiCall(`/reports/download/prl/${stream}/${programType}`);
};

// PL Reports
export const getPLReports = async (programType = 'degree') => {
    return apiCall(`/reports/pl?programType=${programType}`);
};

export const getGroupedReports = async (stream = null, programType = 'degree') => {
    let url = `/reports/grouped?programType=${programType}`;
    if (stream) {
        url += `&stream=${stream}`;
    }
    return apiCall(url);
};

export const getPRLSpecificReports = async (stream = null, programType = 'degree') => {
    let url = `/reports/prl-specific?programType=${programType}`;
    if (stream) {
        url += `&stream=${stream}`;
    }
    return apiCall(url);
};

export const getDetailedReports = async (programType = 'degree') => {
    return apiCall(`/reports/detailed?programType=${programType}`);
};

// Courses
export const getCourses = async (stream = null, programType = 'degree') => {
    let url = `/courses?programType=${programType}`;
    if (stream) {
        url += `&stream=${stream}`;
    }
    return apiCall(url);
};

export const assignCourse = async (courseData) => {
    return apiCall('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
    });
};

export const getCoursesByStream = async (programType, stream = 'all') => {
    return apiCall(`/courses/by-stream/${programType}?stream=${stream}`);
};

// Feedback
export const addFeedback = async (reportId, feedback, isRating = false) => {
    const endpoint = isRating ? `/reports/${reportId}/rating-feedback` : `/reports/${reportId}/feedback`;
    return apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
    });
};

export const addPRLFeedback = async (reportId, feedback) => {
    return apiCall(`/reports/${reportId}/rating-feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
    });
};

export const addPLFeedback = async (reportId, feedback) => {
    return apiCall(`/reports/${reportId}/pl-feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
    });
};

// FIXED: Grouped Reports Submission
export const submitGroupedReports = async (stream, programType, selectedReports = null) => {
    console.log('Submitting grouped reports:', { stream, programType, selectedReports });
    
    // Ensure we're sending the correct data structure
    const submissionData = {
        stream: stream,
        programType: programType,
        selectedReports: selectedReports || {
            student: [],
            lecturer: [],
            prl: [],
            ratings: []
        }
    };
    
    return apiCall('/reports/group/submit', {
        method: 'POST',
        body: JSON.stringify(submissionData),
    });
};

// Compilation
export const compileReports = async (programType = 'degree') => {
    return apiCall('/reports/compile', {
        method: 'POST',
        body: JSON.stringify({ programType }),
    });
};

// Get reports by course codes
export const getReportsByCourseCodes = async (courseCodes, programType = 'degree') => {
    return apiCall(`/reports/by-courses?programType=${programType}`, {
        method: 'POST',
        body: JSON.stringify({ courseCodes }),
    });
};

// Create named export object for default export
const apiService = {
    healthCheck,
    login,
    register,
    getStudentReports,
    submitStudentReport,
    downloadStudentReports,
    getLecturerReports,
    submitLecturerReport,
    downloadLecturerReports,
    getPRLReports,
    createPRLReport,
    downloadPRLReports,
    getPLReports,
    getGroupedReports,
    getPRLSpecificReports,
    getDetailedReports,
    getCourses,
    assignCourse,
    getCoursesByStream,
    addFeedback,
    addPRLFeedback,
    addPLFeedback,
    submitGroupedReports,
    compileReports,
    getReportsByCourseCodes
};

export default apiService;