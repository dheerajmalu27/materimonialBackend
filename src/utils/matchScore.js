export const calculateMatchScore = (user, preference) => {
  let score = 0;

  if (user.education?.qualification === preference.education) score += 20;
  if (user.profile.motherTongue === preference.mother_tongue) score += 10;
  if (user.profile.heightCm >= preference.min_height_cm &&
      user.profile.heightCm <= preference.max_height_cm) score += 10;

  if (user.addresses?.city === preference.city) score += 15;

  score += user.profileCompletion * 0.2; // 20%

  return score;
};
