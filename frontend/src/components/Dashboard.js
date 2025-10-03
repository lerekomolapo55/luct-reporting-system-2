import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <h2>LUCT Faculty Reporting System</h2>
      
      {user ? (
        <p className="user-welcome">Welcome back, {user.username} ({user.role})</p>
      ) : (
        <p className="dashboard-guest">Welcome to LUCT Reporting System. Please login to access specific modules.</p>
      )}
      
      <div className="dashboard-cards">
        <div className="card">
          <h3>About the System</h3>
          <p>This system allows faculty members and students to submit, track, and manage academic reports efficiently.</p>
          <p>Key features include:</p>
          <ul>
            <li>Student reporting and feedback</li>
            <li>Lecturer performance tracking</li>
            <li>Principal Lecturer oversight</li>
            <li>Program Leader management</li>
          </ul>
        </div>
        
        {user ? (
          <div className="card">
            <h3>Your Dashboard</h3>
            <p>Role: <strong>{user.role}</strong></p>
            {user.faculty && <p>Faculty: <strong>{user.faculty}</strong></p>}
            {user.stream && <p>Stream: <strong>{user.stream}</strong></p>}
            <p>You have access to the {user.role} module with appropriate permissions.</p>
          </div>
        ) : (
          <div className="card">
            <h3>Get Started</h3>
            <p>To use the system, please login with your credentials.</p>
            <p>Different roles have access to different features:</p>
            <ul>
              <li><strong>Students</strong> can submit reports and view their history</li>
              <li><strong>Lecturers</strong> can submit reports and view class performance</li>
              <li><strong>PRLs</strong> can manage courses and provide feedback</li>
              <li><strong>PLs</strong> can oversee programs and compile reports</li>
            </ul>
          </div>
        )}
        
        <div className="card">
          <h3>System Overview</h3>
          <p>The LUCT Reporting System helps maintain academic excellence through:</p>
          <ul>
            <li>Regular reporting and monitoring</li>
            <li>Transparent feedback mechanisms</li>
            <li>Comprehensive data tracking</li>
            <li>Role-based access control</li>
          </ul>
          <p>For assistance, please contact the system administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;