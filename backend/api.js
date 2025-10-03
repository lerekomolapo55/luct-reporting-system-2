// server.js (Backend API)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize data storage
let reports = [];
let users = [];
let courses = [];

// Initialize with empty data
const initializeEmptyData = () => {
    return {
        users: [],
        courses: [],
        reports: []
    };
};

// Load or initialize data
try {
    if (fs.existsSync(path.join(dataDir, 'reports.json'))) {
        const reportsData = fs.readFileSync(path.join(dataDir, 'reports.json'), 'utf8');
        reports = JSON.parse(reportsData);
    } else {
        const emptyData = initializeEmptyData();
        reports = emptyData.reports;
        console.log('Initialized empty reports data');
    }

    if (fs.existsSync(path.join(dataDir, 'users.json'))) {
        const usersData = fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8');
        users = JSON.parse(usersData);
    } else {
        const emptyData = initializeEmptyData();
        users = emptyData.users;
        console.log('Initialized empty users data');
    }

    if (fs.existsSync(path.join(dataDir, 'courses.json'))) {
        const coursesData = fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf8');
        courses = JSON.parse(coursesData);
    } else {
        const emptyData = initializeEmptyData();
        courses = emptyData.courses;
        console.log('Initialized empty courses data');
    }
} catch (error) {
    console.log('Error loading data, initializing with empty data...');
    const emptyData = initializeEmptyData();
    reports = emptyData.reports;
    users = emptyData.users;
    courses = emptyData.courses;
}

// Save data to file
const saveData = () => {
    try {
        fs.writeFileSync(path.join(dataDir, 'reports.json'), JSON.stringify(reports, null, 2));
        fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
        fs.writeFileSync(path.join(dataDir, 'courses.json'), JSON.stringify(courses, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running', 
        timestamp: new Date().toISOString(),
        counts: {
            reports: reports.length,
            users: users.length,
            courses: courses.length
        }
    });
});

// Authentication - No verification
app.post('/api/auth/login', (req, res) => {
    const { username, password, role, faculty, stream, programType } = req.body;
    
    console.log(`Login attempt: ${username}, Role: ${role}, Program: ${programType}`);
    
    // Auto-create user if not exists
    let user = users.find(u => u.username === username);
    
    if (!user) {
        user = {
            id: Date.now(),
            username,
            password: 'password',
            email: `${username}@luct.edu`,
            role: role || 'student',
            faculty: faculty || 'Computing',
            stream: stream || 'IT',
            programType: programType || 'degree',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveData();
        console.log(`Auto-created user: ${username}, Program: ${user.programType}`);
    }
    
    res.json({ 
        success: true,
        message: 'Login successful',
        user: { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            faculty: user.faculty,
            stream: user.stream,
            programType: user.programType
        }
    });
});

// Get student reports
app.get('/api/reports/student', (req, res) => {
    const { programType } = req.query;
    
    console.log(`Student Reports request - Program: ${programType}`);
    
    let studentReports = reports.filter(report => 
        report.type === 'student' || report.type === 'rating'
    );
    
    if (programType && programType !== 'all') {
        studentReports = studentReports.filter(report => report.programType === programType);
    }
    
    console.log(`Returning ${studentReports.length} student reports`);
    res.json(studentReports);
});

// Submit student report
app.post('/api/reports/student', (req, res) => {
    try {
        const reportData = req.body;
        
        console.log('Submitting student report:', reportData);
        
        const newReport = {
            id: Date.now(),
            type: reportData.type || 'student',
            ...reportData,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            stream: reportData.stream || 'IT',
            programType: reportData.programType || 'degree'
        };
        
        reports.push(newReport);
        saveData();
        
        console.log('Student report submitted:', newReport.id);
        res.status(201).json({
            success: true,
            message: 'Student report submitted successfully',
            data: newReport
        });
    } catch (error) {
        console.error('Error submitting student report:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit student report' 
        });
    }
});

// Get lecturer reports
app.get('/api/reports/lecturer', (req, res) => {
    const { programType } = req.query;
    
    console.log(`Lecturer Reports request - Program: ${programType}`);
    
    let lecturerReports = reports.filter(report => 
        report.type === 'lecturer' && !report.isPRLReport
    );
    
    if (programType && programType !== 'all') {
        lecturerReports = lecturerReports.filter(report => report.programType === programType);
    }
    
    console.log(`Returning ${lecturerReports.length} lecturer reports`);
    res.json(lecturerReports);
});

