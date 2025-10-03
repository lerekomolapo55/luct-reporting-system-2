const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const { Op } = require('sequelize');

const User = require('./models/User');
const Course = require('./models/Course');
const Report = require('./models/Report');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const initializeServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Server cannot start.');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('MySQL database connected and synchronized');
  });
};

app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.count();
    const courseCount = await Course.count();
    const reportCount = await Report.count();
    
    res.json({ 
      success: true, 
      message: 'Server is running with MySQL', 
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        courses: courseCount,
        reports: reportCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, role, faculty, stream, programType } = req.body;
    
    console.log('Registration attempt:', {
      username,
      email,
      role,
      faculty,
      stream,
      programType
    });

    // Validate required fields
    if (!username || !password || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username, password, email, role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { email }
        ]
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      password,
      email,
      role: role || 'student',
      faculty: faculty || null,
      stream: stream || null,
      programType: programType || 'degree'
    });
    
    console.log('User registered successfully:', newUser.toSafeObject());
    
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      user: newUser.toSafeObject()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Error during registration: ' + error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role, faculty, stream, programType } = req.body;
    
    console.log(`Login attempt: ${username}, Role: ${role}, Program: ${programType}`);
    
    // Try to find existing user
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      } 
    });
    
    if (!user) {
      // Auto-create user if not found (for demo purposes)
      user = await User.create({
        username,
        password: password || 'password',
        email: `${username}@luct.edu`,
        role: role || 'student',
        faculty: faculty || 'Computing',
        stream: stream || 'IT',
        programType: programType || 'degree'
      });
      console.log(`Auto-created user: ${username}, Program: ${user.programType}`);
    } else {
      // Verify password for existing users
      const isValidPassword = await user.validPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password'
        });
      }
    }
    
    res.json({ 
      success: true,
      message: 'Login successful',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error during login: ' + error.message
    });
  }
});

// COURSE ENDPOINTS

// Get all courses with filtering
app.get('/api/courses', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    console.log('Fetching courses with filters:', { stream, programType });
    
    let whereClause = {};
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const courses = await Course.findAll({ where: whereClause });
    
    console.log(`Found ${courses.length} courses`);
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
});

// Assign a new course
app.post('/api/courses', async (req, res) => {
  try {
    const { 
      name, 
      code, 
      lecturer, 
      stream, 
      faculty, 
      programType, 
      semester, 
      year, 
      schedule 
    } = req.body;

    console.log('Course assignment request:', req.body);

    // Validate required fields
    if (!name || !code || !lecturer || !stream || !faculty || !programType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, code, lecturer, stream, faculty, programType'
      });
    }

    // Check if course already exists with same code and program
    const existingCourse = await Course.findOne({
      where: {
        code,
        programType
      }
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: `Course with code ${code} already exists in ${programType} program`
      });
    }

    // Create new course
    const newCourse = await Course.create({
      name,
      code,
      lecturer,
      stream,
      faculty,
      programType,
      semester: semester || null,
      year: year || null,
      schedule: schedule || null
    });

    console.log('Course assigned successfully:', newCourse.toJSON());

    res.status(201).json({
      success: true,
      message: 'Course assigned successfully',
      course: newCourse
    });
  } catch (error) {
    console.error('Error assigning course:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning course: ' + error.message
    });
  }
});

// Get courses by stream for specific program
app.get('/api/courses/by-stream/:programType', async (req, res) => {
  try {
    const { programType } = req.params;
    const { stream = 'all' } = req.query;
    
    console.log('Fetching courses by stream:', { programType, stream });
    
    let whereClause = { programType };
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    const courses = await Course.findAll({ where: whereClause });
    
    console.log(`Found ${courses.length} courses for ${programType} program, stream: ${stream}`);
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by stream:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
});

// Get courses for specific lecturer
app.get('/api/courses/lecturer/:lecturerName', async (req, res) => {
  try {
    const { lecturerName } = req.params;
    const { programType = 'all' } = req.query;
    
    console.log('Fetching courses for lecturer:', { lecturerName, programType });
    
    let whereClause = { lecturer: lecturerName };
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const courses = await Course.findAll({ where: whereClause });
    
    console.log(`Found ${courses.length} courses for lecturer ${lecturerName}`);
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching lecturer courses:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching courses: ' + error.message
    });
  }
});

// REPORT ENDPOINTS

