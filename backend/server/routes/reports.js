const express = require('express');
const Report = require('../models/Report');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all reports with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, stream, programType, status } = req.query;
    const whereClause = {};
    
    if (type) whereClause.type = type;
    if (stream) whereClause.stream = stream;
    if (programType) whereClause.programType = programType;
    if (status) whereClause.status = status;

    const reports = await Report.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Get reports by type
router.get('/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const reports = await Report.findAll({
      where: { type },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Get PRL reports by stream
router.get('/prl/:stream', authenticateToken, async (req, res) => {
  try {
    const { stream } = req.params;
    const reports = await Report.findAll({
      where: { stream },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PRL reports',
      error: error.message
    });
  }
});

// Get PL reports by program type
router.get('/pl/:programType', authenticateToken, async (req, res) => {
  try {
    const { programType } = req.params;
    const reports = await Report.findAll({
      where: { programType },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PL reports',
      error: error.message
    });
  }
});

// Create new report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const report = await Report.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
});

// Update report
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    await report.update(req.body);
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
});

// Add feedback to report (PRL/PL)
router.post('/:id/feedback', authenticateToken, authorizeRoles('prl', 'pl', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, plFeedback } = req.body;
    
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    const updateData = {};
    if (req.user.role === 'prl') {
      updateData.feedback = feedback;
      updateData.status = 'reviewed';
    } else if (req.user.role === 'pl') {
      updateData.plFeedback = plFeedback || feedback;
      updateData.status = 'approved';
    }
    
    await report.update(updateData);
    
    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding feedback',
      error: error.message
    });
  }
});

// Delete report
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    await report.destroy();
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
});

module.exports = router;