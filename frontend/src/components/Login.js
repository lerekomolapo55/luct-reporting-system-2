import React, { useState } from 'react';
import apiService from '../services/api';

const Login = ({ onLogin, requestedModule }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'student'
  });

  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'student',
    faculty: '',
    stream: '',
    programType: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Login attempt:', credentials);
      
      // For all roles, pass programType to ensure proper data filtering
      const loginData = { 
        ...credentials,
        // Set default values for other fields
        faculty: (credentials.role === 'lecturer' || credentials.role === 'prl') ? (credentials.faculty || '') : '',
        programType: ''
      };
      
      console.log('Sending login data:', loginData);
      
      // Use the API service for login
      const response = await apiService.login(loginData);
      
      if (response.success) {
        console.log('Login successful:', response.user);
        onLogin(response.user);
      } else {
        setError(response.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!registerData.username || !registerData.email || !registerData.password) {
        setError('Please fill in all required fields.');
        return;
      }

      if (registerData.password !== registerData.confirmPassword) {
        setError('Passwords do not match!');
        return;
      }

      if (registerData.password.length < 4) {
        setError('Password must be at least 4 characters long!');
        return;
      }

      // Validate required fields based on role
      if ((registerData.role === 'lecturer' || registerData.role === 'prl') && !registerData.faculty) {
        setError('Faculty is required for Lecturers and PRLs!');
        return;
      }

      console.log('Registration attempt:', registerData);

      // Call register API
      const response = await apiService.register(registerData);
      
      console.log('Registration response:', response);
      
      if (response.success) {
        alert('Registration successful! Please login with your credentials.');
        setIsRegister(false); // Switch back to login
        setRegisterData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          role: 'student',
          faculty: '',
          stream: '',
          programType: ''
        });
        setError('');
      } else {
        setError(response.error || response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  // Add some basic CSS for error message
  const errorStyle = {
    color: 'red',
    backgroundColor: '#ffe6e6',
    padding: '10px',
    borderRadius: '5px',
    margin: '10px 0',
    border: '1px solid #ffcccc'
  };

  const loginContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  };

  const loginFormStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  };

  const formGroupStyle = {
    marginBottom: '1rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer'
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#007bff',
    textDecoration: 'underline',
    cursor: 'pointer'
  };

  if (isRegister) {
    return (
      <div style={loginContainerStyle}>
        <div style={loginFormStyle}>
          <h2>Register</h2>
          <p>Create a new account to access the system.</p>
          
          {error && <div style={errorStyle}>{error}</div>}
          
          <form onSubmit={handleRegister}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
                placeholder="Enter your full name"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                placeholder="Enter your email"
                style={inputStyle}
              />
            </div>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Password *</label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                placeholder="Enter your password (min. 4 characters)"
                minLength="4"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
                placeholder="Confirm your password"
                minLength="4"
                style={inputStyle}
              />
            </div>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>Role *</label>
              <select
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
                required
                style={inputStyle}
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="prl">Principal Lecturer (PRL)</option>
                <option value="pl">Program Leader (PL)</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Program Type *</label>
              <select
                name="programType"
                value={registerData.programType}
                onChange={handleRegisterChange}
                required
                style={inputStyle}
              >
                <option value="degree">Degree</option>
                <option value="diploma">Diploma</option>
              </select>
            </div>
            
            {/* Faculty input for Lecturers and PRL */}
            {(registerData.role === 'lecturer' || registerData.role === 'prl') && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Faculty *</label>
                <select
                  name="faculty"
                  value={registerData.faculty}
                  onChange={handleRegisterChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Select Faculty</option>
                  <option value="FICT">FICT - Faculty of Information & Communication Technology</option>
                  <option value="FABE">FABE - Faculty of Architecture & Built Environment</option>
                  <option value="FCMB">FCMB - Faculty of Computing & Multimedia</option>
                  <option value="FDI">FDI - Faculty of Design & Innovation</option>
                  <option value="FBMG">FBMG - Faculty of Business Management</option>
                </select>
              </div>
            )}
            
            {/* Stream input for PRL and PL */}
            {(registerData.role === 'prl' || registerData.role === 'pl') && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Stream *</label>
                <select
                  name="stream"
                  value={registerData.stream}
                  onChange={handleRegisterChange}
                  required
                  style={inputStyle}
                >
                  <option value="IT">Information Technology</option>
                  <option value="IS">Information Systems</option>
                  <option value="CS">Computer Science</option>
                  <option value="SE">Software Engineering</option>
                </select>
              </div>
            )}
            
            
            <button 
              type="submit" 
              style={loading ? buttonDisabledStyle : buttonStyle}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Account'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p>Already have an account? 
                <button 
                  type="button" 
                  style={linkButtonStyle} 
                  onClick={toggleMode}
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={loginContainerStyle}>
      <div style={loginFormStyle}>
        <h2>Login</h2>
        <p>
          {requestedModule ? `You need to login to access the ${requestedModule} module.` : 'Please login to continue.'}
        </p>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Username/Email *</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username or email"
              style={inputStyle}
            />
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              style={inputStyle}
            />
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Role *</label>
            <select
              name="role"
              value={credentials.role}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="prl">Principal Lecturer (PRL)</option>
              <option value="pl">Program Leader (PL)</option>
            </select>
          </div>
          
          {/* Faculty input for Lecturers and PRL */}
          {(credentials.role === 'lecturer' || credentials.role === 'prl') && (
            <div style={formGroupStyle}>
              <label style={labelStyle}>Faculty *</label>
              <input
                type="text"
                name="faculty"
                value={credentials.faculty || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter your faculty"
                style={inputStyle}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            style={loading ? buttonDisabledStyle : buttonStyle}
            disabled={loading}
          >
            {loading ? 'Logging in...' : credentials.role === 'student' 
              ? 'Login as Student'
              : credentials.role === 'lecturer'
              ? 'Login as Lecturer'
              : credentials.role === 'prl'
              ? 'Login as Principal Lecturer'
              : 'Login as Program Leader'
            }
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p>Don't have an account? 
              <button 
                type="button" 
                style={linkButtonStyle} 
                onClick={toggleMode}
              >
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;