// Submit lecturer report
app.post('/api/reports/lecturer', (req, res) => {
    try {
        const reportData = req.body;
        
        console.log('Submitting lecturer report:', reportData);
        
        const newReport = {
            id: Date.now(),
            type: 'lecturer',
            ...reportData,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            stream: reportData.stream || 'IT',
            programType: reportData.programType || 'degree'
        };
        
        reports.push(newReport);
        saveData();
        
        console.log('Lecturer report submitted:', newReport.id);
        res.status(201).json({
            success: true,
            message: 'Lecturer report submitted successfully',
            data: newReport
        });
    } catch (error) {
        console.error('Error submitting lecturer report:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit lecturer report' 
        });
    }
});

// Download lecturer reports
app.get('/api/reports/download/lecturer/:programType?', (req, res) => {
    const { programType } = req.params;
    
    console.log(`Download lecturer reports - Program: ${programType}`);
    
    let lecturerReports = reports.filter(report => 
        report.type === 'lecturer' && !report.isPRLReport
    );
    
    if (programType && programType !== 'all') {
        lecturerReports = lecturerReports.filter(report => report.programType === programType);
    }
    
    console.log(`Downloading ${lecturerReports.length} lecturer reports`);
    res.json({
        success: true,
        data: lecturerReports,
        downloadInfo: {
            type: 'lecturer',
            programType: programType || 'all',
            totalReports: lecturerReports.length,
            generatedAt: new Date().toISOString()
        }
    });
});

// Get all reports for PRL
app.get('/api/reports/prl', (req, res) => {
    const { stream, programType } = req.query;
    
    console.log(`PRL Reports request - Stream: ${stream}, Program: ${programType}`);
    
    let filteredReports = reports;
    
    if (stream && stream !== 'all') {
        filteredReports = filteredReports.filter(report => report.stream === stream);
    }
    
    if (programType && programType !== 'all') {
        filteredReports = filteredReports.filter(report => report.programType === programType);
    }
    
    console.log(`Returning ${filteredReports.length} reports`);
    res.json(filteredReports);
});

// Get grouped reports for PL
app.get('/api/reports/grouped', (req, res) => {
    const { stream, programType } = req.query;
    
    console.log(`Grouped reports request - Stream: ${stream}, Program: ${programType}`);
    
    let filteredReports = reports;
    
    if (stream && stream !== 'all') {
        filteredReports = filteredReports.filter(report => report.stream === stream);
    }
    
    if (programType && programType !== 'all') {
        filteredReports = filteredReports.filter(report => report.programType === programType);
    }
    
    const grouped = {
        lecturer: filteredReports.filter(r => r.type === 'lecturer' && !r.isPRLReport),
        student: filteredReports.filter(r => r.type === 'student' && !r.isRating),
        prl: filteredReports.filter(r => r.isPRLReport === true),
        ratings: filteredReports.filter(r => r.isRating === true)
    };
    
    console.log(`Grouped - Lecturer: ${grouped.lecturer.length}, Student: ${grouped.student.length}, PRL: ${grouped.prl.length}, Ratings: ${grouped.ratings.length}`);
    res.json(grouped);
});

// Get PRL specific reports
app.get('/api/reports/prl-specific', (req, res) => {
    const { stream, programType } = req.query;
    
    console.log(`PRL Specific reports request - Stream: ${stream}, Program: ${programType}`);
    
    let prlReports = reports.filter(report => report.isPRLReport === true);
    
    if (stream && stream !== 'all') {
        prlReports = prlReports.filter(report => report.stream === stream);
    }
    
    if (programType && programType !== 'all') {
        prlReports = prlReports.filter(report => report.programType === programType);
    }
    
    console.log(`Returning ${prlReports.length} PRL specific reports`);
    res.json(prlReports);
});

// Get courses - ENHANCED with proper program type filtering
app.get('/api/courses', (req, res) => {
    const { stream, programType } = req.query;
    
    console.log(`Courses request - Stream: ${stream}, Program: ${programType}`);
    
    let filteredCourses = courses;
    
    if (stream && stream !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.stream === stream);
    }
    
    if (programType && programType !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.programType === programType);
    }
    
    console.log(`Returning ${filteredCourses.length} courses for ${programType} program`);
    res.json(filteredCourses);
});

// Add feedback
app.post('/api/reports/:id/feedback', (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    
    console.log(`Adding feedback to report: ${id}`);
    
    const reportIndex = reports.findIndex(report => report.id === parseInt(id));
    
    if (reportIndex === -1) {
        return res.status(404).json({ 
            success: false,
            error: 'Report not found' 
        });
    }
    
    reports[reportIndex].feedback = feedback;
    reports[reportIndex].feedbackDate = new Date().toISOString();
    reports[reportIndex].status = 'reviewed';
    saveData();
    
    console.log('Feedback added successfully');
    res.json({
        success: true,
        message: 'Feedback added successfully',
        data: reports[reportIndex]
    });
});