// Get student reports
app.get('/api/reports/student', async (req, res) => {
  try {
    const { programType = 'all' } = req.query;
    
    let whereClause = { type: 'student' };
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching student reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching student reports: ' + error.message
    });
  }
});

// Submit student report
app.post('/api/reports/student', async (req, res) => {
  try {
    const reportData = req.body;
    console.log('Submitting student report:', reportData);
    
    const newReport = await Report.create({
      ...reportData,
      type: 'student',
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Student report submitted successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error submitting student report:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting student report: ' + error.message
    });
  }
});

// Get lecturer reports
app.get('/api/reports/lecturer', async (req, res) => {
  try {
    const { programType = 'all' } = req.query;
    
    let whereClause = { type: 'lecturer' };
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching lecturer reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching lecturer reports: ' + error.message
    });
  }
});

// Submit lecturer report
app.post('/api/reports/lecturer', async (req, res) => {
  try {
    const reportData = req.body;
    console.log('Submitting lecturer report:', reportData);
    
    const newReport = await Report.create({
      ...reportData,
      type: 'lecturer',
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Lecturer report submitted successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error submitting lecturer report:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting lecturer report: ' + error.message
    });
  }
});

// Get PRL reports - Updated to include all reports for the stream
app.get('/api/reports/prl', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    let whereClause = {};
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching PRL reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PRL reports: ' + error.message
    });
  }
});

// Create PRL report
app.post('/api/reports/prl', async (req, res) => {
  try {
    const reportData = req.body;
    console.log('Creating PRL report:', reportData);
    
    const newReport = await Report.create({
      ...reportData,
      isPRLReport: true,
      status: 'submitted',
      type: 'prl'
    });
    
    res.status(201).json({
      success: true,
      message: 'PRL report created successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error creating PRL report:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating PRL report: ' + error.message
    });
  }
});

// Get PL reports
app.get('/api/reports/pl', async (req, res) => {
  try {
    const { programType = 'all' } = req.query;
    
    let whereClause = {};
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching PL reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PL reports: ' + error.message
    });
  }
});

// Get grouped reports
app.get('/api/reports/grouped', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    let whereClause = {};
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const allReports = await Report.findAll({ where: whereClause });
    
    // Group reports by type
    const groupedReports = {
      lecturer: allReports.filter(report => report.type === 'lecturer' && !report.isPRLReport),
      student: allReports.filter(report => report.type === 'student'),
      prl: allReports.filter(report => report.isPRLReport === true),
      ratings: allReports.filter(report => report.isRating === true)
    };
    
    res.json(groupedReports);
  } catch (error) {
    console.error('Error fetching grouped reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching grouped reports: ' + error.message
    });
  }
});

// Get PRL specific reports
app.get('/api/reports/prl-specific', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    let whereClause = { isPRLReport: true };
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching PRL specific reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PRL specific reports: ' + error.message
    });
  }
});

// Get reports by course codes
app.post('/api/reports/by-courses', async (req, res) => {
  try {
    const { programType = 'all' } = req.query;
    const { courseCodes } = req.body;
    
    let whereClause = {};
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    if (courseCodes && courseCodes.length > 0) {
      whereClause.courseCode = {
        [Op.in]: courseCodes
      };
    }
    
    const reports = await Report.findAll({ where: whereClause });
    
    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error fetching reports by course codes:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching reports by course codes: ' + error.message
    });
  }
});

// Get all reports for PRL monitoring
app.get('/api/reports/all', async (req, res) => {
  try {
    const { programType = 'all', stream = 'all' } = req.query;
    
    let whereClause = {};
    
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    if (stream !== 'all') {
      whereClause.stream = stream;
    }
    
    const reports = await Report.findAll({ where: whereClause });
    
    // Group reports by type
    const groupedReports = {
      student: reports.filter(report => report.type === 'student'),
      lecturer: reports.filter(report => report.type === 'lecturer' && !report.isPRLReport),
      ratings: reports.filter(report => report.isRating === true),
      prl: reports.filter(report => report.isPRLReport === true)
    };
    
    res.json({
      success: true,
      data: groupedReports,
      total: reports.length
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching all reports: ' + error.message
    });
  }
});

// Get detailed reports for PL
app.get('/api/reports/detailed', async (req, res) => {
  try {
    const { programType = 'all' } = req.query;
    
    let whereClause = {};
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const detailedReports = await Report.findAll({ where: whereClause });
    res.json(detailedReports);
  } catch (error) {
    console.error('Error fetching detailed reports:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch detailed reports' 
    });
  }
});

