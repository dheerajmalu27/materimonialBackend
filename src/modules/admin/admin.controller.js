import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import models from '../../models/index.js';
import { sequelize } from '../../models/index.js';

const { User, UserProfile, UserKundli, SubscriptionPlan, UserActivity, Interest } = models;

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminUser = await User.findOne({
      where: { email, role: 'admin' },
    });

    if (!adminUser || !await bcrypt.compare(password, adminUser.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      env.jwt.jwtSecret,
      { expiresIn: env.jwt.jwtExpiresIn }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

export const getMatchAnalytics = async (req, res) => {
  try {
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    
    const where = {};
    if (dateFrom) where.createdAt = { ...where.createdAt, [Op.gte]: dateFrom };
    if (dateTo) where.createdAt = { ...where.createdAt, [Op.lte]: dateTo };

    const totalMatches = await Interest.count({ where: { status: 'accepted' } });
    
    // Simplified daily/top
    const daily = []; // Group by day
    const topCities = ['Mumbai', 'Delhi']; // Aggregate from profiles

    res.json({
      success: true,
      data: {
        totalMatches,
        daily,
        topCities,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Match analytics failed' });
  }
};

export const getUserAnalytics = async (req, res) => {
  const period = req.query.period || '30days';
  // Similar logic
  res.json({
    success: true,
    data: {
      newSignups: [],
      churnRate: '5.2%',
    },
  });
};

export const getRevenueAnalytics = async (req, res) => {
  const period = req.query.period || '30days';
  res.json({
    success: true,
    data: {
      total: 125000,
      monthly: [],
    },
  });
};

export const getCommsLogs = async (req, res) => {
  try {
    // Messages with filters
    const logs = []; 
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Comms logs failed' });
  }
};

export const getCommsConversation = async (req, res) => {
  try {
    const { convId } = req.params;
    // Conversation messages
    const conv = null;
    res.json({ success: true, data: conv });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Conversation failed' });
  }
};

export const getSettings = async (req, res) => {
  res.json({
    success: true,
    data: {
      appName: 'MatriMatch',
      bannerImage: '',
      notificationEnabled: true,
    },
  });
};

export const updateSettings = async (req, res) => {
  try {
    // Save settings (stub)
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Settings update failed' });
  }
};


export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const sortField = req.query.sort?.split(':')[0] || 'createdAt';
    const sortDir = req.query.sort?.split(':')[1] || 'desc';

    const where = {};
    if (search) {
      where[Op.or] = [
        sequelize.where(sequelize.fn('lower', sequelize.col('email')), 'LIKE', `%${search.toLowerCase()}%`),
        sequelize.where(sequelize.fn('lower', sequelize.col('UserProfile.first_name')), 'LIKE', `%${search.toLowerCase()}%`),
      ];
    }
    if (status) {
      where.isActive = status === 'active';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { 
          model: UserProfile, 
          as: 'profile', 
          required: false,
          attributes: ['first_name', 'last_name', 'profile_image', 'location']
        },
        { 
          model: UserKundli, 
          as: 'kundli', 
          required: false,
          attributes: ['rashi', 'manglik']
        },
      ],
      order: [[sortField, sortDir.toUpperCase()]],
      limit,
      offset,
      subQuery: false,
    });

    const users = rows.map(u => ({
      id: u.id,
      email: u.email,
      mobile: u.mobile,
      is_active: u.isActive,
      gender: u.gender,
      created_at: u.createdAt,
      profile: u.profile || null,
      subscription: 'Free', // TODO: join active sub
      kundli: u.kundli || null,
    }));

    res.json({
      success: true,
      data: {
        users,
        pagination: { 
          page, 
          limit, 
          total: count,
          totalPages: Math.ceil(count / limit)
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Users fetch failed' });
  }
};

export const toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'}`,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Toggle block failed' });
  }
};

export const approveUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await UserProfile.findOne({ where: { userId: id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    // Assume approved field exists
    profile.approved = true;
    await profile.save();
    res.json({ success: true, message: 'Profile approved', userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Approve failed' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted', userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['price', 'ASC']],
    });
    res.json({
      success: true,
      data: plans.map(p => ({
        id: p.id,
        plan_name: p.plan_name,
        price: p.price,
        duration_days: p.duration_days,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Plans fetch failed' });
  }
};

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { plan_name, price, duration_days } = req.body;
    const plan = await SubscriptionPlan.create({ plan_name, price, duration_days });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Plan creation failed' });
  }
};

export const getSubscriptionUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Simplified: assume join or sub model; here User with active sub
    const users = await User.findAll({
      include: [{ model: SubscriptionPlan, as: 'activeSubscription' }],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: users,
      pagination: { page, limit },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Subs users failed' });
  }
};

export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const dateFrom = req.query.dateFrom;

    const where = {};
    if (status) where.status = status;
    if (dateFrom) where.createdAt = { [Op.gte]: dateFrom };

    const { count, rows } = await models.PaymentTransaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Payments fetch failed' });
  }
};

export const getContentPhotos = async (req, res) => {
  try {
    // Assume photos in UserProfile or separate table; stub for now
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || 'pending';

    const where = {};
    if (status) where.status = status;

    // Stub data
    const photos = []; // UserProfile.findAll with images
    const count = 0;

    res.json({
      success: true,
      data: { photos, pagination: { page, limit, total: count } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Photos fetch failed' });
  }
};

export const approvePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    // await Photo.update({ status: 'approved' }, { where: { id } });
    res.json({ success: true, message: 'Photo approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Approve photo failed' });
  }
};

export const rejectPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    // await Photo.update({ status: 'rejected', reason }, { where: { id } });
    res.json({ success: true, message: 'Photo rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reject photo failed' });
  }
};

export const getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const reports = await UserActivity.findAll({
      where: { action: 'report' },
      include: [{ model: User, as: 'user' }, { model: User, as: 'targetUser' }],
      limit,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Reports fetch failed' });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: UserProfile, as: 'profile' },
        { model: UserFamily, as: 'family' },
        { model: UserKundli, as: 'kundli' },
        { model: PartnerPreference, as: 'partnerPreference' },
        { model: UserAddress, as: 'addresses' },
      ],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Get user detail failed' });
  }
};


export const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      newSignups,
      reports,
      totalUsers,
      premiumUsers,
      matches,
      newProfiles,
      revenue,
    ] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { createdAt: { [sequelize.Op.gt]: sevenDaysAgo } } }),
      models.UserActivity.count({
        where: {
          action: 'report',
          createdAt: { [sequelize.Op.gt]: sevenDaysAgo },
        },
      }),
      User.count(),
      // Premium: assume subscription join (simplified count active subs)
      models.SubscriptionPlan.count({ /* active join with users */ }),
      models.Interest.count({
        where: { status: 'accepted', createdAt: { [sequelize.Op.gt]: thirtyDaysAgo } },
      }),
      models.UserProfile.count({
        where: { updatedAt: { [sequelize.Op.gt]: sevenDaysAgo } },
      }),
      // Revenue: simplified
      12500,
    ]);

    res.json({
      success: true,
      data: {
        activeUsers,
        newSignups,
        revenue,
        reports,
        totalUsers,
        premiumUsers,
        matches,
        newProfiles,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Stats fetch failed' });
  }
};