// Add rating feedback
app.post('/api/reports/:id/rating-feedback', (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    
    console.log(`Adding rating feedback: ${id}`);
    
    const reportIndex = reports.findIndex(report => report.id === parseInt(id));
    
    if (reportIndex === -1) {
        return res.status(404).json({ 
            success: false,
            error: 'Rating not found' 
        });
    }
    
    reports[reportIndex].prlFeedback = feedback;
    reports[reportIndex].prlFeedbackDate = new Date().toISOString();
    reports[reportIndex].ratingStatus = 'reviewed';
    reports[reportIndex].status = 'reviewed';
    saveData();
    
    console.log('Rating feedback added successfully');
    res.json({
        success: true,
        message: 'Rating feedback submitted successfully',
        data: reports[reportIndex]
    });
});

// Add PL feedback to PRL reports
app.post('/api/reports/:id/pl-feedback', (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    
    console.log(`Adding PL feedback to PRL report: ${id}`);
    
    const reportIndex = reports.findIndex(report => report.id === parseInt(id));
    
    if (reportIndex === -1) {
        return res.status(404).json({ 
            success: false,
            error: 'Report not found' 
        });
    }
    
    reports[reportIndex].plFeedback = feedback;
    reports[reportIndex].plFeedbackDate = new Date().toISOString();
    reports[reportIndex].status = 'pl_reviewed';
    saveData();
    
    console.log('PL feedback added successfully');
    res.json({
        success: true,
        message: 'PL feedback submitted successfully',
        data: reports[reportIndex]
    });
});

// Submit grouped reports to PL
app.post('/api/reports/group/submit', (req, res) => {
    try {
        const { stream, programType } = req.body;
        
        console.log(`Submitting grouped reports to PL - Stream: ${stream}, Program: ${programType}`);
        
        const prlReportsToSubmit = reports.filter(report => 
            report.isPRLReport === true && 
            report.stream === stream && 
            report.programType === programType &&
            !report.isSubmittedToPL
        );
        
        prlReportsToSubmit.forEach(report => {
            report.isSubmittedToPL = true;
            report.submittedToPLDate = new Date().toISOString();
            report.status = 'submitted_to_pl';
        });
        
        saveData();
        
        console.log(`Submitted ${prlReportsToSubmit.length} PRL reports to PL`);
        res.json({
            success: true,
            message: `Successfully submitted ${prlReportsToSubmit.length} PRL reports to PL`,
            count: prlReportsToSubmit.length
        });
        
    } catch (error) {
        console.error('Error submitting grouped reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit grouped reports'
        });
    }
});

// Get PL reports (all reports submitted to PL)
app.get('/api/reports/pl', (req, res) => {
    const { programType } = req.query;
    
    console.log(`PL Reports request - Program: ${programType}`);
    
    let filteredReports = reports.filter(report => 
        report.isPRLReport === true && 
        report.isSubmittedToPL === true
    );
    
    if (programType && programType !== 'all') {
        filteredReports = filteredReports.filter(report => report.programType === programType);
    }
    
    console.log(`Returning ${filteredReports.length} PL reports`);
    res.json(filteredReports);
});

// Compile reports for PL (all reports including grouped and PRL specific)
app.post('/api/reports/compile', (req, res) => {
    try {
        const { programType } = req.body;
        
        console.log(`Compiling ALL reports for PL - Program: ${programType}`);
        
        // Get all reports for the program type
        const allReports = reports.filter(report => 
            report.programType === programType
        );
        
        // Group by type for summary
        const compiledReports = {
            student: allReports.filter(r => r.type === 'student' && !r.isRating),
            lecturer: allReports.filter(r => r.type === 'lecturer' && !r.isPRLReport),
            ratings: allReports.filter(r => r.isRating === true),
            prl: allReports.filter(r => r.isPRLReport === true)
        };
        
        const totalReports = allReports.length;
        
        console.log(`Compiled ${totalReports} reports for PL`);
        res.json({
            success: true,
            message: `Successfully compiled ${totalReports} reports`,
            data: compiledReports,
            summary: {
                totalReports: totalReports,
                studentReports: compiledReports.student.length,
                lecturerReports: compiledReports.lecturer.length,
                ratings: compiledReports.ratings.length,
                prlReports: compiledReports.prl.length,
                byStream: allReports.reduce((acc, report) => {
                    const stream = report.stream || 'IT';
                    acc[stream] = (acc[stream] || 0) + 1;
                    return acc;
                }, {}),
                byStatus: allReports.reduce((acc, report) => {
                    const status = report.status || 'submitted';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {})
            }
        });
        
    } catch (error) {
        console.error('Error compiling reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compile reports'
        });
    }
});

