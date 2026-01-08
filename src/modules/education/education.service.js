import UserEducation from '../../models/userEducation.model.js';

export const upsertEducation = async (userId, payload) => {
  const existing = await UserEducation.findOne({
    where: { userId }
  });

  if (existing) {
    await existing.update(payload);
    return existing;
  }

  return await UserEducation.create({
    userId,
    ...payload
  });
};

export const getMyEducation = async (userId) => {
  return await UserEducation.findOne({
    where: { userId }
  });
};
export const deleteMyEducation = async (userId) => {
  const education = await UserEducation.findOne({
    where: { userId }
  });

  if (!education) {
    throw new Error('Education record not found');
  }

  await education.destroy();

  return true;
};
