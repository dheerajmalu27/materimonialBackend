// Default website settings templates used for onboarding and subscription upgrades.
// Note: premium/feature flags must be driven by backend subscription state.

export const defaultWebsiteSettingsByPlan = {
  free: {
    privacy: {
      showOnlineStatus: true,
      showContactDetails: false,
      hideFromSearchEngines: true,
      allowRecommendations: true,
      profileVisibilityLevel: 'standard',
      hideLastSeen: false,
      blurPhotosForNonPremium: false,
    },
    notifications: {
      newInterest: true,
      messages: true,
      profileViews: true,
      matches: true,
      marketingEmails: false,
      whatsapp: false,
      push: true,
      sms: false,
      frequency: 'daily',
      quietHoursEnabled: true,
      quietFrom: '22:00',
      quietTo: '07:00',
    },
    security: {
      twoFactorEnabled: false,
      loginNotifications: true,
    },
    profileVisibility: {
      activePaused: 'active',
      incognitoMode: false,
      featuredBoost: false,
      showPremiumBadge: false,
      displayHoroscope: true,
    },
    billing: {
      currentPlan: 'free',
      renewalDate: null,
      premiumBenefits: [],
      paymentMethods: [],
      billingHistory: [],
    },
    verification: {
      mobileVerified: false,
      emailVerified: false,
      aadhaarVerified: false,
      photoVerified: false,
      incomeVerified: false,
    },
  },

  premium: {
    privacy: {
      showOnlineStatus: true,
      showContactDetails: true,
      hideFromSearchEngines: true,
      allowRecommendations: true,
      profileVisibilityLevel: 'premium',
      hideLastSeen: true,
      blurPhotosForNonPremium: true,
    },
    notifications: {
      newInterest: true,
      messages: true,
      profileViews: true,
      matches: true,
      marketingEmails: false,
      whatsapp: true,
      push: true,
      sms: true,
      frequency: 'instant',
      quietHoursEnabled: true,
      quietFrom: '22:00',
      quietTo: '07:00',
    },
    security: {
      twoFactorEnabled: true,
      loginNotifications: true,
    },
    profileVisibility: {
      activePaused: 'active',
      incognitoMode: true,
      featuredBoost: true,
      showPremiumBadge: true,
      displayHoroscope: true,
    },
    billing: {
      currentPlan: 'premium',
      renewalDate: null,
      premiumBenefits: [
        'Unlimited Chats',
        'See Contact Details',
        'Profile Boost',
        'Incognito Mode',
        'Priority Listing',
      ],
      paymentMethods: [],
      billingHistory: [],
    },
    verification: {
      mobileVerified: true,
      emailVerified: true,
      aadhaarVerified: false,
      photoVerified: false,
      incomeVerified: false,
    },
  },
};

export const deepMerge = (base, override) => {
  if (Array.isArray(base) || Array.isArray(override)) return override;
  if (base === null || typeof base !== 'object') return override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    out[k] = deepMerge(out[k], v);
  }
  return out;
};