// Get detailed reports for PL
app.get('/api/reports/detailed', (req, res) => {
    const { programType } = req.query;
    
    console.log(`Detailed reports request - Program: ${programType}`);
    
    let filteredReports = reports.filter(report => 
        report.programType === programType
    );
    
    console.log(`Returning ${filteredReports.length} detailed reports`);
    res.json(filteredReports);
});

// Download all reports for PL
app.get('/api/reports/download/:type/:param1?/:param2?', (req, res) => {
    const { type, param1, param2 } = req.params;
    
    console.log(`Download request - Type: ${type}, Param1: ${param1}, Param2: ${param2}`);
    
    let filteredReports = reports;
    
    if (type === 'pl') {
        // PL download - filter by program type for ALL reports
        const programType = param1 || 'degree';
        filteredReports = reports.filter(report => 
            report.programType === programType
        );
    } else if (type === 'prl') {
        // PRL download - filter by stream and program type
        const stream = param1 || 'IT';
        const programType = param2 || 'all';
        
        if (stream && stream !== 'all') {
            filteredReports = filteredReports.filter(report => report.stream === stream);
        }
        
        if (programType && programType !== 'all') {
            filteredReports = filteredReports.filter(report => report.programType === programType);
        }
        
        if (type === 'prl') {
            filteredReports = filteredReports.filter(report => report.isPRLReport === true);
        }
    } else if (type === 'lecturer') {
        // Lecturer download - filter by program type
        const programType = param1 || 'degree';
        filteredReports = reports.filter(report => 
            report.type === 'lecturer' && 
            !report.isPRLReport &&
            report.programType === programType
        );
    }
    
    console.log(`Downloading ${filteredReports.length} reports`);
    res.json({
        success: true,
        data: filteredReports,
        downloadInfo: {
            type: type,
            programType: param1 || 'all',
            stream: param1 || 'all',
            totalReports: filteredReports.length,
            generatedAt: new Date().toISOString()
        }
    });
});

// Assign course - ENHANCED with program type validation
app.post('/api/courses', (req, res) => {
    try {
        const courseData = req.body;
        
        console.log('Assigning course:', courseData);
        
        // Validate required fields
        if (!courseData.name || !courseData.code || !courseData.lecturer || !courseData.programType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, code, lecturer, programType'
            });
        }
        
        const newCourse = {
            id: Date.now(),
            name: courseData.name,
            code: courseData.code,
            lecturer: courseData.lecturer,
            stream: courseData.stream || 'IT',
            faculty: courseData.faculty || 'FICT',
            programType: courseData.programType,
            semester: courseData.semester || 'Semester 1',
            year: courseData.year || '2025',
            schedule: courseData.schedule || {
                day: 'Monday',
                time: '08:00 - 10:00',
                room: 'Room 201'
            },
            createdAt: new Date().toISOString()
        };
        
        courses.push(newCourse);
        saveData();
        
        console.log(`Course assigned: ${newCourse.name} (${newCourse.code}) to ${newCourse.programType} program, ${newCourse.stream} stream`);
        res.status(201).json({
            success: true,
            message: `Course assigned successfully to ${newCourse.programType.toUpperCase()} program`,
            data: newCourse
        });
    } catch (error) {
        console.error('Error assigning course:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to assign course' 
        });
    }
});

// Get courses by stream for PRL view
app.get('/api/courses/by-stream/:programType', (req, res) => {
    const { programType } = req.params;
    const { stream } = req.query;
    
    console.log(`Courses by stream request - Program: ${programType}, Stream: ${stream}`);
    
    let filteredCourses = courses.filter(course => course.programType === programType);
    
    if (stream && stream !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.stream === stream);
    }
    
    // Group by stream
    const coursesByStream = filteredCourses.reduce((acc, course) => {
        const stream = course.stream || 'IT';
        if (!acc[stream]) {
            acc[stream] = [];
        }
        acc[stream].push(course);
        return acc;
    }, {});
    
    console.log(`Returning courses grouped by stream for ${programType} program`);
    res.json(coursesByStream);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Data loaded: ${reports.length} reports, ${users.length} users, ${courses.length} courses`);
    console.log('NO AUTHENTICATION REQUIRED');
    console.log('Users will be auto-created on first login');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Saving data before shutdown...');
    saveData();
    console.log('Server shutdown complete');
    process.exit(0);
});