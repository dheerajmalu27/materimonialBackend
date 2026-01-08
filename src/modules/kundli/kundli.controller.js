import * as kundliService from './kundli.service.js';

export const checkMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    const result = await kundliService.checkKundliCompatibility(
      userId,
      targetUserId
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
