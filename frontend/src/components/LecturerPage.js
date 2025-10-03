import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const LecturerPage = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [formData, setFormData] = useState({
    facultyName: '',
    className: '',
    weekOfReporting: '',
    dateOfLecture: '',
    courseName: '',
    courseCode: '',
    lecturerName: user?.username || '',
    actualStudentsPresent: '',
    totalRegisteredStudents: '',
    venue: '',
    scheduledTime: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
    rating: '',
    studentRating: '',
    challengesFaced: ''
  });

  const fetchReports = useCallback(async () => {
    try {
      const data = await apiService.getLecturerReports();
      // Filter reports for current lecturer
      const lecturerReports = data.filter(report => report.lecturerName === user?.username);
      setReports(lecturerReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, [user?.username]);

  const fetchAssignedCourses = useCallback(async () => {
    try {
      const data = await apiService.getCourses();
      console.log('All courses from API:', data);
      
      // Filter courses assigned to this lecturer
      const lecturerCourses = data.filter(course => 
        course.lecturer === user?.username
      );
      console.log('Courses assigned to lecturer:', lecturerCourses);
      setAssignedCourses(lecturerCourses || []);
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      setAssignedCourses([]);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchReports();
    fetchAssignedCourses();
  }, [fetchReports, fetchAssignedCourses]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting lecturer report:', formData);
      
      const result = await apiService.submitLecturerReport({
        ...formData,
        lecturerName: user?.username,
        status: 'pending',
        type: 'lecturer',
        stream: user?.stream || 'IT',
        programType: formData.programType || 'degree'
      });
      
      console.log('Submission result:', result);
      alert('Report submitted successfully!');
      
      // Reset form
      setFormData({
        facultyName: '',
        className: '',
        weekOfReporting: '',
        dateOfLecture: '',
        courseName: '',
        courseCode: '',
        lecturerName: user?.username || '',
        actualStudentsPresent: '',
        totalRegisteredStudents: '',
        venue: '',
        scheduledTime: '',
        topicTaught: '',
        learningOutcomes: '',
        recommendations: '',
        rating: '',
        studentRating: '',
        challengesFaced: ''
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    }
  };

  const handleDownloadReports = async () => {
    try {
      // Create Excel data
      const excelData = [
        // Headers
        ['Lecturer Reports Summary', '', '', '', '', '', ''],
        ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', ''],
        ['Lecturer:', user?.username, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        // Column headers
        ['Course Name', 'Course Code', 'Week', 'Date', 'Students Present', 'Total Students', 'Rating', 'Student Rating', 'Topic Taught', 'Venue', 'Status']
      ];

      // Add report data
      reports.forEach(report => {
        excelData.push([
          report.courseName || '',
          report.courseCode || '',
          report.weekOfReporting || '',
          report.dateOfLecture || '',
          report.actualStudentsPresent || '',
          report.totalRegisteredStudents || '',
          report.rating || '',
          report.studentRating || '',
          report.topicTaught || '',
          report.venue || '',
          report.status || ''
        ]);
      });

      // Add summary
      excelData.push(['', '', '', '', '', '', '', '', '', '', '']);
      excelData.push(['Summary', '', '', '', '', '', '', '', '', '', '']);
      excelData.push(['Total Reports:', reports.length, '', '', '', '', '', '', '', '', '']);
      excelData.push(['Average Rating:', (reports.reduce((sum, report) => sum + (parseInt(report.rating) || 0), 0) / reports.length || 0).toFixed(1), '', '', '', '', '', '', '', '', '']);
      excelData.push(['Average Student Rating:', (reports.reduce((sum, report) => sum + (parseInt(report.studentRating) || 0), 0) / reports.length || 0).toFixed(1), '', '', '', '', '', '', '', '', '']);

      // Convert to CSV and download
      const csvContent = excelData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lecturer-reports-${user?.username}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Reports downloaded successfully as Excel file!');
    } catch (error) {
      console.error('Error downloading reports:', error);
      alert('Error downloading reports. Please try again.');
    }
  };

  // Group assigned courses by program type and stream
  const groupedCourses = assignedCourses.reduce((acc, course) => {
    const key = `${course.programType}-${course.stream}`;
    if (!acc[key]) {
      acc[key] = {
        programType: course.programType,
        stream: course.stream,
        courses: []
      };
    }
    acc[key].courses.push(course);
    return acc;
  }, {});

  return (
    <div className="module">
      <h2>Lecturer Portal</h2>
      <p className="user-welcome">Welcome, {user?.username}</p>
      
      <div className="navigation-tabs">
        <button 
          className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          Monitoring
        </button>
        <button 
          className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Submit Report
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Report History
        </button>
        <button className="tab-button" onClick={handleDownloadReports}>
          Download Reports (Excel)
        </button>
      </div>

      {activeTab === 'monitoring' && (
        <div className="module-section">
          <h3>Assigned Courses Monitoring</h3>
          
          {Object.values(groupedCourses).length > 0 ? (
            Object.values(groupedCourses).map((group, index) => (
              <div key={index} className="course-group">
                <h4>{group.programType.toUpperCase()} Program - {group.stream} Stream</h4>
                <div className="courses-grid">
                  {group.courses.map(course => (
                    <div key={course.id} className="course-card">
                      <div className="course-header">
                        <h5>{course.name}</h5>
                        <span className="course-code">{course.code}</span>
                      </div>
                      <div className="course-details">
                        <p><strong>Faculty:</strong> {course.faculty}</p>
                        <p><strong>Semester:</strong> {course.semester}</p>
                        <p><strong>Year:</strong> {course.year}</p>
                        {course.schedule && (
                          <p><strong>Schedule:</strong> {course.schedule.day} {course.schedule.time}</p>
                        )}
                        {course.schedule?.room && (
                          <p><strong>Room:</strong> {course.schedule.room}</p>
                        )}
                      </div>
                      <div className="course-stats">
                        <div className="stat">
                          <span className="stat-label">Total Reports</span>
                          <span className="stat-value">
                            {reports.filter(report => report.courseCode === course.code).length}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Avg Rating</span>
                          <span className="stat-value">
                            {reports.filter(report => report.courseCode === course.code).length > 0 
                              ? (reports
                                  .filter(report => report.courseCode === course.code)
                                  .reduce((sum, report) => sum + (parseInt(report.rating) || 0), 0) / 
                                  reports.filter(report => report.courseCode === course.code).length
                                ).toFixed(1)
                              : '0.0'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-courses">
              <p>No courses assigned to you yet.</p>
              <p>Please contact your Program Leader for course assignments.</p>
            </div>
          )}

          <div className="monitoring-summary">
            <h4>Teaching Summary</h4>
            <div className="summary-cards">
              <div className="summary-card">
                <h5>Total Assigned Courses</h5>
                <p className="summary-number">{assignedCourses.length}</p>
              </div>
              <div className="summary-card">
                <h5>Programs</h5>
                <p className="summary-number">
                  {[...new Set(assignedCourses.map(course => course.programType))].length}
                </p>
              </div>
              <div className="summary-card">
                <h5>Streams</h5>
                <p className="summary-number">
                  {[...new Set(assignedCourses.map(course => course.stream))].length}
                </p>
              </div>
              <div className="summary-card">
                <h5>Total Reports</h5>
                <p className="summary-number">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="module-section">
          <h3>Submit Lecturer Report</h3>
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-row">
              <div className="form-group">
                <label>Faculty Name *</label>
                <input type="text" name="facultyName" value={formData.facultyName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Class Name *</label>
                <input type="text" name="className" value={formData.className} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Week of Reporting *</label>
                <select name="weekOfReporting" value={formData.weekOfReporting} onChange={handleInputChange} required>
                  <option value="">Select Week</option>
                  {Array.from({length: 16}, (_, i) => i + 1).map(week => (
                    <option key={week} value={`Week ${week}`}>Week {week}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Lecture *</label>
                <input type="date" name="dateOfLecture" value={formData.dateOfLecture} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Course Name *</label>
                <input type="text" name="courseName" value={formData.courseName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Course Code *</label>
                <input type="text" name="courseCode" value={formData.courseCode} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Program Type *</label>
                <select name="programType" value={formData.programType} onChange={handleInputChange} required>
                  <option value="">Select Program</option>
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stream *</label>
                <select name="stream" value={formData.stream} onChange={handleInputChange} required>
                  <option value="">Select Stream</option>
                  <option value="IT">Information Technology</option>
                  <option value="IS">Information Systems</option>
                  <option value="CS">Computer Science</option>
                  <option value="SE">Software Engineering</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lecturer's Name *</label>
                <input 
                  type="text" 
                  name="lecturerName" 
                  value={user?.username} 
                  readOnly 
                  className="disabled-field"
                />
              </div>
              <div className="form-group">
                <label>Students Present *</label>
                <input type="number" name="actualStudentsPresent" value={formData.actualStudentsPresent} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Students *</label>
                <input type="number" name="totalRegisteredStudents" value={formData.totalRegisteredStudents} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Venue *</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Time *</label>
                <input type="text" name="scheduledTime" value={formData.scheduledTime} onChange={handleInputChange} required placeholder="e.g., 9:00 AM - 11:00 AM" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Topic Taught *</label>
                <textarea name="topicTaught" value={formData.topicTaught} onChange={handleInputChange} required rows="3" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Learning Outcomes *</label>
                <textarea name="learningOutcomes" value={formData.learningOutcomes} onChange={handleInputChange} required rows="3" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Recommendations *</label>
                <textarea name="recommendations" value={formData.recommendations} onChange={handleInputChange} required rows="3" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Challenges Faced *</label>
                <textarea 
                  name="challengesFaced" 
                  value={formData.challengesFaced} 
                  onChange={handleInputChange} 
                  required 
                  rows="3"
                  placeholder="Describe any challenges faced during the lecture..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Overall Rating (1-10) *</label>
                <input 
                  type="number" 
                  name="rating" 
                  min="1" 
                  max="10" 
                  value={formData.rating} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Student Rating (1-10) *</label>
                <input 
                  type="number" 
                  name="studentRating" 
                  min="1" 
                  max="10" 
                  value={formData.studentRating} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Submit Report</button>
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('monitoring')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="module-section">
          <h3>Report History</h3>
          <div className="reports-list">
            {reports.length > 0 ? (
              reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <h4>{report.courseName} ({report.courseCode})</h4>
                    <span className={`status-badge ${report.status}`}>{report.status}</span>
                  </div>
                  <p><strong>Program:</strong> {report.programType?.toUpperCase() || 'Degree'} | <strong>Stream:</strong> {report.stream}</p>
                  <p><strong>Class:</strong> {report.className} | <strong>Week:</strong> {report.weekOfReporting}</p>
                  <p><strong>Date:</strong> {new Date(report.dateOfLecture).toLocaleDateString()}</p>
                  <p><strong>Attendance:</strong> {report.actualStudentsPresent}/{report.totalRegisteredStudents}</p>
                  <p><strong>Overall Rating:</strong> {report.rating}/10 | <strong>Student Rating:</strong> {report.studentRating}/10</p>
                  {report.challengesFaced && (
                    <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                  )}
                  {report.feedback && (
                    <div className="feedback-section">
                      <h5>PRL Feedback:</h5>
                      <p>{report.feedback}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No reports submitted yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerPage;