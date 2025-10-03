import React from 'react';

const Navbar = ({ activeModule, setActiveModule, userRole, isAuthenticated }) => {
  const isAuthorized = (module) => {
    // Dashboard is always accessible
    if (module === 'dashboard') return true;
    
    // Other modules require authentication and specific roles
    if (!isAuthenticated) return false;
    
    // Define which roles can access which modules
    const permissions = {
      student: ['student'],
      lecturer: ['lecturer'],
      prl: ['prl'],
      pl: ['pl']
    };
    
    return permissions[module].includes(userRole);
  };

  const handleNavClick = (module) => {
    // Allow dashboard navigation without authentication
    if (module === 'dashboard') {
      setActiveModule(module);
      return;
    }
    
    // For other modules, check if user is authenticated
    if (!isAuthenticated) {
      if (window.confirm('You need to login to access this page. Would you like to login now?')) {
        setActiveModule(module);
      }
      return;
    }
    
    setActiveModule(module);
  };

  return (
    <nav className="main-nav">
      <button 
        className={activeModule === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => handleNavClick('dashboard')}
      >
        Dashboard
      </button>
      
      {isAuthorized('student') ? (
        <button 
          className={activeModule === 'student' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => handleNavClick('student')}
        >
          Student
        </button>
      ) : (
        <button 
          className="nav-btn "
          onClick={() => handleNavClick('student')}
          title={isAuthenticated ? 'Not authorized for your role' : 'Login required'}
        >
          Student
        </button>
      )}
      
      {isAuthorized('lecturer') ? (
        <button 
          className={activeModule === 'lecturer' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => handleNavClick('lecturer')}
        >
          Lecturer
        </button>
      ) : (
        <button 
          className="nav-btn "
          onClick={() => handleNavClick('lecturer')}
          title={isAuthenticated ? 'Not authorized for your role' : 'Login required'}
        >
          Lecturer
        </button>
      )}
      
      {isAuthorized('prl') ? (
        <button 
          className={activeModule === 'prl' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => handleNavClick('prl')}
        >
          Principal Lecturer
        </button>
      ) : (
        <button 
          className="nav-btn "
          onClick={() => handleNavClick('prl')}
          title={isAuthenticated ? 'Not authorized for your role' : 'Login required'}
        >
          Principal Lecturer
        </button>
      )}
      
      {isAuthorized('pl') ? (
        <button 
          className={activeModule === 'pl' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => handleNavClick('pl')}
        >
          Program Leader
        </button>
      ) : (
        <button 
          className="nav-btn "
          onClick={() => handleNavClick('pl')}
          title={isAuthenticated ? 'Not authorized for your role' : 'Login required'}
        >
          Program Leader
        </button>
      )}
    </nav>
  );
};

export default Navbar;