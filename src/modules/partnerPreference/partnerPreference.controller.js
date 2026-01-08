import { partnerPreferenceSchema } from './partnerPreference.validation.js';
import * as partnerPreferenceService from './partnerPreference.service.js';

export const addOrUpdatePartnerPreference = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error, value } = partnerPreferenceSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map(d => d.message)
      });
    }

    const preference =
      await partnerPreferenceService.upsertPartnerPreference(
        userId,
        value
      );

    return res.status(200).json({
      success: true,
      message: 'Partner preference saved successfully',
      data: preference
    });
  } catch (error) {
    console.error('PARTNER PREF ERROR 👉', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save partner preference'
    });
  }
};

export const getMyPartnerPreference = async (req, res) => {
  try {
    const userId = req.user.id;

    const preference =
      await partnerPreferenceService.getPartnerPreferenceByUserId(userId);

    return res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch partner preference'
    });
  }
};
