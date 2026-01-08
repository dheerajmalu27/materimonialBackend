import UserKundli from '../../models/userKundli.model.js';
import { matchKundli } from '../../utils/kundliMatcher.js';

export const checkKundliCompatibility = async (userId, targetUserId) => {
  const userKundli = await UserKundli.findOne({ where: { userId } });
  const targetKundli = await UserKundli.findOne({ where: { userId: targetUserId } });

  if (!userKundli || !targetKundli) {
    return { applicable: false };
  }

  const result = matchKundli(userKundli, targetKundli);

  return {
    applicable: true,
    ...result
  };
};
