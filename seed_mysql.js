// seed_mysql.js
// Seed script for MySQL (and any Sequelize-supported database)
// Usage: node seed_mysql.js

import { sequelize } from './src/config/database.js';
import models from './src/models/index.js';

const {
  User, UserProfile, UserAddress, UserEducation, UserFamily,
  UserLifestyle, UserProfession, UserKundli, PartnerPreference,
  UserActivity, UserPushToken, UserOtp, Interest, Shortlist,
  ProfileView, BlockedUser, Conversation, Message, SubscriptionPlan
} = models;

const PASSWORD_HASH = '$2b$10$o2sVN1OTStdQ7ss8yreJS.05u7CZzXsLSErfOOSLClDJm7p2d9p4a';

const runId = Date.now().toString();

const cities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Delhi', state: 'Delhi NCR' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' }
];

const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh'];
const castes = ['Brahmin', 'Rajput', 'General', 'Yadav', 'Aggarwal', 'Other'];
const motherTongues = ['Hindi', 'English', 'Gujarati', 'Marathi', 'Punjabi'];
const educations = ["Bachelor's Degree", "Master's Degree", 'Diploma', 'Doctorate/PhD', 'Professional Degree (CA/CS/CMA)'];
const occupations = ['Software Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Banker', 'Designer', 'Manager'];
const incomes = ['₹3-4 Lakh', '₹5-7 Lakh', '₹7-10 Lakh', '₹10-15 Lakh', '₹15-20 Lakh', '₹20-25 Lakh'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Gupta', 'Verma'];
const maleNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan'];
const femaleNames = ['Anaya', 'Diya', 'Saanvi', 'Aadhya', 'Navya', 'Anvi', 'Pari', 'Kavya', 'Sara', 'Myra'];

async function seed() {
  try {
    console.log('Starting database seed...');

    await Message.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });
    await BlockedUser.destroy({ where: {}, force: true });
    await ProfileView.destroy({ where: {}, force: true });
    await Shortlist.destroy({ where: {}, force: true });
    await Interest.destroy({ where: {}, force: true });
    await UserOtp.destroy({ where: {}, force: true });
    await UserPushToken.destroy({ where: {}, force: true });
    await UserActivity.destroy({ where: {}, force: true });
    await PartnerPreference.destroy({ where: {}, force: true });
    await UserKundli.destroy({ where: {}, force: true });
    await UserLifestyle.destroy({ where: {}, force: true });
    await UserFamily.destroy({ where: {}, force: true });
    await UserProfession.destroy({ where: {}, force: true });
    await UserEducation.destroy({ where: {}, force: true });
    await UserAddress.destroy({ where: {}, force: true });
    await UserProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });

