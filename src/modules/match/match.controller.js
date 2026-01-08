import * as matchService from './match.service.js';

export const getMatches = async (req, res) => {
  try {
    console.log(req.user);
    const userId = req.user.id;
    const gender = req.user.gender;

    const matches = await matchService.getMatchSuggestions(userId,gender);

    return res.json({
      success: true,
      total: matches.length,
      data: matches
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
