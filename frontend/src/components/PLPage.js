import React, { useState, useEffect, useCallback } from 'react';
import { getPLReports, assignCourse, compileReports, addPRLFeedback, getCourses, getGroupedReports, getPRLSpecificReports } from '../services/api';

const PLPage = ({ user, onLogout }) => {
  const [groupedReports, setGroupedReports] = useState({ lecturer: [], student: [], prl: [], ratings: [] });
  const [prlSpecificReports, setPrlSpecificReports] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [programType, setProgramType] = useState(user?.programType || '');
  const [selectedStream, setSelectedStream] = useState('all');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    lecturer: '',
    stream: '',
    faculty: '',
    programType: '',
    semester: '',
    year: '',
    schedule: {
      day: '',
      time: '',
      room: ''
    }
  });
  const [feedbackData, setFeedbackData] = useState({});
  const [loading, setLoading] = useState(false);
  const [compilationResult, setCompilationResult] = useState(null);
  const [showProgramSelection, setShowProgramSelection] = useState(!user?.programType);

  const faculties = ['FICT', 'FABE', 'FCMB', 'FDI', 'FBMG'];
  const streams = ['IT', 'IS', 'CS', 'SE'];
  const semesters = ['Semester 1', 'Semester 2'];
  const years = ['2025', '2024', '2023'];
  const timeSlots = ['08:00 - 10:00', '10:00 - 12:00','12:00 - 14:00', '14:00 - 16:00'];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const rooms = ['Room 1', 'Lab 2', 'Lab 1', 'Room 2', 'Room 3', 'Hall 3'];

  const handleProgramSelect = (selectedProgramType) => {
    setProgramType(selectedProgramType);
    setShowProgramSelection(false);
    if (user) {
      user.programType = selectedProgramType;
    }
  };

  const filterByProgramType = useCallback((data) => {
    if (!data || !programType) return [];
    
    if (Array.isArray(data)) {
      const filtered = data.filter(item => {
        return item.programType === programType;
      });
      console.log(`Filtered ${data.length} items to ${filtered.length} for ${programType} program`);
      return filtered;
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      const filtered = {};
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          filtered[key] = data[key].filter(item => item.programType === programType);
        } else {
          filtered[key] = data[key];
        }
      });
      return filtered;
    }
    
    return data;
  }, [programType]);

  const fetchReports = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching reports for ${programType} program...`);
      const data = await getPLReports(programType);
      const filteredData = filterByProgramType(data);
      console.log(`Set ${filteredData.length} reports for ${programType}`);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, [programType, filterByProgramType]);

  const fetchGroupedReports = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching grouped reports for ${programType} program...`);
      const data = await getGroupedReports(selectedStream, programType);
      const filteredData = filterByProgramType(data);
      setGroupedReports(filteredData || { lecturer: [], student: [], prl: [], ratings: [] });
      console.log(`Set grouped reports for ${programType}:`, filteredData);
    } catch (error) {
      console.error('Error fetching grouped reports:', error);
      setGroupedReports({ lecturer: [], student: [], prl: [], ratings: [] });
    }
  }, [programType, selectedStream, filterByProgramType]);

  const fetchPrlSpecificReports = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching PRL specific reports for ${programType} program, stream: ${selectedStream}...`);
      const data = await getPRLSpecificReports(selectedStream, programType);
      const filteredData = filterByProgramType(data);
      console.log(`Fetched PRL specific reports for ${programType}:`, filteredData);
      setPrlSpecificReports(filteredData);
    } catch (error) {
      console.error('Error fetching PRL specific reports:', error);
      setPrlSpecificReports([]);
    }
  }, [programType, selectedStream, filterByProgramType]);

  const fetchAssignedCourses = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching courses for ${programType} program...`);
      const data = await getCourses(selectedStream, programType);
      const filteredData = filterByProgramType(data);
      console.log(`Fetched ${filteredData.length} courses for ${programType}:`, filteredData);
      setAssignedCourses(filteredData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setAssignedCourses([]);
    }
  }, [programType, selectedStream, filterByProgramType]);

  useEffect(() => {
    if (!programType) return;
    
    console.log(`PL Page mounted/updated for ${programType} program, User:`, user);
    
    setGroupedReports({ lecturer: [], student: [], prl: [], ratings: [] });
    setPrlSpecificReports([]);
    setAssignedCourses([]);
    
    fetchReports();
    fetchGroupedReports();
    fetchAssignedCourses();
    fetchPrlSpecificReports();
  }, [programType, selectedStream, fetchReports, fetchGroupedReports, fetchAssignedCourses, fetchPrlSpecificReports, user]);

  useEffect(() => {
    if (programType) {
      setCourseForm(prev => ({
        ...prev,
        programType: programType
      }));
    }
  }, [programType]);

  const handleCompileReports = async () => {
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      const result = await compileReports(programType);
      setCompilationResult(result);
      alert(`Reports compiled successfully for ${programType.toUpperCase()} program!\n\nTotal Reports: ${result.summary.totalReports}\nStudent: ${result.summary.studentReports}\nLecturer: ${result.summary.lecturerReports}\nRatings: ${result.summary.ratings}\nPRL: ${result.summary.prlReports}`);
      fetchReports();
      fetchGroupedReports();
      fetchPrlSpecificReports();
    } catch (error) {
      console.error('Error compiling reports:', error);
      alert('Error compiling reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      'Report Type', 'Course Code', 'Course Name', 'Person Name', 'Week', 'Date',
      'Attendance', 'Issues/Challenges', 'Recommendations/Feedback', 'Status', 'Rating', 'Stream', 'Program Type'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    // Add lecturer reports
    data.reports.lecturer?.forEach(report => {
      const row = [
        'Lecturer Report',
        `"${report.courseCode || ''}"`,
        `"${report.courseName || ''}"`,
        `"${report.lecturerName || ''}"`,
        `"${report.weekOfReporting || ''}"`,
        `"${report.dateOfLecture || ''}"`,
        `"${report.actualStudentsPresent || 0}/${report.totalRegisteredStudents || 0}"`,
        `"${report.challengesFaced || ''}"`,
        `"${report.feedback || ''}"`,
        `"${report.status || ''}"`,
        '',
        `"${report.stream || ''}"`,
        `"${report.programType === 'degree' ? 'Degree' : 'Diploma'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Add student reports
    data.reports.student?.forEach(report => {
      const row = [
        'Student Report',
        `"${report.courseCode || ''}"`,
        `"${report.courseName || ''}"`,
        `"${report.studentName || ''}"`,
        `"${report.week || ''}"`,
        `"${report.date || ''}"`,
        `"${report.numberOfStudentsPresent || 0}/${report.actualNumberOfStudents || 0}"`,
        `"${report.challengesFaced || ''}"`,
        `"${report.feedback || ''}"`,
        `"${report.status || ''}"`,
        '',
        `"${report.stream || ''}"`,
        `"${report.programType === 'degree' ? 'Degree' : 'Diploma'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Add PRL reports
    data.reports.prl?.forEach(report => {
      const row = [
        'PRL Report',
        '',
        '',
        `"${report.lecturerName || report.studentName || 'PRL'}"`,
        `"${report.weekOfReporting || ''}"`,
        `"${report.dateOfLecture || ''}"`,
        '',
        `"${report.issues || ''}"`,
        `"${report.recommendations || ''}"`,
        `"${report.status || ''}"`,
        '',
        `"${report.stream || ''}"`,
        `"${report.programType === 'degree' ? 'Degree' : 'Diploma'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Add student ratings
    data.reports.ratings?.forEach(report => {
      const row = [
        'Student Rating',
        `"${report.courseCode || ''}"`,
        `"${report.courseName || ''}"`,
        `"${report.studentName || ''}"`,
        '',
        '',
        '',
        `"${report.comments || ''}"`,
        `"${report.feedback || ''}"`,
        `"${report.ratingStatus || 'submitted'}"`,
        `"Class: ${report.classRating || 0}/5, Lecturer: ${report.lecturerRating || 0}/5"`,
        `"${report.stream || ''}"`,
        `"${report.programType === 'degree' ? 'Degree' : 'Diploma'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcelSummary = async () => {
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      
      const excelData = {
        programType: programType,
        stream: selectedStream,
        summary: {
          totalReports: Object.values(groupedReports).flat().length,
          lecturerReports: groupedReports.lecturer?.length || 0,
          studentReports: groupedReports.student?.length || 0,
          prlReports: groupedReports.prl?.length || 0,
          ratings: groupedReports.ratings?.length || 0
        },
        reports: groupedReports,
        generatedAt: new Date().toISOString(),
        generatedBy: user?.username || 'Program Leader'
      };
      
      const csvContent = convertToCSV(excelData);
      downloadCSV(csvContent, `pl-summary-${programType}-${selectedStream}-${new Date().toISOString().split('T')[0]}.csv`);
      
      alert(`Excel summary downloaded successfully for ${programType.toUpperCase()} program${selectedStream !== 'all' ? ` - ${selectedStream} stream` : ''}!`);
    } catch (error) {
      console.error('Error downloading Excel summary:', error);
      alert('Error downloading Excel summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('schedule.')) {
      const scheduleField = name.split('.')[1];
      setCourseForm({
        ...courseForm,
        schedule: {
          ...courseForm.schedule,
          [scheduleField]: value
        }
      });
    } else {
      setCourseForm({
        ...courseForm,
        [name]: value
      });
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      const courseData = {
        ...courseForm,
        programType: programType
      };
      console.log('Assigning course to program:', programType, courseData);
      await assignCourse(courseData);
      alert(`Course "${courseData.name}" assigned successfully to ${programType.toUpperCase()} program, ${courseData.stream} stream!`);
      setCourseForm({
        name: '',
        code: '',
        lecturer: '',
        stream: '',
        faculty: '',
        programType: programType,
        semester: '',
        year: '',
        schedule: {
          day: '',
          time: '',
          room: ''
        }
      });
      setShowCourseForm(false);
      fetchAssignedCourses();
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Error assigning course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackChange = (reportId, value) => {
    setFeedbackData({
      ...feedbackData,
      [reportId]: value
    });
  };

  const handleSubmitFeedback = async (reportId) => {
    try {
      setLoading(true);
      await addPRLFeedback(reportId, feedbackData[reportId] || '');
      alert('Feedback submitted successfully!');
      setFeedbackData({
        ...feedbackData,
        [reportId]: ''
      });
      fetchReports();
      fetchGroupedReports();
      fetchPrlSpecificReports();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupCoursesByStream = () => {
    const grouped = {};
    
    streams.forEach(stream => {
      grouped[stream] = assignedCourses.filter(course => 
        course.stream === stream && course.programType === programType
      );
    });
    
    return grouped;
  };

  const streamGroupedCourses = groupCoursesByStream();

  const programDisplayName = programType === 'degree' ? 'Degree' : 'Diploma';
  const programColor = programType === 'degree' ? '#3498db' : '#66aa88ff';
  const programBgColor = programType === 'degree' ? '#ffffffff' : '#ffffffff';

  // Filter PRL reports by selected stream
  const filteredPrlReports = selectedStream === 'all' 
    ? prlSpecificReports 
    : prlSpecificReports.filter(report => report.stream === selectedStream);

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
          <h2>Welcome to Program Leader Portal</h2>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
            Please select the program you want to manage:
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
            <h4>About Program Management</h4>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              As a Program Leader, you can manage courses, monitor reports, and provide feedback for your selected program. 
              Each program (Degree and Diploma) has separate data and cannot access each other's information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module">
      <div className="program-header" style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: programBgColor,
        border: `2px solid ${programColor}`,
        borderRadius: '8px',
        position: 'relative'
      }}>
        <div>
          <h2>Program Leader Portal - {programDisplayName} Program</h2>
          <div className="user-welcome">
            <p>Welcome, {user?.username} ({programDisplayName} Program Leader)</p>
            <small style={{color: '#666'}}>Viewing data exclusively for {programDisplayName} program</small>
          </div>
        </div>
        <button
          onClick={() => setShowProgramSelection(true)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
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

      <div className="navigation-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', marginRight: '20px' }}>
            <button 
              className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoring')}
            >
              Monitoring
            </button>
            <button 
              className={`tab-button ${activeTab === 'assign' ? 'active' : ''}`}
              onClick={() => setActiveTab('assign')}
            >
              Assign Courses
            </button>
            <button 
              className={`tab-button ${activeTab === 'prl' ? 'active' : ''}`}
              onClick={() => setActiveTab('prl')}
            >
              PRL Reports ({filteredPrlReports.length})
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleCompileReports} disabled={loading} style={{ backgroundColor: programColor }}>
              {loading ? 'Compiling...' : 'Compile All Reports'}
            </button>
            <button className="btn-download" onClick={handleDownloadExcelSummary} disabled={loading}>
              {loading ? 'Downloading...' : 'Download Excel Summary'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'monitoring' && (
        <div className="module-section">
          <h3>Grouped Reports from PRL ({programDisplayName})</h3>

          {/* Stream Filter for Monitoring */}
          <div className="filter-section" style={{
            backgroundColor: programBgColor,
            border: `1px solid ${programColor}`,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: programColor, margin: '0 0 10px 0' }}>Filter Reports</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="form-group">
                <label>Stream</label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${programColor}`,
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Streams</option>
                  <option value="IT">Information Technology</option>
                  <option value="IS">Information Systems</option>
                  <option value="CS">Computer Science</option>
                  <option value="SE">Software Engineering</option>
                </select>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Showing data for: <strong>{selectedStream === 'all' ? 'All Streams' : selectedStream}</strong>
              </div>
            </div>
          </div>

          {compilationResult && (
            <div className="compilation-summary" style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4>Compilation Summary - {programDisplayName}</h4>
              <div className="summary-stats" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="stat-item">
                  <strong>Total Reports:</strong> {compilationResult.summary.totalReports}
                </div>
                <div className="stat-item">
                  <strong>Student Reports:</strong> {compilationResult.summary.studentReports}
                </div>
                <div className="stat-item">
                  <strong>Lecturer Reports:</strong> {compilationResult.summary.lecturerReports}
                </div>
                <div className="stat-item">
                  <strong>Ratings:</strong> {compilationResult.summary.ratings}
                </div>
                <div className="stat-item">
                  <strong>PRL Reports:</strong> {compilationResult.summary.prlReports}
                </div>
              </div>
            </div>
          )}

          <div className="grouped-reports-overview">
            <div className="reports-stats-horizontal">
              <div className="stat-item">
                <h4>Lecturer Reports</h4>
                <span className="stat-number">{groupedReports.lecturer?.length || 0}</span>
                <p>{selectedStream === 'all' ? 'All Streams' : selectedStream}</p>
              </div>
              <div className="stat-item">
                <h4>Student Reports</h4>
                <span className="stat-number">{groupedReports.student?.length || 0}</span>
                <p>{selectedStream === 'all' ? 'All Streams' : selectedStream}</p>
              </div>
              <div className="stat-item">
                <h4>PRL Reports</h4>
                <span className="stat-number">{groupedReports.prl?.length || 0}</span>
                <p>{selectedStream === 'all' ? 'All Streams' : selectedStream}</p>
              </div>
              <div className="stat-item">
                <h4>Student Ratings</h4>
                <span className="stat-number">{groupedReports.ratings?.length || 0}</span>
                <p>{selectedStream === 'all' ? 'All Streams' : selectedStream}</p>
              </div>
            </div>
          </div>

          <div className="grouped-reports">
            <div className="report-category">
              <h4>Lecturer Reports ({groupedReports.lecturer?.length || 0}) - {programDisplayName}</h4>
              <div className="category-reports">
                {groupedReports.lecturer && groupedReports.lecturer.length > 0 ? (
                  groupedReports.lecturer.map(report => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <h5>{report.courseName} ({report.courseCode})</h5>
                        <div>
                          <span className={`program-badge ${report.programType}`} style={{
                            backgroundColor: report.programType === 'degree' ? '#3498db' : '#66aa88ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {report.programType === 'degree' ? 'Degree' : 'Diploma'}
                          </span>
                          <span className="stream-badge" style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {report.stream}
                          </span>
                          <span className={`status-badge ${report.status}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                      <p><strong>Lecturer:</strong> {report.lecturerName}</p>
                      <p><strong>Week:</strong> {report.weekOfReporting}</p>
                      <p><strong>Attendance:</strong> {report.actualStudentsPresent}/{report.totalRegisteredStudents}</p>
                      {report.feedback && (
                        <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                          <p><strong>PRL Feedback:</strong> {report.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h4>No Lecturer Reports</h4>
                    <p>No lecturer reports available for {programDisplayName} program {selectedStream !== 'all' ? `in ${selectedStream} stream` : ''} yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="report-category">
              <h4>Student Reports ({groupedReports.student?.length || 0}) - {programDisplayName}</h4>
              <div className="category-reports">
                {groupedReports.student && groupedReports.student.length > 0 ? (
                  groupedReports.student.map(report => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <h5>{report.courseName} ({report.courseCode})</h5>
                        <div>
                          <span className={`program-badge ${report.programType}`} style={{
                            backgroundColor: report.programType === 'degree' ? '#3498db' : '#66aa88ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {report.programType === 'degree' ? 'Degree' : 'Diploma'}
                          </span>
                          <span className="stream-badge" style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {report.stream}
                          </span>
                          <span className={`status-badge ${report.status}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                      <p><strong>Student:</strong> {report.studentName}</p>
                      <p><strong>Week:</strong> {report.week}</p>
                      <p><strong>Attendance:</strong> {report.numberOfStudentsPresent}/{report.actualNumberOfStudents}</p>
                      {report.challengesFaced && (
                        <div style={{ background: '#fff3cd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                          <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h4>No Student Reports</h4>
                    <p>No student reports available for {programDisplayName} program {selectedStream !== 'all' ? `in ${selectedStream} stream` : ''} yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="report-category">
              <h4>Student Ratings ({groupedReports.ratings?.length || 0}) - {programDisplayName}</h4>
              <div className="category-reports">
                {groupedReports.ratings && groupedReports.ratings.length > 0 ? (
                  groupedReports.ratings.map(rating => (
                    <div key={rating.id} className="report-item">
                      <div className="report-header">
                        <h5>{rating.courseName} ({rating.courseCode})</h5>
                        <div>
                          <span className={`program-badge ${rating.programType}`} style={{
                            backgroundColor: rating.programType === 'degree' ? '#3498db' : '#66aa88ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {rating.programType === 'degree' ? 'Degree' : 'Diploma'}
                          </span>
                          <span className="stream-badge" style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            marginRight: '8px'
                          }}>
                            {rating.stream}
                          </span>
                          <span className={`status-badge ${rating.ratingStatus}`}>
                            {rating.ratingStatus === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                      <p><strong>Student:</strong> {rating.studentName}</p>
                      <p><strong>Lecturer:</strong> {rating.lecturerName}</p>
                      <p><strong>Class Rating:</strong> {rating.classRating}/5</p>
                      <p><strong>Lecturer Rating:</strong> {rating.lecturerRating}/5</p>
                      {rating.prlFeedback && (
                        <div style={{ background: '#e8f4fd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                          <p><strong>PRL Feedback:</strong> {rating.prlFeedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h4>No Student Ratings</h4>
                    <p>No student ratings available for {programDisplayName} program {selectedStream !== 'all' ? `in ${selectedStream} stream` : ''} yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="module-section">
          <h3>Assign Courses ({programDisplayName})</h3>
          <button 
            className="btn-primary" 
            onClick={() => setShowCourseForm(!showCourseForm)}
            disabled={loading}
            style={{ backgroundColor: programColor }}
          >
            {showCourseForm ? 'Cancel' : 'Assign New Course'}
          </button>

          {showCourseForm && (
            <form onSubmit={handleCourseSubmit} className="course-form">
              <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
                <h4>Course Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={courseForm.name} 
                      onChange={handleCourseInputChange} 
                      required 
                      placeholder="e.g., Introduction to Software Engineering"
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Code *</label>
                    <input 
                      type="text" 
                      name="code" 
                      value={courseForm.code} 
                      onChange={handleCourseInputChange} 
                      required 
                      placeholder="e.g., SE101"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
                <h4>Lecturer & Stream</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lecturer *</label>
                    <input 
                      type="text" 
                      name="lecturer" 
                      value={courseForm.lecturer} 
                      onChange={handleCourseInputChange} 
                      required 
                      placeholder=""
                    />
                  </div>
                  <div className="form-group">
                    <label>Stream *</label>
                    <select 
                      name="stream" 
                      value={courseForm.stream} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Stream</option>
                      {streams.map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
                <h4>Faculty & Program</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Faculty *</label>
                    <select 
                      name="faculty" 
                      value={courseForm.faculty} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(faculty => (
                        <option key={faculty} value={faculty}>{faculty}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Program Type *</label>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: programBgColor, 
                      border: `1px solid ${programColor}`,
                      borderRadius: '4px',
                      color: programColor,
                      fontWeight: 'bold'
                    }}>
                      <strong>{programDisplayName}</strong>
                      <small style={{display: 'block', color: '#666', fontSize: '0.8rem'}}>
                        Currently managing {programDisplayName} program
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
                <h4>Semester & Year</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Semester *</label>
                    <select 
                      name="semester" 
                      value={courseForm.semester} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(semester => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year *</label>
                    <select 
                      name="year" 
                      value={courseForm.year} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
                <h4>Schedule Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Schedule Day *</label>
                    <select 
                      name="schedule.day" 
                      value={courseForm.schedule.day} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Day</option>
                      {weekDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Schedule Time *</label>
                    <select 
                      name="schedule.time" 
                      value={courseForm.schedule.time} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room *</label>
                    <select 
                      name="schedule.room" 
                      value={courseForm.schedule.room} 
                      onChange={handleCourseInputChange} 
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map(room => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: programColor }}>
                {loading ? 'Assigning...' : `Assign Course to ${programDisplayName} Program`}
              </button>
            </form>
          )}

          <div className="assigned-courses">
            <h4>Assigned Courses by Stream ({programDisplayName})</h4>
            {Object.entries(streamGroupedCourses).map(([stream, streamCourses]) => (
              <div key={stream} className="stream-course-group">
                <h5 style={{ color: programColor }}>{stream} Stream ({programDisplayName}) - {streamCourses.length} courses</h5>
                <div className="courses-list">
                  {streamCourses.length > 0 ? (
                    streamCourses.map(course => (
                      <div key={course.id} className="course-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                        <div className="course-header">
                          <strong>{course.name} ({course.code})</strong>
                          <span className="program-badge" style={{
                            backgroundColor: programColor,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem'
                          }}>
                            {programDisplayName}
                          </span>
                        </div>
                        <p><strong>Lecturer:</strong> {course.lecturer}</p>
                        <p><strong>Faculty:</strong> {course.faculty}</p>
                        <p><strong>Semester:</strong> {course.semester} | <strong>Year:</strong> {course.year}</p>
                        <p><strong>Schedule:</strong> {course.schedule?.day} {course.schedule?.time} - {course.schedule?.room}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p>No courses assigned to {stream} stream for {programDisplayName} program.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'prl' && (
        <div className="module-section">
          <h3>PRL Specific Reports ({programDisplayName}) - {filteredPrlReports.length}</h3>
          
          {/* Add Program and Stream Selection for PL */}
          <div className="filter-section" style={{
            backgroundColor: programBgColor,
            border: `1px solid ${programColor}`,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: programColor, margin: '0 0 10px 0' }}>Filter Reports</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div className="form-group">
                <label>Program Type</label>
                <select
                  value={programType}
                  onChange={(e) => handleProgramSelect(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${programColor}`,
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="degree">Degree Program</option>
                  <option value="diploma">Diploma Program</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stream</label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `2px solid ${programColor}`,
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Streams</option>
                  <option value="IT">Information Technology</option>
                  <option value="IS">Information Systems</option>
                  <option value="CS">Computer Science</option>
                  <option value="SE">Software Engineering</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
              Showing: <strong>{programDisplayName} Program</strong> • <strong>{selectedStream === 'all' ? 'All Streams' : selectedStream + ' Stream'}</strong>
            </div>
          </div>

          <div className="prl-reports">
            {filteredPrlReports.length > 0 ? (
              filteredPrlReports.map(report => (
                <div key={report.id} className="prl-report-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                  <div className="report-header">
                    <h4>PRL Monitoring Report</h4>
                    <div className="report-meta">
                      <span className={`program-badge ${report.programType}`} style={{
                        backgroundColor: report.programType === 'degree' ? '#3498db' : '#66aa88ff',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        marginRight: '8px'
                      }}>
                        {report.programType === 'degree' ? 'Degree' : 'Diploma'}
                      </span>
                      <span className="stream-badge" style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        marginRight: '8px'
                      }}>
                        {report.stream} Stream
                      </span>
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                      {report.isSubmittedToPL && (
                        <span className="submitted-badge">Submitted by PRL</span>
                      )}
                    </div>
                  </div>
                  <div className="report-details">
                    <p><strong>PRL:</strong> {report.lecturerName || report.studentName}</p>
                    <p><strong>Stream:</strong> {report.stream}</p>
                    <p><strong>Faculty:</strong> {report.faculty}</p>
                    <p><strong>Week:</strong> {report.weekOfReporting}</p>
                    <p><strong>Date Submitted:</strong> {new Date(report.date || report.dateOfLecture || report.createdAt).toLocaleDateString()}</p>
                    {report.issues && (
                      <div className="content-section">
                        <h5>Issues Identified:</h5>
                        <p>{report.issues}</p>
                      </div>
                    )}
                    {report.recommendations && (
                      <div className="content-section">
                        <h5>Recommendations:</h5>
                        <p>{report.recommendations}</p>
                      </div>
                    )}
                    {report.plFeedback && (
                      <div className="feedback-section" style={{ background: '#e8f4fd', padding: '10px', borderRadius: '4px' }}>
                        <h5>Your Previous Feedback:</h5>
                        <p>{report.plFeedback}</p>
                      </div>
                    )}
                  </div>
                  <div className="report-actions">
                    <div className="feedback-input">
                      <label>Provide/Edit Feedback to PRL:</label>
                      <textarea
                        value={feedbackData[report.id] || report.plFeedback || ''}
                        onChange={(e) => handleFeedbackChange(report.id, e.target.value)}
                        placeholder="Enter your feedback for the PRL report..."
                        rows="3"
                        style={{width: '100%', marginBottom: '10px'}}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSubmitFeedback(report.id)}
                        disabled={loading}
                        style={{ backgroundColor: programColor }}
                      >
                        {loading ? 'Submitting...' : report.plFeedback ? 'Update Feedback' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No PRL Specific Reports</h4>
                <p>No PRL specific reports available for {programDisplayName} program {selectedStream !== 'all' ? `in ${selectedStream} stream` : ''} yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PLPage;