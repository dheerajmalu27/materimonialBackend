export const calculateProfileCompletion = ({
  profile,
  address,
  education
}) => {
  let score = 0;

  const add = (value, weight) => {
    if (value !== null && value !== undefined && value !== '') {
      score += weight;
    }
  };

  // 🧑 Basic Profile (60%)
  add(profile.firstName, 10);
  add(profile.lastName, 5);
  add(profile.dob, 10);
  add(profile.birthTime, 5);
  add(profile.heightCm, 10);
  add(profile.weightKg, 5);
  add(profile.maritalStatus, 10);
  add(profile.profilePhoto, 5);

  // 🏠 Address (15%)
  if (address) {
    add(address.city, 7);
    add(address.state, 4);
    add(address.country, 4);
  }

  // 🎓 Education (15%)
  if (education) {
    add(education.qualification, 5);
    add(education.passingYear, 5);
    add(education.highest, 5);
  }

  // 🙏 Other (10%)
  add(profile.religion, 5);
  add(profile.caste, 5);

  return Math.min(score, 100);
};