// Add feedback to report
app.post('/api/reports/:reportId/feedback', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;
    
    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    report.feedback = feedback;
    report.feedbackDate = new Date();
    report.status = 'reviewed';
    await report.save();
    
    res.json({
      success: true,
      message: 'Feedback added successfully',
      report
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding feedback: ' + error.message
    });
  }
});

// Add PRL feedback to ratings
app.post('/api/reports/:reportId/rating-feedback', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;
    
    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    report.prlFeedback = feedback;
    report.prlFeedbackDate = new Date();
    report.ratingStatus = 'reviewed';
    report.status = 'reviewed';
    await report.save();
    
    res.json({
      success: true,
      message: 'PRL feedback added successfully',
      report
    });
  } catch (error) {
    console.error('Error adding PRL feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding PRL feedback: ' + error.message
    });
  }
});

// Add PL feedback
app.post('/api/reports/:reportId/pl-feedback', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;
    
    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    report.plFeedback = feedback;
    report.plFeedbackDate = new Date();
    report.status = 'pl_reviewed';
    await report.save();
    
    res.json({
      success: true,
      message: 'PL feedback added successfully',
      report
    });
  } catch (error) {
    console.error('Error adding PL feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding PL feedback: ' + error.message
    });
  }
});

// FIXED: Submit grouped reports to PL
app.post('/api/reports/group/submit', async (req, res) => {
  try {
    const { stream, programType, selectedReports } = req.body;
    
    console.log('Submitting grouped reports to PL:', { stream, programType, selectedReports });
    
    if (!stream || !programType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stream and programType'
      });
    }

    // Extract report IDs from selectedReports object
    const allReportIds = [];
    
    if (selectedReports) {
      // Handle array format
      if (Array.isArray(selectedReports)) {
        allReportIds.push(...selectedReports);
      } 
      // Handle object format with categories
      else if (typeof selectedReports === 'object') {
        if (selectedReports.student && Array.isArray(selectedReports.student)) {
          allReportIds.push(...selectedReports.student);
        }
        if (selectedReports.lecturer && Array.isArray(selectedReports.lecturer)) {
          allReportIds.push(...selectedReports.lecturer);
        }
        if (selectedReports.prl && Array.isArray(selectedReports.prl)) {
          allReportIds.push(...selectedReports.prl);
        }
        if (selectedReports.ratings && Array.isArray(selectedReports.ratings)) {
          allReportIds.push(...selectedReports.ratings);
        }
      }
    }

    console.log('Report IDs to submit:', allReportIds);

    if (allReportIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No reports selected for submission'
      });
    }

    let updatedCount = 0;
    let errors = [];

    // Update each report individually
    for (const reportId of allReportIds) {
      try {
        const report = await Report.findByPk(reportId);
        if (report) {
          // Only update if not already submitted
          if (!report.isSubmittedToPL) {
            report.isSubmittedToPL = true;
            report.submittedToPLDate = new Date();
            report.status = 'submitted_to_pl';
            await report.save();
            updatedCount++;
            console.log(`Successfully submitted report ${reportId}`);
          } else {
            console.log(`Report ${reportId} was already submitted to PL`);
          }
        } else {
          errors.push(`Report with ID ${reportId} not found`);
          console.error(`Report with ID ${reportId} not found`);
        }
      } catch (reportError) {
        errors.push(`Error updating report ${reportId}: ${reportError.message}`);
        console.error(`Error updating report ${reportId}:`, reportError);
      }
    }

    if (errors.length > 0) {
      console.warn('Some reports had errors:', errors);
    }

    res.json({
      success: true,
      message: `Successfully submitted ${updatedCount} reports to Program Leader`,
      submittedCount: updatedCount,
      totalSelected: allReportIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error submitting grouped reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting grouped reports: ' + error.message
    });
  }
});

// Compile reports
app.post('/api/reports/compile', async (req, res) => {
  try {
    const { programType = 'all' } = req.body;
    
    let whereClause = {};
    if (programType !== 'all') {
      whereClause.programType = programType;
    }
    
    const allReports = await Report.findAll({ where: whereClause });
    
    const summary = {
      totalReports: allReports.length,
      studentReports: allReports.filter(r => r.type === 'student').length,
      lecturerReports: allReports.filter(r => r.type === 'lecturer' && !r.isPRLReport).length,
      ratings: allReports.filter(r => r.isRating === true).length,
      prlReports: allReports.filter(r => r.isPRLReport === true).length
    };
    
    res.json({
      success: true,
      message: 'Reports compiled successfully',
      summary,
      compiledAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error compiling reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error compiling reports: ' + error.message
    });
  }
});

