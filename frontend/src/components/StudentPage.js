import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const StudentPage = ({ user, onLogout }) => {
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [formData, setFormData] = useState({
    faculty: '',
    week: '',
    className: '',
    courseName: '',
    courseCode: '',
    lecturerName: '',
    date: '',
    actualNumberOfStudents: '',
    numberOfStudentsPresent: '',
    venue: '',
    scheduledTime: '',
    actualTime: '',
    studentName: user?.username || '',
    studentNumber: '',
    classRepresentativeName: '',
    classRepresentativeNumber: '',
    coursesTaughtThisWeek: '',
    challengesFaced: '',
    rating: '',
    monitoring: '',
    lecturerRating: '',
    courseTaught: ''
  });

  const [ratingForm, setRatingForm] = useState({
    courseName: '',
    courseCode: '',
    lecturerName: '',
    classRating: '',
    lecturerRating: '',
    comments: ''
  });

  const [loading, setLoading] = useState(false);
  const [showProgramSelection, setShowProgramSelection] = useState(!user?.programType);
  const [programType, setProgramType] = useState(user?.programType || '');

  const handleProgramSelect = (selectedProgramType) => {
    setProgramType(selectedProgramType);
    setShowProgramSelection(false);
    if (user) {
      user.programType = selectedProgramType;
    }
  };

  const programDisplayName = programType === 'degree' ? 'Degree' : 'Diploma';
  const programColor = programType === 'degree' ? '#3498db' : '#66aa88ff';
  const programBgColor = programType === 'degree' ? '#fcfcfcff' : '#fafafaff';

  const fetchReports = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching reports for ${programDisplayName} program...`);
      const data = await apiService.getStudentReports(programType);
      const studentReports = data.filter(report => report.studentName === user?.username);
      setReports(studentReports);
      console.log(`Loaded ${studentReports.length} reports for ${programDisplayName} program`);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  }, [programType, user?.username, programDisplayName]);

  const fetchCourses = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching courses for ${programDisplayName} program...`);
      const data = await apiService.getCourses(null, programType);
      setCourses(data || []);
      console.log(`Loaded ${data.length} courses for ${programDisplayName} program`);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  }, [programType, programDisplayName]);

  useEffect(() => {
    if (!programType) return;
    
    fetchReports();
    fetchCourses();
  }, [programType, fetchCourses, fetchReports]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (e) => {
    setRatingForm({
      ...ratingForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Submitting report:', formData);
      
      const result = await apiService.submitStudentReport({
        ...formData,
        studentName: user?.username,
        status: 'pending',
        stream: '',
        programType: programType
      });
      
      console.log('Submission result:', result);
      alert(`Report submitted successfully to ${programDisplayName} program!`);
      
      setFormData({
        faculty: '',
        week: '',
        className: '',
        courseName: '',
        courseCode: '',
        lecturerName: '',
        date: '',
        actualNumberOfStudents: '',
        numberOfStudentsPresent: '',
        venue: '',
        scheduledTime: '',
        actualTime: '',
        studentName: user?.username || '',
        studentNumber: '',
        classRepresentativeName: '',
        classRepresentativeNumber: '',
        coursesTaughtThisWeek: '',
        challengesFaced: '',
        rating: '',
        monitoring: '',
        lecturerRating: '',
        courseTaught: ''
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Submitting rating:', ratingForm);
      
      const result = await apiService.submitStudentReport({
        ...ratingForm,
        studentName: user?.username,
        type: 'rating',
        status: 'submitted',
        date: new Date().toISOString().split('T')[0],
        stream: 'IT',
        programType: programType
      });
      
      console.log('Rating submission result:', result);
      alert(`Rating submitted successfully to ${programDisplayName} program!`);
      
      setRatingForm({
        courseName: '',
        courseCode: '',
        lecturerName: '',
        classRating: '',
        lecturerRating: '',
        comments: ''
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ratingOptions = [
    { value: '5', label: 'Excellent' },
    { value: '4', label: 'Good' },
    { value: '3', label: 'Satisfying' },
    { value: '2', label: 'Fair' },
    { value: '1', label: 'Poor' }
  ];

  const coursesByLecturer = courses.reduce((acc, course) => {
    const lecturer = course.lecturer || 'Unknown Lecturer';
    if (!acc[lecturer]) {
      acc[lecturer] = [];
    }
    acc[lecturer].push(course);
    return acc;
  }, {});

  const challengeWeeks = [...new Set(reports.filter(report => report.challengesFaced).map(report => report.week))];
  const ratingReports = reports.filter(report => report.type === 'rating');

  // Program Selection Screen
  if (showProgramSelection) {
    return (
      <div className="module">
        <div className="program-selection" style={{
          maxWidth: '600px',
          margin: '50px auto',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2>Welcome to Student Portal</h2>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
            Please select the program you want to access:
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleProgramSelect('degree')}
              style={{
                padding: '20px 30px',
                fontSize: '1.2rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Degree Program
            </button>
            
            <button
              onClick={() => handleProgramSelect('diploma')}
              style={{
                padding: '20px 30px',
                fontSize: '1.2rem',
                backgroundColor: '#66aa88ff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#66aa88ff'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#66aa88ff'}
            >
              Diploma Program
            </button>
          </div>
          
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
            <h4>About Program Access</h4>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              As a student, you can access courses, submit reports, and view your history for your selected program. 
              Each program (Degree and Diploma) has separate data and you cannot access data from the other program.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module">
      <div className="program-banner" style={{
        backgroundColor: programBgColor,
        border: `2px solid ${programColor}`,
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: programColor }}>
              Student Portal - {programDisplayName} Program
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              Welcome, {user?.username} • {programDisplayName} Program
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: programColor,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {programDisplayName} Student
            </div>
            <button
              onClick={() => setShowProgramSelection(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: `2px solid ${programColor}`,
                borderRadius: '20px',
                color: programColor,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = programColor;
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = programColor;
              }}
            >
              Switch Program
            </button>
          </div>
        </div>
      </div>
      
      <div className="navigation-tabs">
        <button 
          className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          Monitoring
        </button>
        <button 
          className={`tab-button ${activeTab === 'rating' ? 'active' : ''}`}
          onClick={() => setActiveTab('rating')}
        >
          Rating
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
        <button 
          className={`tab-button ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges History
        </button>
      </div>

      {activeTab === 'monitoring' && (
        <div className="module-section">
          <h3>Course Information</h3>
          
          <div className="courses-overview">
            <h4>Lecturers and Courses - {programDisplayName} Program</h4>
            {Object.keys(coursesByLecturer).length > 0 ? (
              <div className="lecturers-grid">
                {Object.entries(coursesByLecturer).map(([lecturer, lecturerCourses]) => (
                  <div key={lecturer} className="lecturer-card" style={{ borderTop: `3px solid ${programColor}` }}>
                    <div className="lecturer-header">
                      <h5>{lecturer}</h5>
                      <span className="courses-count" style={{ backgroundColor: programColor }}>
                        {lecturerCourses.length} course(s)
                      </span>
                    </div>
                    <div className="courses-list">
                      {lecturerCourses.map(course => (
                        <div key={course.id} className="course-item">
                          <strong>{course.name}</strong>
                          <div className="course-details">
                            <p><strong>Code:</strong> {course.code}</p>
                            <p><strong>Stream:</strong> {course.stream}</p>
                            <p><strong>Program:</strong> <span style={{ color: programColor, fontWeight: 'bold' }}>{programDisplayName}</span></p>
                            {course.schedule && (
                              <p>
                                <strong>Schedule:</strong> {course.schedule.day} {course.schedule.time}
                                {course.schedule.room && ` - ${course.schedule.room}`}
                              </p>
                            )}
                            {course.semester && course.year && (
                              <p><strong>Semester:</strong> {course.semester} {course.year}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-courses" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No Courses Assigned Yet</h4>
                <p>No courses have been assigned to {programDisplayName} program yet.</p>
                <p>Courses will appear here once assigned by the Program Leader.</p>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  If you believe this is an error, please contact your Program Leader.
                </p>
              </div>
            )}
          </div>

          <div className="quick-stats">
            <h4>Quick Statistics - {programDisplayName} Program</h4>
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Total Courses</h5>
                <span className="stat-number" style={{ color: programColor }}>{courses.length}</span>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Total Lecturers</h5>
                <span className="stat-number" style={{ color: programColor }}>{Object.keys(coursesByLecturer).length}</span>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Your Reports</h5>
                <span className="stat-number" style={{ color: programColor }}>{reports.filter(r => r.type !== 'rating').length}</span>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Your Ratings</h5>
                <span className="stat-number" style={{ color: programColor }}>{ratingReports.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rating' && (
        <div className="module-section">
          <h3>Rate Classes and Lecturers - {programDisplayName} Program</h3>
          <form onSubmit={handleRatingSubmit} className="report-form">
            <div className="form-row">
              <div className="form-group">
                <label>Course Name *</label>
                <input 
                  type="text" 
                  name="courseName" 
                  value={ratingForm.courseName} 
                  onChange={handleRatingChange} 
                  required 
                  placeholder="Enter course name"
                />
              </div>
              <div className="form-group">
                <label>Course Code *</label>
                <input 
                  type="text" 
                  name="courseCode" 
                  value={ratingForm.courseCode} 
                  onChange={handleRatingChange} 
                  required 
                  placeholder="Enter course code"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Lecturer's Name *</label>
                <input 
                  type="text" 
                  name="lecturerName" 
                  value={ratingForm.lecturerName} 
                  onChange={handleRatingChange} 
                  required 
                  placeholder="Enter lecturer name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class Rating *</label>
                <select name="classRating" value={ratingForm.classRating} onChange={handleRatingChange} required>
                  <option value="">Select Class Rating</option>
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Lecturer Rating *</label>
                <select name="lecturerRating" value={ratingForm.lecturerRating} onChange={handleRatingChange} required>
                  <option value="">Select Lecturer Rating</option>
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Comments</label>
                <textarea 
                  name="comments" 
                  value={ratingForm.comments} 
                  onChange={handleRatingChange} 
                  rows="3"
                  placeholder="Any additional comments about the class or lecturer..."
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: programColor }}>
              {loading ? 'Submitting...' : `Submit Rating to ${programDisplayName} Program`}
            </button>
          </form>

          <div className="rating-history">
            <h4>Your Rating History - {programDisplayName} Program</h4>
            <div className="reports-list">
              {ratingReports.length > 0 ? (
                ratingReports.map(report => (
                  <div key={report.id} className="report-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                    <div className="report-header">
                      <h4>{report.courseName} ({report.courseCode})</h4>
                      <span className="rating-type" style={{ backgroundColor: programColor }}>Rating</span>
                    </div>
                    <p><strong>Lecturer:</strong> {report.lecturerName}</p>
                    <p><strong>Class Rating:</strong> {ratingOptions.find(r => r.value === report.classRating)?.label} ({report.classRating}/5)</p>
                    <p><strong>Lecturer Rating:</strong> {ratingOptions.find(r => r.value === report.lecturerRating)?.label} ({report.lecturerRating}/5)</p>
                    {report.comments && (
                      <p><strong>Comments:</strong> {report.comments}</p>
                    )}
                    <p><strong>Date Submitted:</strong> {new Date(report.date).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <h4>No Ratings Submitted Yet</h4>
                  <p>Submit your first rating above to see your rating history here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="module-section">
          <h3>Submit Monitoring Report - {programDisplayName} Program</h3>
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Program Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Program Type</label>
                  <input 
                    type="text" 
                    value={programDisplayName} 
                    readOnly 
                    className="disabled-field"
                    style={{ backgroundColor: programBgColor, color: programColor, fontWeight: 'bold' }}
                  />
                </div>
                <div className="form-group">
                  <label>Faculty *</label>
                  <input type="text" name="faculty" value={formData.faculty} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Week *</label>
                <select name="week" value={formData.week} onChange={handleInputChange} required>
                  <option value="">Select Week</option>
                  {Array.from({length: 16}, (_, i) => i + 1).map(week => (
                    <option key={week} value={`Week ${week}`}>Week {week}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class Name *</label>
                <input type="text" name="className" value={formData.className} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Course Details</h4>
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
                  <label>Lecturer's Name *</label>
                  <input type="text" name="lecturerName" value={formData.lecturerName} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Attendance Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Registered Students *</label>
                  <input type="number" name="actualNumberOfStudents" value={formData.actualNumberOfStudents} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Students Present *</label>
                  <input type="number" name="numberOfStudentsPresent" value={formData.numberOfStudentsPresent} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Venue & Schedule</h4>
              <div className="form-row">
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
                <div className="form-group">
                  <label>Actual Time *</label>
                  <input type="text" name="actualTime" value={formData.actualTime} onChange={handleInputChange} required placeholder="e.g., 9:00 AM - 11:00 AM" />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Lecturer Rating *</label>
                  <select name="lecturerRating" value={formData.lecturerRating} onChange={handleInputChange} required>
                    <option value="">Select Rating</option>
                    {ratingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.value})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Course Taught *</label>
                  <input type="text" name="courseTaught" value={formData.courseTaught} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Overall Rating *</label>
                  <select name="rating" value={formData.rating} onChange={handleInputChange} required>
                    <option value="">Select Rating</option>
                    {ratingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Student Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input 
                    type="text" 
                    name="studentName" 
                    value={user?.username} 
                    readOnly 
                    className="disabled-field"
                  />
                </div>
                <div className="form-group">
                  <label>Student Number *</label>
                  <input type="text" name="studentNumber" value={formData.studentNumber} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class Rep Name *</label>
                  <input type="text" name="classRepresentativeName" value={formData.classRepresentativeName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Class Rep Student Number *</label>
                  <input type="text" name="classRepresentativeNumber" value={formData.classRepresentativeNumber} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Weekly Summary</h4>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Courses Taught This Week *</label>
                  <textarea 
                    name="coursesTaughtThisWeek" 
                    value={formData.coursesTaughtThisWeek} 
                    onChange={handleInputChange} 
                    required 
                    rows="3"
                    placeholder="List all courses taught this week..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Challenges Faced (Visible to PRL only) *</label>
                  <textarea 
                    name="challengesFaced" 
                    value={formData.challengesFaced} 
                    onChange={handleInputChange} 
                    required 
                    rows="3"
                    placeholder="Describe any challenges faced during the week..."
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: programColor }}>
              {loading ? 'Submitting...' : `Submit Report to ${programDisplayName} Program`}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="module-section">
          <h3>Your Report History - {programDisplayName} Program</h3>
          <div className="reports-list">
            {reports.filter(report => report.type !== 'rating').length > 0 ? (
              reports.filter(report => report.type !== 'rating').map(report => (
                <div key={report.id} className="report-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                  <div className="report-header">
                    <h4>{report.courseName} ({report.courseCode})</h4>
                    <span className={`status-badge ${report.status || 'submitted'}`} style={{ 
                      backgroundColor: report.status === 'reviewed' ? '#51cf66' : programColor 
                    }}>
                      {report.status || 'Submitted'}
                    </span>
                  </div>
                  <p><strong>Week:</strong> {report.week} | <strong>Lecturer:</strong> {report.lecturerName}</p>
                  <p><strong>Class:</strong> {report.className} | <strong>Overall Rating:</strong> {ratingOptions.find(r => r.value === report.rating)?.label} ({report.rating}/5)</p>
                  <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
                  <p><strong>Attendance:</strong> {report.numberOfStudentsPresent}/{report.actualNumberOfStudents}</p>
                  <p><strong>Monitoring:</strong> {report.monitoring}</p>
                  <p><strong>Lecturer Rating:</strong> {ratingOptions.find(r => r.value === report.lecturerRating)?.label} ({report.lecturerRating}/5) | <strong>Course Taught:</strong> {report.courseTaught}</p>
                  {report.feedback && (
                    <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                      <p><strong>PRL Feedback:</strong> {report.feedback}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No Reports Submitted Yet</h4>
                <p>Submit your first report above to see your report history here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="module-section">
          <h3>Challenges History - {programDisplayName} Program</h3>
          <div className="challenges-list">
            {challengeWeeks.length > 0 ? (
              challengeWeeks.map(week => {
                const weekReports = reports.filter(report => report.week === week && report.challengesFaced);
                return (
                  <div key={week} className="challenge-week">
                    <h4 style={{ color: programColor }}>{week}</h4>
                    {weekReports.map(report => (
                      <div key={report.id} className="challenge-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                        <div className="challenge-header">
                          <strong>{report.courseName} - {report.lecturerName}</strong>
                          <span className="challenge-date">{new Date(report.date).toLocaleDateString()}</span>
                        </div>
                        <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                        {report.feedback && (
                          <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                            <p className="prl-feedback"><strong>PRL Feedback:</strong> {report.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No Challenges Reported Yet</h4>
                <p>Submit your first report with challenges above to see your challenges history here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;