const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('student', 'lecturer', 'prl', 'pl'),
    allowNull: false
  },
  facultyName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  className: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  weekOfReporting: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dateOfLecture: {
    type: DataTypes.DATE,
    allowNull: true
  },
  courseName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  courseCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lecturerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  actualStudentsPresent: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  totalRegisteredStudents: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  venue: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  scheduledTime: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  topicTaught: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  learningOutcomes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  challenges: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  studentName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  coursesTaught: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  plFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'approved', 'completed'),
    defaultValue: 'pending'
  },
  stream: {
    type: DataTypes.ENUM('IT', 'IS', 'CS', 'SE'),
    allowNull: true
  },
  programType: {
    type: DataTypes.ENUM('diploma', 'degree'),
    allowNull: true
  },
  isPRLReport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRating: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isSubmittedToPL: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  submittedToPLDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Report;