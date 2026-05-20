import { sequelize } from '../config/database.js';

// Import models
import User from './user.model.js';
import UserProfile from './userProfile.model.js';
import UserAddress from './userAddress.model.js';
import UserEducation from './userEducation.model.js';
import UserFamily from './userFamily.model.js';
import UserLifestyle from './userLifestyle.model.js';
import UserProfession from './userProfession.model.js';
import BlockedUser from './blockedUser.model.js';
import SubscriptionPlan from './subscriptionPlan.model.js';
import UserKundli from './userKundli.model.js';
import PartnerPreference from './partnerPreference.model.js';
import UserActivity from './userActivity.model.js';
import UserOtp from './userOtp.model.js';
import Interest from './interest.model.js';
import ProfileView from './profileView.model.js';
import Shortlist from './shortlist.model.js';
import Conversation from './conversation.model.js';
import Message from './message.model.js';
import UserPushToken from './userPushToken.model.js';
import PaymentTransaction from './paymentTransaction.model.js';
import ProfileViewEvent from './profileViewEvent.model.js';
import ConversationUserState from './conversationUserState.model.js';
import MessageRead from './messageRead.model.js';
import UserSettings from './userSettings.model.js';
import UserVerification from './userVerification.model.js';
import UserVerificationDocument from './userVerificationDocument.model.js';
import UserSubscription from './userSubscription.model.js';

// Initialize models
const models = {
  User: User.init(sequelize),
  UserProfile: UserProfile.init(sequelize),
  UserAddress: UserAddress.init(sequelize),
  UserEducation: UserEducation.init(sequelize),
  BlockedUser: BlockedUser.init(sequelize),
  SubscriptionPlan: SubscriptionPlan.init(sequelize),
  UserKundli: UserKundli.init(sequelize),
  UserLifestyle: UserLifestyle.init(sequelize),
  UserFamily: UserFamily.init(sequelize),
  PartnerPreference: PartnerPreference.init(sequelize),
  UserProfession: UserProfession.init(sequelize),
  UserActivity: UserActivity.init(sequelize),
  UserOtp: UserOtp.init(sequelize),
  Interest: Interest.init(sequelize),
  ProfileView: ProfileView.init(sequelize),
  Shortlist: Shortlist.init(sequelize),
  Conversation: Conversation.init(sequelize),
  Message: Message.init(sequelize),
  UserPushToken: UserPushToken.init(sequelize),
  PaymentTransaction: PaymentTransaction.init(sequelize),
  ProfileViewEvent: ProfileViewEvent.init(sequelize),
  ConversationUserState: ConversationUserState.init(sequelize),
  MessageRead: MessageRead.init(sequelize),
  UserSettings: UserSettings.init(sequelize),
  UserVerification: UserVerification.init(sequelize),
  UserVerificationDocument: UserVerificationDocument.init(sequelize),
  UserSubscription: UserSubscription.init(sequelize),
};


// Setup associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

export { sequelize };
export default models;
