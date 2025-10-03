const express = require('express');
const Course = require('../models/Course');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Get courses by stream
router.get('/stream/:stream', authenticateToken, async (req, res) => {
  try {
    const { stream } = req.params;
    const courses = await Course.findAll({
      where: { stream },
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Create new course (Admin/PL only)
router.post('/', authenticateToken, authorizeRoles('admin', 'pl'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// Update course
router.put('/:id', authenticateToken, authorizeRoles('admin', 'pl'), async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    await course.update(req.body);
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// Delete course
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'pl'), async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    await course.destroy();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

module.exports = router;