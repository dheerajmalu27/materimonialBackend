import * as matchService from './match.service.js';

export const getMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await matchService.getMutualMatches(userId);

    return res.json({
      success: true,
      data: {
        matches: matches,
        totalCount: matches.length,
        hasMore: false
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPotentialMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const city = req.query.city;

    const result = await matchService.getMatchSuggestions(userId, req.user.gender, limit, offset, city);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const likeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetUserId = req.params.userId;

    const result = await matchService.likeProfile(userId, targetUserId);

    return res.json({
      success: true,
      message: "Profile liked successfully",
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const dislikeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetUserId = req.params.userId;

    await matchService.dislikeProfile(userId, targetUserId);

    return res.json({
      success: true,
      message: "Profile disliked successfully",
      data: {
        dislikedUserId: targetUserId
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMatchDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileUserId = req.params.userId;

    const matchDetails = await matchService.getMatchDetails(userId, profileUserId);

    return res.json({
      success: true,
      data: matchDetails
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
