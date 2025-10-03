import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import StudentPage from './components/StudentPage';
import LecturerPage from './components/LecturerPage';
import PRLPage from './components/PRLPage';
import PLPage from './components/PLPage';
import Login from './components/Login';
import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('luctUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    // Simple authentication - in real app, this would verify credentials
    const userInfo = {
      id: Date.now(),
      username: userData.username,
      role: userData.role,
      faculty: userData.faculty || '',
      stream: userData.stream || ''
    };
    
    setUser(userInfo);
    setIsAuthenticated(true);
    localStorage.setItem('luctUser', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('luctUser');
    setActiveModule('dashboard');
  };

  const renderModule = () => {
    // Always show dashboard without login
    if (activeModule === 'dashboard') {
      return <Dashboard user={user} />;
    }
    
    // For other modules, check authentication
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} requestedModule={activeModule} />;
    }

    switch (activeModule) {
      case 'student':
        return user.role === 'student' ? <StudentPage user={user} /> : <AccessDenied role={user.role} />;
      case 'lecturer':
        return user.role === 'lecturer' ? <LecturerPage user={user} /> : <AccessDenied role={user.role} />;
      case 'prl':
        return user.role === 'prl' ? <PRLPage user={user} /> : <AccessDenied role={user.role} />;
      case 'pl':
        return user.role === 'pl' ? <PLPage user={user} /> : <AccessDenied role={user.role} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>LUCT Faculty Reporting System</h1>
        {isAuthenticated && (
          <div className="user-info">
            <span>Welcome, {user.username} ({user.role})</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        )}
      </header>

      <Navbar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        userRole={user?.role} 
        isAuthenticated={isAuthenticated}
      />
      
      <main className="main-content">
        {renderModule()}
      </main>

      <footer className="App-footer">
        <p>LUCT Faculty Reporting System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

// Access Denied Component
const AccessDenied = ({ role }) => (
  <div className="access-denied">
    <h2>Access Denied</h2>
    <p>You don't have permission to access this page as a {role}.</p>
    <p>Please contact your administrator if you believe this is an error.</p>
  </div>
);

export default App;