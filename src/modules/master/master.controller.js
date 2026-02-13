import * as masterService from './master.service.js';

/**
 * Get list of available religions for filters
 */
export const getReligions = async (req, res) => {
  try {
    const religions = await masterService.getReligions();
    res.json({
      success: true,
      data: religions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get list of available castes/communities for filters
 */
export const getCastes = async (req, res) => {
  try {
    const castes = await masterService.getCastes();
    res.json({
      success: true,
      data: castes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get list of available education levels for filters
 */
export const getEducationLevels = async (req, res) => {
  try {
    const educationLevels = await masterService.getEducationLevels();
    res.json({
      success: true,
      data: educationLevels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get list of available occupations for filters
 */
export const getOccupations = async (req, res) => {
  try {
    const occupations = await masterService.getOccupations();
    res.json({
      success: true,
      data: occupations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get list of available income ranges for filters
 */
export const getIncomeRanges = async (req, res) => {
  try {
    const incomeRanges = await masterService.getIncomeRanges();
    res.json({
      success: true,
      data: incomeRanges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
