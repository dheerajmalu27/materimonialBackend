import PartnerPreference from '../../models/partnerPreference.model.js';

export const upsertPartnerPreference = async (userId, data) => {
  const existing = await PartnerPreference.findOne({
    where: { userId }
  });

  if (existing) {
    await existing.update(data);
    return existing;
  }

  return await PartnerPreference.create({
    userId,
    ...data
  });
};

export const getPartnerPreferenceByUserId = async (userId) => {
  return await PartnerPreference.findOne({
    where: { userId }
  });
};