console.log('Seeding subscription plans...');
    const premiumFeatures = {
      basicMessaging: true,
      videoCall: true,
      limitedSearch: false,
      advancedSearch: true,
      verifiedBadge: true,
      unlimitedInterests: true,
      dailyInterestsLimit: null,
      dailyMessagesLimit: null,
    };
    await SubscriptionPlan.bulkCreate([
      { planName: 'free', price: 0, durationDays: 3650, features: null },
      { planName: 'premium', price: 1200, durationDays: 365, features: premiumFeatures },
      { planName: 'diamond_3year', price: 2500, durationDays: 1095, features: premiumFeatures }
    ]);

    console.log('Creating 100 dummy users...');
    const users = [];

    for (let i = 1; i <= 50; i++) {
      const cityData = cities[i % cities.length];
      const email = i <= 2
        ? (i === 1 ? 'seed.male@matrimony.com' : 'seed.male.premium@matrimony.com')
        : `dummy.male.${String(i).padStart(2, '0')}.${runId}@matrimony.com`;
      const mobile = i <= 2
        ? (i === 1 ? '9000000001' : '9000000003')
        : `8${runId.slice(0, 3)}${String(i).padStart(6, '0')}`;

      const user = await User.create({ email, mobile, passwordHash: PASSWORD_HASH, gender: 'male', isActive: true });
      const seq = i;

      await UserProfile.create({
        userId: user.id,
        firstName: maleNames[seq % maleNames.length],
        lastName: lastNames[seq % lastNames.length],
        dob: new Date(new Date().getFullYear() - (22 + (seq % 10)), 0, 1 + (seq % 25)).toISOString().split('T')[0],
        birthTime: `${String(6 + (seq % 12)).padStart(2, '0')}:00:00`,
        heightCm: 165 + (seq % 18),
        weightKg: 60 + (seq % 20),
        maritalStatus: seq % 4 === 0 ? 'Divorced' : 'Never Married',
        religion: religions[seq % 4],
        caste: castes[seq % 6],
        motherTongue: motherTongues[seq % 5],
        aboutMe: `Hello! I am dummy male profile #${seq} created for application QA testing.`,
        occupation: occupations[seq % 7],
        location: `${cityData.city} - ${cityData.state}`,
        education: educations[seq % 5],
        income: incomes[seq % 6],
        phone: mobile,
        profileImage: `https://picsum.photos/seed/u${user.id}/400/400`,
        profileImages: JSON.stringify([`https://picsum.photos/seed/u${user.id}a/400/400`, `https://picsum.photos/seed/u${user.id}b/400/400`]),
        isOnline: false
      });

      await UserAddress.create({ userId: user.id, addressType: 'both', city: cityData.city, state: cityData.state, country: 'India', pincode: String(100000 + seq).padStart(6, '0') });
      await UserEducation.create({ userId: user.id, qualification: ['B.Tech', 'MBA', 'MBBS', 'B.Com', 'MCA'][seq % 5], college: `Dummy College ${seq}`, university: ['Delhi University', 'Mumbai University', 'Pune University', 'Bangalore University'][seq % 4], passingYear: 2012 + (seq % 11), highest: true });
      await UserProfession.create({ userId: user.id, occupationType: occupations[seq % 6], designation: ['Senior Engineer', 'Consultant', 'Professor', 'Founder', 'Team Lead', 'Specialist'][seq % 6], companyOrBusiness: `Dummy Company ${seq}`, annualIncome: incomes[seq % 6], currency: 'INR', workingCountry: 'India' });
      await UserFamily.create({ userId: user.id, fatherName: `Father ${seq}`, fatherOccupation: seq % 2 === 0 ? 'Business Owner' : 'Government Employee', fatherCompanyOrBusiness: `Family Business ${seq}`, motherName: `Mother ${seq}`, motherOccupation: seq % 3 === 0 ? 'Teacher' : 'Homemaker', familyType: seq % 2 === 0 ? 'Nuclear' : 'Joint', siblings: seq % 4, familyValues: seq % 2 === 0 ? 'Traditional' : 'Moderate', familyStatus: seq % 3 === 0 ? 'Upper Middle Class' : 'Middle Class', familyNativePlace: JSON.stringify({ siblings: String(seq % 4), familyValues: seq % 2 === 0 ? 'Traditional' : 'Moderate', familyStatus: seq % 3 === 0 ? 'Upper Middle Class' : 'Middle Class' }) });
      await UserLifestyle.create({ userId: user.id, diet: ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'][seq % 4], smoking: seq % 5 === 0 ? 'Occasionally' : 'No', drinking: seq % 4 === 0 ? 'Occasionally' : 'No', hobbies: 'Reading,Traveling,Music,Fitness', interests: 'Technology,Sports,Travel,Movies' });
      await UserKundli.create({ userId: user.id, dob: new Date(new Date().getFullYear() - (22 + (seq % 10)), 0, 1 + (seq % 25)).toISOString().split('T')[0], birthTime: `${String(5 + (seq % 12)).padStart(2, '0')}:30:00`, birthPlace: cities[seq % 5].city, moonSign: ['Aries', 'Taurus', 'Gemini', 'Cancer'][seq % 4], nakshatra: ['Ashwini', 'Bharani', 'Rohini', 'Hasta', 'Swati'][seq % 5], manglik: seq % 2 === 0, gotra: seq % 2 === 0 ? 'Kashyap' : 'Bharadwaj', rashi: ['Mesh', 'Vrishabh', 'Mithun', 'Kark'][seq % 4], charan: (seq % 4) + 1, gan: seq % 2 === 0 ? 'Dev' : 'Manushya', nadi: seq % 2 === 0 ? 'Adi' : 'Madhya' });
      await PartnerPreference.create({ userId: user.id, minAge: 21, maxAge: 34, minHeightCm: 150, maxHeightCm: 190, religion: religions[seq % 4], caste: 'General', education: "Bachelor's Degree", occupation: 'Software Engineer', location: 'Mumbai - Maharashtra', incomeRange: '₹5-7 Lakh', motherTongue: 'Hindi', kundliMatchRequired: false, manglikPreference: 'both' });

      users.push({ id: user.id, gender: 'male', seq, email, mobile });
    }

    for (let i = 1; i <= 50; i++) {
      const cityData = cities[i % cities.length];
      const email = i <= 2
        ? (i === 1 ? 'seed.female@matrimony.com' : 'seed.female.premium@matrimony.com')
        : `dummy.female.${String(i).padStart(2, '0')}.${runId}@matrimony.com`;
      const mobile = i <= 2
        ? (i === 1 ? '9000000002' : '9000000004')
        : `7${runId.slice(0, 3)}${String(i).padStart(6, '0')}`;

      const user = await User.create({ email, mobile, passwordHash: PASSWORD_HASH, gender: 'female', isActive: true });
      const seq = i;

      await UserProfile.create({
        userId: user.id,
        firstName: femaleNames[seq % femaleNames.length],
        lastName: lastNames[seq % lastNames.length],
        dob: new Date(new Date().getFullYear() - (22 + (seq % 10)), 0, 1 + (seq % 25)).toISOString().split('T')[0],
        birthTime: `${String(6 + (seq % 12)).padStart(2, '0')}:00:00`,
        heightCm: 150 + (seq % 15),
        weightKg: 48 + (seq % 18),
        maritalStatus: seq % 4 === 0 ? 'Divorced' : 'Never Married',
        religion: religions[seq % 4],
        caste: castes[seq % 6],
        motherTongue: motherTongues[seq % 5],
        aboutMe: `Hello! I am dummy female profile #${seq} created for application QA testing.`,
        occupation: occupations[seq % 7],
        location: `${cityData.city} - ${cityData.state}`,
        education: educations[seq % 5],
        income: incomes[seq % 6],
        phone: mobile,
        profileImage: `https://picsum.photos/seed/u${user.id}/400/400`,
        profileImages: JSON.stringify([`https://picsum.photos/seed/u${user.id}a/400/400`, `https://picsum.photos/seed/u${user.id}b/400/400`]),
        isOnline: false
      });

      await UserAddress.create({ userId: user.id, addressType: 'both', city: cityData.city, state: cityData.state, country: 'India', pincode: String(100000 + seq).padStart(6, '0') });
      await UserEducation.create({ userId: user.id, qualification: ['B.Tech', 'MBA', 'MBBS', 'B.Com', 'MCA'][seq % 5], college: `Dummy College ${seq}`, university: ['Delhi University', 'Mumbai University', 'Pune University', 'Bangalore University'][seq % 4], passingYear: 2012 + (seq % 11), highest: true });
      await UserProfession.create({ userId: user.id, occupationType: occupations[seq % 6], designation: ['Senior Engineer', 'Consultant', 'Professor', 'Founder', 'Team Lead', 'Specialist'][seq % 6], companyOrBusiness: `Dummy Company ${seq}`, annualIncome: incomes[seq % 6], currency: 'INR', workingCountry: 'India' });
      await UserFamily.create({ userId: user.id, fatherName: `Father ${seq}`, fatherOccupation: seq % 2 === 0 ? 'Business Owner' : 'Government Employee', fatherCompanyOrBusiness: `Family Business ${seq}`, motherName: `Mother ${seq}`, motherOccupation: seq % 3 === 0 ? 'Teacher' : 'Homemaker', familyType: seq % 2 === 0 ? 'Nuclear' : 'Joint', siblings: seq % 4, familyValues: seq % 2 === 0 ? 'Traditional' : 'Moderate', familyStatus: seq % 3 === 0 ? 'Upper Middle Class' : 'Middle Class', familyNativePlace: JSON.stringify({ siblings: String(seq % 4), familyValues: seq % 2 === 0 ? 'Traditional' : 'Moderate', familyStatus: seq % 3 === 0 ? 'Upper Middle Class' : 'Middle Class' }) });
      await UserLifestyle.create({ userId: user.id, diet: ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'][seq % 4], smoking: seq % 5 === 0 ? 'Occasionally' : 'No', drinking: seq % 4 === 0 ? 'Occasionally' : 'No', hobbies: 'Reading,Traveling,Music,Fitness', interests: 'Technology,Sports,Travel,Movies' });
      await UserKundli.create({ userId: user.id, dob: new Date(new Date().getFullYear() - (22 + (seq % 10)), 0, 1 + (seq % 25)).toISOString().split('T')[0], birthTime: `${String(5 + (seq % 12)).padStart(2, '0')}:30:00`, birthPlace: cities[seq % 5].city, moonSign: ['Aries', 'Taurus', 'Gemini', 'Cancer'][seq % 4], nakshatra: ['Ashwini', 'Bharani', 'Rohini', 'Hasta', 'Swati'][seq % 5], manglik: seq % 2 === 0, gotra: seq % 2 === 0 ? 'Kashyap' : 'Bharadwaj', rashi: ['Mesh', 'Vrishabh', 'Mithun', 'Kark'][seq % 4], charan: (seq % 4) + 1, gan: seq % 2 === 0 ? 'Dev' : 'Manushya', nadi: seq % 2 === 0 ? 'Adi' : 'Madhya' });
      await PartnerPreference.create({ userId: user.id, minAge: 21, maxAge: 34, minHeightCm: 150, maxHeightCm: 190, religion: religions[seq % 4], caste: 'General', education: "Bachelor's Degree", occupation: 'Software Engineer', location: 'Mumbai - Maharashtra', incomeRange: '₹5-7 Lakh', motherTongue: 'Hindi', kundliMatchRequired: false, manglikPreference: 'both' });

      users.push({ id: user.id, gender: 'female', seq, email, mobile });
    }

    const maleUsers = users.filter(u => u.gender === 'male');
    const femaleUsers = users.filter(u => u.gender === 'female');

    console.log('Seeding user activities...');
    for (const user of users) {
      await UserActivity.create({ userId: user.id, action: 'login', description: 'Dummy login activity', ipAddress: '127.0.0.1', userAgent: 'seed-script/1.0' });
      await UserActivity.create({ userId: user.id, action: 'profile_update', description: 'Dummy profile update activity', ipAddress: '127.0.0.1', userAgent: 'seed-script/1.0' });
    }

    const premiumEmails = ['seed.male.premium@matrimony.com', 'seed.female.premium@matrimony.com'];
    for (const user of users) {
      if (premiumEmails.includes(user.email)) {
        await UserActivity.create({ userId: user.id, action: 'subscription_activated', description: JSON.stringify({ planCode: 'premium_yearly', planName: 'Premium', startedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 365 * 86400000).toISOString() }), ipAddress: '127.0.0.1', userAgent: 'seed-script/1.0' });
      }
    }

    console.log('Seeding push tokens...');
    for (const user of users) {
      await UserPushToken.create({ userId: user.id, fcmToken: `dummy-fcm-token-${user.id}-${runId}` });
    }

    console.log('Seeding OTPs...');
    for (const user of users) {
      await UserOtp.create({ userId: user.id, otp: String((100000 + user.seq) % 999999).padStart(6, '0'), type: 'login', expiresAt: new Date(Date.now() + 15 * 60 * 1000), isUsed: false });
    }

    console.log('Seeding interests...');
    const interestStatuses = ['accepted', 'sent', 'pending'];
    for (let i = 0; i < Math.min(40, maleUsers.length, femaleUsers.length); i++) {
      await Interest.create({ senderId: maleUsers[i].id, receiverId: femaleUsers[i].id, status: interestStatuses[i % 3], message: `Hi from dummy male #${i + 1}` });
    }

    console.log('Seeding shortlists...');
    for (let i = 0; i < Math.min(30, maleUsers.length, femaleUsers.length); i++) {
      await Shortlist.create({ userId: maleUsers[i].id, shortlistedUserId: femaleUsers[i].id });
    }
    for (let i = 0; i < Math.min(20, maleUsers.length, femaleUsers.length); i++) {
      await Shortlist.create({ userId: femaleUsers[i].id, shortlistedUserId: maleUsers[i].id });
    }

    console.log('Seeding profile views...');
    for (let i = 0; i < Math.min(maleUsers.length, femaleUsers.length); i++) {
      await ProfileView.create({ viewerId: maleUsers[i].id, viewedUserId: femaleUsers[i].id, viewedAt: new Date(Date.now() - i * 3600000) });
      await ProfileView.create({ viewerId: femaleUsers[i].id, viewedUserId: maleUsers[i].id, viewedAt: new Date(Date.now() - i * 3600000) });
    }

    console.log('Seeding blocked users...');
    for (let i = 0; i < Math.min(5, maleUsers.length, femaleUsers.length); i++) {
      await BlockedUser.create({ userId: maleUsers[i].id, blockedUserId: femaleUsers[i].id, blockedAt: new Date(Date.now() - 86400000) });
    }

    console.log('Seeding conversations...');
    for (let i = 0; i < Math.min(15, maleUsers.length, femaleUsers.length); i++) {
      const conv = await Conversation.create({ user1Id: maleUsers[i].id, user2Id: femaleUsers[i].id });
    }

    console.log('Seed complete!');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Male users: ${maleUsers.length}`);
    console.log(`   Female users: ${femaleUsers.length}`);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
