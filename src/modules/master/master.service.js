export const getReligions = async () => {
  return [
    { id: 'hindu', name: 'Hindu' },
    { id: 'muslim', name: 'Muslim' },
    { id: 'christian', name: 'Christian' },
    { id: 'sikh', name: 'Sikh' },
    { id: 'jain', name: 'Jain' },
    { id: 'buddhist', name: 'Buddhist' },
    { id: 'other', name: 'Other' }
  ];
};

export const getCastes = async () => {
  return [
    { id: 'brahmin', name: 'Brahmin' },
    { id: 'kayasth', name: 'Kayasth' },
    { id: 'patel', name: 'Patel' },
    { id: 'gupta', name: 'Gupta' },
    { id: 'jat', name: 'Jat' },
    { id: 'other', name: 'Other' }
  ];
};

export const getEducationLevels = async () => {
  return [
    { id: 'high_school', name: 'High School' },
    { id: 'bachelors', name: 'Bachelor\'s Degree' },
    { id: 'masters', name: 'Master\'s Degree' },
    { id: 'phd', name: 'PhD' },
    { id: 'diploma', name: 'Diploma' },
    { id: 'other', name: 'Other' }
  ];
};

export const getOccupations = async () => {
  return [
    { id: 'engineer', name: 'Engineer' },
    { id: 'doctor', name: 'Doctor' },
    { id: 'teacher', name: 'Teacher' },
    { id: 'business_owner', name: 'Business Owner' },
    { id: 'designer', name: 'Designer' },
    { id: 'other', name: 'Other' }
  ];
};

export const getIncomeRanges = async () => {
  return [
    { id: 'under_3l', name: 'Under ₹3,00,000' },
    { id: '3l_to_5l', name: '₹3,00,000 - ₹5,00,000' },
    { id: '5l_to_8l', name: '₹5,00,000 - ₹8,00,000' },
    { id: '8l_to_12l', name: '₹8,00,000 - ₹12,00,000' },
    { id: '12l_to_20l', name: '₹12,00,000 - ₹20,00,000' },
    { id: 'above_20l', name: 'Above ₹20,00,000' }
  ];
};