// Get reports for PRL assigned courses
app.get('/api/reports/prl/assigned-courses', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    // First get courses for the specified stream and program
    let courseWhereClause = {};
    
    if (stream !== 'all') {
      courseWhereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      courseWhereClause.programType = programType;
    }
    
    const assignedCourses = await Course.findAll({ where: courseWhereClause });
    const courseCodes = assignedCourses.map(course => course.code);
    
    // Then get reports for these courses
    let reportWhereClause = {};
    
    if (courseCodes.length > 0) {
      reportWhereClause.courseCode = {
        [Op.in]: courseCodes
      };
    }
    
    if (programType !== 'all') {
      reportWhereClause.programType = programType;
    }
    
    const reports = await Report.findAll({ where: reportWhereClause });
    
    // Group reports by type
    const groupedReports = {
      student: reports.filter(report => report.type === 'student'),
      lecturer: reports.filter(report => report.type === 'lecturer' && !report.isPRLReport),
      ratings: reports.filter(report => report.isRating === true),
      prl: reports.filter(report => report.isPRLReport === true)
    };
    
    res.json({
      success: true,
      data: groupedReports,
      assignedCourses: assignedCourses.length,
      totalReports: reports.length
    });
  } catch (error) {
    console.error('Error fetching PRL assigned course reports:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PRL assigned course reports: ' + error.message
    });
  }
});

// Get comprehensive PRL dashboard data
app.get('/api/prl/dashboard', async (req, res) => {
  try {
    const { stream = 'all', programType = 'all' } = req.query;
    
    // Get assigned courses
    let courseWhereClause = {};
    
    if (stream !== 'all') {
      courseWhereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      courseWhereClause.programType = programType;
    }
    
    const assignedCourses = await Course.findAll({ where: courseWhereClause });
    const courseCodes = assignedCourses.map(course => course.code);
    
    // Get all reports for the stream and program
    let reportWhereClause = {};
    
    if (stream !== 'all') {
      reportWhereClause.stream = stream;
    }
    
    if (programType !== 'all') {
      reportWhereClause.programType = programType;
    }
    
    const allReports = await Report.findAll({ where: reportWhereClause });
    
    // Get reports specifically for assigned courses
    let assignedCourseReportWhereClause = {};
    
    if (courseCodes.length > 0) {
      assignedCourseReportWhereClause.courseCode = {
        [Op.in]: courseCodes
      };
    }
    
    if (programType !== 'all') {
      assignedCourseReportWhereClause.programType = programType;
    }
    
    const assignedCourseReports = await Report.findAll({ where: assignedCourseReportWhereClause });
    
    // Group all reports
    const groupedAllReports = {
      student: allReports.filter(report => report.type === 'student' && !report.isSubmittedToPL),
      lecturer: allReports.filter(report => report.type === 'lecturer' && !report.isPRLReport && !report.isSubmittedToPL),
      ratings: allReports.filter(report => report.isRating === true && !report.isSubmittedToPL),
      prl: allReports.filter(report => report.isPRLReport === true && !report.isSubmittedToPL)
    };
    
    // Group assigned course reports
    const groupedAssignedCourseReports = {
      student: assignedCourseReports.filter(report => report.type === 'student'),
      lecturer: assignedCourseReports.filter(report => report.type === 'lecturer' && !report.isPRLReport),
      ratings: assignedCourseReports.filter(report => report.isRating === true)
    };
    
    // Get submitted to PL reports
    const submittedToPLReports = allReports.filter(report => report.isSubmittedToPL === true);
    
    res.json({
      success: true,
      data: {
        allReports: groupedAllReports,
        assignedCourseReports: groupedAssignedCourseReports,
        submittedToPLReports: submittedToPLReports,
        statistics: {
          totalAssignedCourses: assignedCourses.length,
          totalAllReports: allReports.length,
          totalAssignedCourseReports: assignedCourseReports.length,
          totalSubmittedToPL: submittedToPLReports.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching PRL dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PRL dashboard data: ' + error.message
    });
  }
});

process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await sequelize.close();
  console.log('Server shutdown complete');
  process.exit(0);
});

initializeServer().catch(console.error);