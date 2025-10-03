import React, { useState, useEffect, useCallback } from 'react';
import { getPRLReports, createPRLReport, submitGroupedReports, addFeedback, getCourses } from '../services/api';

const PRLPage = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [formData, setFormData] = useState({
    programType: user?.programType || '',
    stream: user?.stream || 'IT',
    weekOfReporting: '',
    dateOfLecture: '',
    issues: '',
    recommendations: ''
  });

  const [feedbackData, setFeedbackData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showProgramSelection, setShowProgramSelection] = useState(!user?.programType);
  const [programType, setProgramType] = useState(user?.programType || '');
  const [selectedStream, setSelectedStream] = useState(user?.stream || 'IT');
  const [selectedReports, setSelectedReports] = useState({
    student: [],
    lecturer: [],
    prl: [],
    ratings: []
  });

  const handleProgramSelect = (selectedProgramType) => {
    setProgramType(selectedProgramType);
    setShowProgramSelection(false);
    if (user) {
      user.programType = selectedProgramType;
    }
  };

  const handleStreamChange = (stream) => {
    setSelectedStream(stream);
    setFormData(prev => ({
      ...prev,
      stream: stream
    }));
  };

  const programDisplayName = programType === 'degree' ? 'Degree' : 'Diploma';
  const programColor = programType === 'degree' ? '#3498db' : '#66aa88';
  const programBgColor = programType === 'degree' ? '#f5f8fa' : '#ffffff';

  const fetchReports = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching PRL reports for ${programDisplayName} program, stream: ${selectedStream}...`);
      const data = await getPRLReports(selectedStream, programType);
      setReports(data);
      console.log(`Loaded ${data.length} reports for ${programDisplayName} program, stream: ${selectedStream}`);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  }, [programType, selectedStream, programDisplayName]);

  const fetchAssignedCourses = useCallback(async () => {
    if (!programType) return;
    
    try {
      console.log(`Fetching assigned courses for ${programDisplayName} program, stream: ${selectedStream}`);
      const allCourses = await getCourses(selectedStream, programType);
      
      const filteredCourses = allCourses.filter(course => 
        course.stream === selectedStream
      );
      
      setAssignedCourses(filteredCourses || []);
      console.log(`Loaded ${filteredCourses.length} assigned courses for ${programDisplayName} program, stream: ${selectedStream}`);
    } catch (error) {
      console.error('Error fetching assigned courses:', error);
      setAssignedCourses([]);
    }
  }, [programType, selectedStream, programDisplayName]);

  useEffect(() => {
    if (!programType) return;
    
    fetchReports();
    fetchAssignedCourses();
    
    setFormData(prev => ({
      ...prev,
      programType: programType,
      stream: selectedStream
    }));
  }, [programType, fetchReports, fetchAssignedCourses, selectedStream]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      setFormData({
        ...formData,
        dateOfLecture: formattedDate
      });
    } else {
      setFormData({
        ...formData,
        dateOfLecture: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    if (!formData.weekOfReporting || !formData.dateOfLecture || !formData.issues || !formData.recommendations) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Submitting PRL report:', formData);
      
      const result = await createPRLReport({
        ...formData,
        isPRLReport: true,
        status: 'submitted',
        type: 'prl',
        createdAt: new Date().toISOString()
      });
      
      console.log('Submission result:', result);
      alert(`PRL report submitted successfully for ${selectedStream} stream in ${programDisplayName} program!`);
      
      setFormData({
        programType: programType,
        stream: selectedStream,
        weekOfReporting: '',
        dateOfLecture: '',
        issues: '',
        recommendations: ''
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
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

  const handleSubmitFeedback = async (reportId, isRating = false) => {
    if (!feedbackData[reportId]?.trim()) {
      alert('Please enter feedback before submitting.');
      return;
    }

    try {
      setLoading(true);
      await addFeedback(reportId, feedbackData[reportId] || '', isRating);
      alert('Feedback submitted successfully!');
      setFeedbackData({
        ...feedbackData,
        [reportId]: ''
      });
      fetchReports();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcelSummary = async () => {
    if (!programType) {
      alert('Please select a program first');
      return;
    }
    
    try {
      setLoading(true);
      
      const groupedReports = {
        student: studentReports,
        lecturer: lecturerReports,
        prl: prlReports,
        ratings: ratingReports
      };
      
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
        generatedBy: user?.username || 'PRL'
      };
      
      const csvContent = convertToCSV(excelData);
      downloadCSV(csvContent, `prl-summary-${selectedStream}-${programType}-${new Date().toISOString().split('T')[0]}.csv`);
      
      alert(`Excel summary downloaded successfully for ${selectedStream} stream in ${programDisplayName} program!`);
    } catch (error) {
      console.error('Error downloading Excel summary:', error);
      alert('Error downloading Excel summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      'Report Type', 'Course Code', 'Course Name', 'Person Name', 'Week', 'Date',
      'Attendance', 'Issues/Challenges', 'Recommendations/Feedback', 'Status', 'Rating'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
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
        ''
      ];
      csvContent += row.join(',') + '\n';
    });
    
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
        ''
      ];
      csvContent += row.join(',') + '\n';
    });
    
    data.reports.prl?.forEach(report => {
      const row = [
        'PRL Report',
        '',
        '',
        `"${user?.username || 'PRL'}"`,
        `"${report.weekOfReporting || ''}"`,
        `"${report.dateOfLecture || ''}"`,
        '',
        `"${report.issues || ''}"`,
        `"${report.recommendations || ''}"`,
        `"${report.status || ''}"`,
        ''
      ];
      csvContent += row.join(',') + '\n';
    });
    
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
        `"Class: ${report.classRating || 0}/5, Lecturer: ${report.lecturerRating || 0}/5"`
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

  const handleReportSelection = (reportId, reportType, isSelected) => {
    setSelectedReports(prev => {
      const newSelection = { ...prev };
      if (isSelected) {
        if (!newSelection[reportType].includes(reportId)) {
          newSelection[reportType].push(reportId);
        }
      } else {
        newSelection[reportType] = newSelection[reportType].filter(id => id !== reportId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (reportType, reports) => {
    const allReportIds = reports.map(report => report.id);
    setSelectedReports(prev => ({
      ...prev,
      [reportType]: prev[reportType].length === allReportIds.length ? [] : allReportIds
    }));
  };

  const handleSubmitToPL = async () => {
    if (!programType) {
      alert('Please select a program first');
      return;
    }

    const totalSelected = Object.values(selectedReports).flat().length;
    if (totalSelected === 0) {
      alert('Please select at least one report to submit to Program Leader.');
      return;
    }

    try {
      setLoading(true);
      
      const selectedReportsData = {
        student: studentReports.filter(report => selectedReports.student.includes(report.id)),
        lecturer: lecturerReports.filter(report => selectedReports.lecturer.includes(report.id)),
        prl: prlReports.filter(report => selectedReports.prl.includes(report.id)),
        ratings: ratingReports.filter(report => selectedReports.ratings.includes(report.id))
      };

      console.log('Submitting to PL:', selectedReportsData);
      
      await submitGroupedReports(selectedStream, programType, selectedReportsData);
      
      alert(`Successfully submitted ${totalSelected} reports to Program Leader for ${selectedStream} stream in ${programDisplayName} program!`);
      
      setSelectedReports({
        student: [],
        lecturer: [],
        prl: [],
        ratings: []
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting to PL:', error);
      alert('Error submitting reports to Program Leader. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter reports by type and program
  const studentReports = reports.filter(report => 
    report.type === 'student' && 
    report.programType === programType &&
    report.stream === selectedStream
  );
  
  const lecturerReports = reports.filter(report => 
    report.type === 'lecturer' && 
    !report.isPRLReport && 
    report.programType === programType &&
    report.stream === selectedStream
  );
  
  const ratingReports = reports.filter(report => 
    report.isRating === true && 
    report.programType === programType &&
    report.stream === selectedStream
  );
  
  const prlReports = reports.filter(report => 
    report.isPRLReport === true && 
    report.programType === programType &&
    report.stream === selectedStream
  );
  
  const submittedToPLReports = reports.filter(report => 
    report.isSubmittedToPL === true && 
    report.programType === programType &&
    report.stream === selectedStream
  );

  const selectedCounts = {
    student: selectedReports.student.length,
    lecturer: selectedReports.lecturer.length,
    prl: selectedReports.prl.length,
    ratings: selectedReports.ratings.length,
    total: Object.values(selectedReports).flat().length
  };

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
          <h2>Welcome to PRL Portal</h2>
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
                backgroundColor: '#66aa88',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#559977'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#66aa88'}
            >
              Diploma Program
            </button>
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
              PRL Portal - {programDisplayName} Program
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              Welcome, {user?.username} • {programDisplayName} Program • {selectedStream} Stream
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: programColor }}>
                Stream:
              </label>
              <select
                value={selectedStream}
                onChange={(e) => handleStreamChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `2px solid ${programColor}`,
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#333',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                <option value="IT">Information Technology (IT)</option>
                <option value="IS">Information Systems (IS)</option>
                <option value="CS">Computer Science (CS)</option>
                <option value="SE">Software Engineering (SE)</option>
              </select>
            </div>
            <div style={{
              backgroundColor: programColor,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {programDisplayName} PRL
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

      <div className="navigation-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            Monitoring & Feedback
          </button>
          <button 
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Assigned Courses ({assignedCourses.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'prl' ? 'active' : ''}`}
            onClick={() => setActiveTab('prl')}
          >
            Submit PRL Report
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Report History ({prlReports.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'submitted' ? 'active' : ''}`}
            onClick={() => setActiveTab('submitted')}
          >
            Submitted to PL ({submittedToPLReports.length})
          </button>
          <button 
            className="btn-download" 
            onClick={handleDownloadExcelSummary} 
            disabled={loading}
            style={{ 
              backgroundColor: '#28a745',
              padding: '8px 16px',
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: loading ? '' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Generating Excel...' : 'Download Excel Summary'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={handleSubmitToPL} 
            disabled={loading || selectedCounts.total === 0} 
            style={{ 
              backgroundColor: selectedCounts.total === 0 ? '#ccc' : programColor,
              cursor: selectedCounts.total === 0 ? '' : 'pointer',
              padding: '8px 16px',
              fontSize: '0.9rem',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              opacity: (loading || selectedCounts.total === 0) ? 0.6 : 1
            }}
          >
            {loading ? 'Submitting...' : `Submit (${selectedCounts.total}) Selected to PL`}
          </button>
        </div>
      </div>

      {activeTab === 'monitoring' && (
        <div className="module-section">
          <h3>Monitoring Reports - {programDisplayName} Program ({selectedStream} Stream)</h3>
          
          <div className="selection-summary" style={{
            backgroundColor: programBgColor,
            border: `1px solid ${programColor}`,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: programColor, margin: '0 0 10px 0' }}>Grouped Reports Selection</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Selected:</span>
                <span style={{ 
                  backgroundColor: programColor, 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}>
                  {selectedCounts.total} reports
                </span>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <span>Student: {selectedCounts.student}</span>
                <span>Lecturer: {selectedCounts.lecturer}</span>
                <span>PRL: {selectedCounts.prl}</span>
                <span>Ratings: {selectedCounts.ratings}</span>
              </div>
            </div>
          </div>

          <div className="reports-overview">
            <div className="stats-grid">
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Student Reports</h5>
                <span className="stat-number" style={{ color: programColor }}>{studentReports.length}</span>
                <p>Student reports from {selectedStream} stream</p>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Lecturer Reports</h5>
                <span className="stat-number" style={{ color: programColor }}>{lecturerReports.length}</span>
                <p>Lecturer reports from {selectedStream} stream</p>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Student Ratings</h5>
                <span className="stat-number" style={{ color: programColor }}>{ratingReports.length}</span>
                <p>Student feedback from {selectedStream} stream</p>
              </div>
              <div className="stat-card" style={{ borderTop: `3px solid ${programColor}` }}>
                <h5>Your PRL Reports</h5>
                <span className="stat-number" style={{ color: programColor }}>{prlReports.length}</span>
                <p>Your monitoring reports for {selectedStream} stream</p>
              </div>
            </div>
          </div>

          <div className="report-categories">
            {/* Student Reports Section */}
            <div className="report-category">
              <div className="category-header">
                <h4>Student Reports ({studentReports.length}) - {selectedStream} Stream</h4>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAll('student', studentReports)}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                >
                  {selectedReports.student.length === studentReports.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="category-reports">
                {studentReports.map(report => (
                  <div key={report.id} className="report-item" style={{ 
                    borderLeft: `4px solid ${programColor}`,
                    backgroundColor: selectedReports.student.includes(report.id) ? programBgColor : 'transparent'
                  }}>
                    <div className="report-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedReports.student.includes(report.id)}
                          onChange={(e) => handleReportSelection(report.id, 'student', e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <h5>{report.courseName} ({report.courseCode})</h5>
                      </div>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <p><strong>Student:</strong> {report.studentName}</p>
                    <p><strong>Stream:</strong> {report.stream}</p>
                    <p><strong>Program:</strong> {report.programType === 'degree' ? 'Degree' : 'Diploma'}</p>
                    <p><strong>Week:</strong> {report.week}</p>
                    <p><strong>Date:</strong> {report.date}</p>
                    <p><strong>Attendance:</strong> {report.numberOfStudentsPresent}/{report.actualNumberOfStudents}</p>
                    {report.challengesFaced && (
                      <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                    )}
                    {report.feedback && (
                      <div style={{ background: '#e8f4fd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                        <p><strong>Your Feedback:</strong> {report.feedback}</p>
                      </div>
                    )}
                    <div className="feedback-section">
                      <textarea
                        value={feedbackData[report.id] || ''}
                        onChange={(e) => handleFeedbackChange(report.id, e.target.value)}
                        placeholder="Provide feedback to student..."
                        rows="2"
                        style={{width: '100%', marginBottom: '10px'}}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSubmitFeedback(report.id)}
                        disabled={loading}
                        style={{ backgroundColor: programColor }}
                      >
                        {report.feedback ? 'Update Feedback' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lecturer Reports Section */}
            <div className="report-category">
              <div className="category-header">
                <h4>Lecturer Reports ({lecturerReports.length}) - {selectedStream} Stream</h4>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAll('lecturer', lecturerReports)}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                >
                  {selectedReports.lecturer.length === lecturerReports.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="category-reports">
                {lecturerReports.map(report => (
                  <div key={report.id} className="report-item" style={{ 
                    borderLeft: `4px solid ${programColor}`,
                    backgroundColor: selectedReports.lecturer.includes(report.id) ? programBgColor : 'transparent'
                  }}>
                    <div className="report-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedReports.lecturer.includes(report.id)}
                          onChange={(e) => handleReportSelection(report.id, 'lecturer', e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <h5>{report.courseName} ({report.courseCode})</h5>
                      </div>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <p><strong>Lecturer:</strong> {report.lecturerName}</p>
                    <p><strong>Stream:</strong> {report.stream}</p>
                    <p><strong>Program:</strong> {report.programType === 'degree' ? 'Degree' : 'Diploma'}</p>
                    <p><strong>Week:</strong> {report.weekOfReporting}</p>
                    <p><strong>Date:</strong> {report.dateOfLecture}</p>
                    <p><strong>Attendance:</strong> {report.actualStudentsPresent}/{report.totalRegisteredStudents}</p>
                    {report.challengesFaced && (
                      <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                    )}
                    {report.feedback && (
                      <div style={{ background: '#e8f4fd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                        <p><strong>Your Feedback:</strong> {report.feedback}</p>
                      </div>
                    )}
                    <div className="feedback-section">
                      <textarea
                        value={feedbackData[report.id] || ''}
                        onChange={(e) => handleFeedbackChange(report.id, e.target.value)}
                        placeholder="Provide feedback to lecturer..."
                        rows="2"
                        style={{width: '100%', marginBottom: '10px'}}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSubmitFeedback(report.id)}
                        disabled={loading}
                        style={{ backgroundColor: programColor }}
                      >
                        {report.feedback ? 'Update Feedback' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Ratings Section */}
            <div className="report-category">
              <div className="category-header">
                <h4>Student Ratings ({ratingReports.length}) - {selectedStream} Stream</h4>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAll('ratings', ratingReports)}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                >
                  {selectedReports.ratings.length === ratingReports.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="category-reports">
                {ratingReports.map(report => (
                  <div key={report.id} className="report-item" style={{ 
                    borderLeft: `4px solid ${programColor}`,
                    backgroundColor: selectedReports.ratings.includes(report.id) ? programBgColor : 'transparent'
                  }}>
                    <div className="report-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedReports.ratings.includes(report.id)}
                          onChange={(e) => handleReportSelection(report.id, 'ratings', e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <h5>{report.courseName} ({report.courseCode})</h5>
                      </div>
                      <span className={`status-badge ${report.ratingStatus || 'submitted'}`}>
                        {report.ratingStatus === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                      </span>
                    </div>
                    <p><strong>Student:</strong> {report.studentName}</p>
                    <p><strong>Lecturer:</strong> {report.lecturerName}</p>
                    <p><strong>Stream:</strong> {report.stream}</p>
                    <p><strong>Program:</strong> {report.programType === 'degree' ? 'Degree' : 'Diploma'}</p>
                    <p><strong>Class Rating:</strong> {report.classRating}/5</p>
                    <p><strong>Lecturer Rating:</strong> {report.lecturerRating}/5</p>
                    {report.comments && (
                      <p><strong>Comments:</strong> {report.comments}</p>
                    )}
                    {report.prlFeedback && (
                      <div style={{ background: '#e8f4fd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                        <p><strong>Your Feedback:</strong> {report.prlFeedback}</p>
                      </div>
                    )}
                    <div className="feedback-section">
                      <textarea
                        value={feedbackData[report.id] || ''}
                        onChange={(e) => handleFeedbackChange(report.id, e.target.value)}
                        placeholder="Provide feedback on rating..."
                        rows="2"
                        style={{width: '100%', marginBottom: '10px'}}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={() => handleSubmitFeedback(report.id, true)}
                        disabled={loading}
                        style={{ backgroundColor: programColor }}
                      >
                        {report.prlFeedback ? 'Update Feedback' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRL Reports Section */}
            <div className="report-category">
              <div className="category-header">
                <h4>Your PRL Reports ({prlReports.length}) - {selectedStream} Stream</h4>
                <button 
                  className="btn-secondary"
                  onClick={() => handleSelectAll('prl', prlReports)}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                >
                  {selectedReports.prl.length === prlReports.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="category-reports">
                {prlReports.map(report => (
                  <div key={report.id} className="report-item" style={{ 
                    borderLeft: `4px solid ${programColor}`,
                    backgroundColor: selectedReports.prl.includes(report.id) ? programBgColor : 'transparent'
                  }}>
                    <div className="report-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedReports.prl.includes(report.id)}
                          onChange={(e) => handleReportSelection(report.id, 'prl', e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <h5>PRL Monitoring Report</h5>
                      </div>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <p><strong>Stream:</strong> {report.stream}</p>
                    <p><strong>Program:</strong> {report.programType === 'degree' ? 'Degree' : 'Diploma'}</p>
                    <p><strong>Week:</strong> {report.weekOfReporting}</p>
                    <p><strong>Date:</strong> {report.dateOfLecture}</p>
                    <p><strong>Issues:</strong> {report.issues}</p>
                    <p><strong>Recommendations:</strong> {report.recommendations}</p>
                    {report.plFeedback && (
                      <div style={{ background: '#e8f4fd', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                        <p><strong>PL Feedback:</strong> {report.plFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="module-section">
          <h3>Assigned Courses - {programDisplayName} Program ({selectedStream} Stream)</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            These are the courses assigned specifically to the {selectedStream} stream by the Program Leader for the {programDisplayName} program.
          </p>

          <div className="stream-info" style={{
            backgroundColor: programBgColor,
            border: `1px solid ${programColor}`,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: programColor, margin: '0 0 10px 0' }}>Stream Information</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <strong>Current Stream:</strong> {selectedStream}
              </div>
              <div>
                <strong>Program:</strong> {programDisplayName}
              </div>
              <div>
                <strong>Total Courses:</strong> {assignedCourses.length}
              </div>
            </div>
          </div>

          <div className="courses-overview">
            {assignedCourses.length > 0 ? (
              <div className="courses-grid">
                {assignedCourses.map(course => (
                  <div key={course.id} className="course-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                    <div className="course-header">
                      <h4>{course.name}</h4>
                      <span className="course-code" style={{ backgroundColor: programColor }}>
                        {course.code}
                      </span>
                    </div>
                    <div className="course-details">
                      <p><strong>Lecturer:</strong> {course.lecturer}</p>
                      <p><strong>Faculty:</strong> {course.faculty}</p>
                      <p><strong>Stream:</strong> <span style={{ color: programColor, fontWeight: 'bold' }}>{course.stream}</span></p>
                      <p><strong>Program:</strong> <span style={{ color: programColor, fontWeight: 'bold' }}>{programDisplayName}</span></p>
                      {course.semester && (
                        <p><strong>Semester:</strong> {course.semester}</p>
                      )}
                      {course.year && (
                        <p><strong>Year:</strong> {course.year}</p>
                      )}
                      {course.schedule && (
                        <div className="schedule-info">
                          <p><strong>Schedule:</strong></p>
                          <p>{course.schedule.day} {course.schedule.time}</p>
                          {course.schedule.room && (
                            <p><strong>Room:</strong> {course.schedule.room}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="course-stats">
                      <div className="stat">
                        <span className="stat-label">Student Reports</span>
                        <span className="stat-value">
                          {reports.filter(report => 
                            report.courseCode === course.code && 
                            report.type === 'student' && 
                            report.programType === programType
                          ).length}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Lecturer Reports</span>
                        <span className="stat-value">
                          {reports.filter(report => 
                            report.courseCode === course.code && 
                            report.type === 'lecturer' && 
                            report.programType === programType
                          ).length}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ratings</span>
                        <span className="stat-value">
                          {reports.filter(report => 
                            report.courseCode === course.code && 
                            report.isRating === true && 
                            report.programType === programType
                          ).length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No Courses Assigned to This Stream</h4>
                <p>No courses have been assigned to the {selectedStream} stream for the {programDisplayName} program yet.</p>
                <p>Courses will appear here once assigned by the Program Leader.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'prl' && (
        <div className="module-section">
          <h3>Submit PRL Report - {programDisplayName} Program ({selectedStream} Stream)</h3>
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-section" style={{ borderLeft: `4px solid ${programColor}`, paddingLeft: '15px', marginBottom: '20px' }}>
              <h4>Program Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Program Type *</label>
                  <input 
                    type="text" 
                    value={programDisplayName} 
                    readOnly 
                    className="disabled-field"
                    style={{ backgroundColor: programBgColor, color: programColor, fontWeight: 'bold' }}
                  />
                </div>
                <div className="form-group">
                  <label>Stream *</label>
                  <input 
                    type="text" 
                    value={selectedStream} 
                    readOnly 
                    className="disabled-field"
                    style={{ backgroundColor: programBgColor, color: programColor, fontWeight: 'bold' }}
                  />
                </div>
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
                <input 
                  type="date" 
                  name="dateOfLecture" 
                  onChange={handleDateChange} 
                  required 
                />
                {formData.dateOfLecture && (
                  <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    Selected date: {formData.dateOfLecture}
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Issues Identified *</label>
                <textarea 
                  name="issues" 
                  value={formData.issues} 
                  onChange={handleInputChange} 
                  required 
                  rows="4"
                  placeholder="Describe the issues identified during monitoring for your stream..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Recommendations *</label>
                <textarea 
                  name="recommendations" 
                  value={formData.recommendations} 
                  onChange={handleInputChange} 
                  required 
                  rows="4"
                  placeholder="Provide recommendations for improvement for your stream..."
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: programColor }}>
              {loading ? 'Submitting...' : `Submit PRL Report for ${selectedStream} Stream`}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="module-section">
          <h3>Your PRL Reports History - {programDisplayName} Program ({selectedStream} Stream)</h3>
          <div className="reports-list">
            {prlReports.length > 0 ? (
              prlReports.map(report => (
                <div key={report.id} className="report-card" style={{ borderLeft: `4px solid ${programColor}` }}>
                  <div className="report-header">
                    <h4>PRL Monitoring Report</h4>
                    <div>
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                      {report.isSubmittedToPL && (
                        <span className="submitted-badge" style={{backgroundColor: '#51cf66'}}>
                          Submitted to PL
                        </span>
                      )}
                    </div>
                  </div>
                  <p><strong>Program:</strong> {report.programType?.toUpperCase() || programDisplayName} | <strong>Stream:</strong> {report.stream}</p>
                  <p><strong>Week:</strong> {report.weekOfReporting} | <strong>Date:</strong> {report.dateOfLecture}</p>
                  <div className="report-content">
                    <div className="content-section">
                      <h5>Issues Identified:</h5>
                      <p>{report.issues}</p>
                    </div>
                    <div className="content-section">
                      <h5>Recommendations:</h5>
                      <p>{report.recommendations}</p>
                    </div>
                  </div>
                  <p><strong>Submitted:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                  {report.plFeedback && (
                    <div className="feedback-section" style={{ background: '#e8f4fd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                      <h5>PL Feedback:</h5>
                      <p>{report.plFeedback}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No PRL Reports Submitted Yet</h4>
                <p>Submit your first PRL report above to see your report history here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submitted' && (
        <div className="module-section">
          <h3>Reports Submitted to Program Leader - {programDisplayName} Program ({selectedStream} Stream)</h3>
          <div className="reports-list">
            {submittedToPLReports.length > 0 ? (
              submittedToPLReports.map(report => (
                <div key={report.id} className="report-card" style={{ borderLeft: `4px solid #51cf66` }}>
                  <div className="report-header">
                    <h4>
                      {report.type === 'prl' ? 'PRL Monitoring Report' : 
                       report.type === 'student' ? 'Student Report' : 
                       report.type === 'lecturer' ? 'Lecturer Report' : 'Rating Report'}
                    </h4>
                    <span className="status-badge" style={{backgroundColor: '#51cf66'}}>
                      Submitted to PL
                    </span>
                  </div>
                  <p><strong>Program:</strong> {report.programType?.toUpperCase() || programDisplayName} | <strong>Stream:</strong> {report.stream}</p>
                  {report.type === 'prl' ? (
                    <>
                      <p><strong>Week:</strong> {report.weekOfReporting} | <strong>Date:</strong> {report.dateOfLecture}</p>
                      <div className="report-content">
                        <div className="content-section">
                          <h5>Issues:</h5>
                          <p>{report.issues}</p>
                        </div>
                        <div className="content-section">
                          <h5>Recommendations:</h5>
                          <p>{report.recommendations}</p>
                        </div>
                      </div>
                    </>
                  ) : report.type === 'student' ? (
                    <>
                      <p><strong>Student:</strong> {report.studentName} | <strong>Week:</strong> {report.week}</p>
                      <p><strong>Course:</strong> {report.courseName} ({report.courseCode})</p>
                      {report.challengesFaced && (
                        <p><strong>Challenges:</strong> {report.challengesFaced}</p>
                      )}
                    </>
                  ) : report.type === 'lecturer' ? (
                    <>
                      <p><strong>Lecturer:</strong> {report.lecturerName} | <strong>Week:</strong> {report.weekOfReporting}</p>
                      <p><strong>Course:</strong> {report.courseName} ({report.courseCode})</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Student:</strong> {report.studentName} | <strong>Lecturer:</strong> {report.lecturerName}</p>
                      <p><strong>Class Rating:</strong> {report.classRating}/5 | <strong>Lecturer Rating:</strong> {report.lecturerRating}/5</p>
                    </>
                  )}
                  <p><strong>Submitted to PL:</strong> {new Date(report.submittedToPLDate).toLocaleDateString()}</p>
                  {report.plFeedback && (
                    <div className="feedback-section" style={{ background: '#e8f4fd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                      <h5>PL Feedback:</h5>
                      <p>{report.plFeedback}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <h4>No Reports Submitted to PL Yet</h4>
                <p>Select reports from the Monitoring tab and submit them to the Program Leader.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PRLPage;