import Shortlist from '../../models/shortlist.model.js';

export const addShortlist = async (userId, targetId) => {
  return Shortlist.create({
    userId,
    shortlistedUserId: targetId
  });
};

export const removeShortlist = async (id, userId) => {
  return Shortlist.destroy({
    where: { id, userId }
  });
};

export const getShortlists = async (userId) => {
  return Shortlist.findAll({
    where: { userId }
  });
};
