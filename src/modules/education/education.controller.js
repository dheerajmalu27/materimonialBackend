import { upsertEducation, getMyEducation, deleteMyEducation } from './education.service.js';
import { upsertEducationSchema } from './education.validation.js';

export const saveMyEducation = async (req, res) => {
  try {
    const { error, value } = upsertEducationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const userId = req.user.id;

    const education = await upsertEducation(userId, value);

    return res.json({
      success: true,
      message: 'Education saved successfully',
      data: education
    });
  } catch (error) {
    console.error('EDUCATION SAVE ERROR 👉', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save education'
    });
  }
}

export const getMyEducationController = async (req, res) => {
  try {
    const userId = req.user.id;

    const education = await getMyEducation(userId);

    return res.json({
      success: true,
      data: education
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch education'
    });
  }
}
export const deleteMyEducationController = async (req, res) => {
  try {
    const userId = req.user.id;

    await deleteMyEducation(userId);

    return res.json({
      success: true,
      message: 'Education deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
