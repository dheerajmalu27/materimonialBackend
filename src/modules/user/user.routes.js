import express from 'express';
import * as uc from './user.controller.js';
import { authGuard } from '../../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// multer storage configuration - create user-specific folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'public';
    const uploadPath = path.join(process.cwd(), 'uploads', String(userId));
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

// only allow image files
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadBiodataPdf = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = ext === '.pdf';

    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const uploadBioDataMiddleware = (req, res, next) => {
  uploadBiodataPdf.single('biodata')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Bio-data PDF must be 5 MB or less',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid file upload',
    });
  });
};

const router = express.Router();

/**
 * @swagger
 * /v1/user/me:
 *   get:
 *     summary: Get current user information
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     mobile:
 *                       type: string
 *                       example: "+1234567890"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me', authGuard, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Backward-compatible settings aliases
router.get('/settings', authGuard, uc.getMySettings);
router.put('/settings', authGuard, uc.updateMySettings);

/**
 * @swagger
 * /v1/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     mobile:
 *                       type: string
 *                       example: "+1234567890"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authGuard, uc.getUserById);



/**
 * @swagger
 * /v1/users/profile/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "user_456"
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user_456"
 *                     name:
 *                       type: string
 *                       example: "Jane Smith"
 *                     age:
 *                       type: integer
 *                       example: 26
 *                     location:
 *                       type: string
 *                       example: "Pune, India"
 *                     occupation:
 *                       type: string
 *                       example: "Doctor"
 *                     bio:
 *                       type: string
 *                       example: "Passionate about helping others and finding true love"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     religion:
 *                       type: string
 *                       example: "Hindu"
 *                     caste:
 *                       type: string
 *                       example: "Kayasth"
 *                     height:
 *                       type: string
 *                       example: "5'4\""
 *                     education:
 *                       type: string
 *                       example: "MBBS"
 *                     income:
 *                       type: string
 *                       example: "₹6,00,000 - ₹8,00,000"
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *                     lastActive:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-14T15:30:00Z"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile/:id', authGuard, uc.getUserProfileById);

/**
 * @swagger
 * /v1/user/{id}:
 *   put:
 *     summary: Update user by ID
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     mobile:
 *                       type: string
 *                       example: "+1234567890"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authGuard, uc.updateUserById);

/**
 * @swagger
 * /v1/user/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authGuard, uc.deleteUserById);

/**
 * @swagger
 * /v1/user/me/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     dob:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/profile', authGuard, uc.getMyProfile);

/**
 * @swagger
 * /v1/user/me/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.put('/me/profile', authGuard, uc.updateMyProfile);

/**
 * @swagger
 * /v1/user/me/photos:
 *   post:
 *     summary: Upload one or more profile photos
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["https://example.com/uploads/1/162342345.jpg"]
 *                 profileImage:
 *                   type: string
 *                   example: "https://example.com/uploads/1/162342345.jpg"
 *       400:
 *         description: No files uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/me/photos', authGuard, upload.array('photos', 6), uc.uploadProfilePhotos);

/**
 * @swagger
 * /v1/user/me/biodata:
 *   post:
 *     summary: Upload or replace bio-data PDF (max 5 MB)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               biodata:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bio-data PDF uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bio-data PDF uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bioDataPdf:
 *                       type: string
 *                       example: "https://example.com/uploads/1/1700000000000.pdf"
 *       400:
 *         description: Invalid file, missing file, or file exceeds 5 MB
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/me/biodata', authGuard, uploadBioDataMiddleware, uc.uploadBioDataPdf);

/**
 * @swagger
 * /v1/user/me/biodata:
 *   delete:
 *     summary: Delete current user's bio-data PDF
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bio-data PDF deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bio-data PDF deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bioDataPdf:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No bio-data PDF found
 *       500:
 *         description: Server error
 */
router.delete('/me/biodata', authGuard, uc.deleteBioDataPdf);

/**
 * @swagger
 * /v1/user/me/settings:
 *   get:
 *     summary: Get current user's settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     notifications:
 *                       type: boolean
 *                       example: true
 *                     privacy:
 *                       type: string
 *                       example: "public"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/settings', authGuard, uc.getMySettings);

/**
 * @swagger
 * /v1/user/me/settings:
 *   put:
 *     summary: Update current user's settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: boolean
 *                 example: true
 *               privacy:
 *                 type: string
 *                 enum: [public, private, friends]
 *                 example: "public"
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *                 example: "light"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Settings updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     notifications:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.put('/me/settings', authGuard, uc.updateMySettings);

/**
 * @swagger
 * /v1/user/me/activity:
 *   get:
 *     summary: Get current user's activity log
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 1
 *                   action:
 *                     type: string
 *                     example: "LOGIN"
 *                   description:
 *                     type: string
 *                     example: "User logged in"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/activity', authGuard, uc.getMyActivity);

/**
 * @swagger
 * /v1/user/me/deactivate:
 *   post:
 *     summary: Deactivate current user's account
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deactivated successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/me/deactivate', authGuard, uc.deactivateAccount);

/**
 * @swagger
 * /v1/user/me/reactivate:
 *   post:
 *     summary: Reactivate current user's account
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account reactivated successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/me/reactivate', authGuard, uc.reactivateAccount);

/**
 * @swagger
 * /v1/users/me/homepage:
 *   get:
 *     summary: Get homepage profiles for current user
 *     deprecated: true
 *     description: Returns recently added user profiles that match partner preferences and are in the same city (max 10 results)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Homepage profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Smith"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       height:
 *                         type: integer
 *                         example: 165
 *                       currentCity:
 *                         type: string
 *                         example: "Mumbai"
 *                       currentState:
 *                         type: string
 *                         example: "Maharashtra"
 *                       education:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           degree:
 *                             type: string
 *                             example: "Bachelor of Engineering"
 *                           college:
 *                             type: string
 *                             example: "IIT Bombay"
 *                           specialization:
 *                             type: string
 *                             example: "Computer Science"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/homepage', authGuard, uc.getHomePageProfiles);

/**
 * @swagger
 * /v1/user/me/recently-added:
 *   get:
 *     summary: Get recently added user profiles with pagination
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Recently added profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Smith"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       height:
 *                         type: integer
 *                         example: 165
 *                       currentCity:
 *                         type: string
 *                         example: "Mumbai"
 *                       currentState:
 *                         type: string
 *                         example: "Maharashtra"
 *                       education:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           degree:
 *                             type: string
 *                             example: "Bachelor of Engineering"
 *                           college:
 *                             type: string
 *                             example: "IIT Bombay"
 *                           specialization:
 *                             type: string
 *                             example: "Computer Science"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalRecords:
 *                       type: integer
 *                       example: 47
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/recently-added', authGuard, uc.getRecentlyAddedProfiles);

/**
 * @swagger
 * /v1/user/me/preference-matches:
 *   get:
 *     summary: Get preference match user profiles with pagination
 *     deprecated: true
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Preference match profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Smith"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       height:
 *                         type: integer
 *                         example: 165
 *                       currentCity:
 *                         type: string
 *                         example: "Mumbai"
 *                       currentState:
 *                         type: string
 *                         example: "Maharashtra"
 *                       education:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           degree:
 *                             type: string
 *                             example: "Bachelor of Engineering"
 *                           college:
 *                             type: string
 *                             example: "IIT Bombay"
 *                           specialization:
 *                             type: string
 *                             example: "Computer Science"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalRecords:
 *                       type: integer
 *                       example: 47
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/preference-matches', authGuard, uc.getPreferenceMatchProfiles);

/**
 * @swagger
 * /v1/user/me/same-city:
 *   get:
 *     summary: Get same city user profiles with pagination
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Same city profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       firstName:
 *                         type: string
 *                         example: "Jane"
 *                       lastName:
 *                         type: string
 *                         example: "Smith"
 *                       age:
 *                         type: integer
 *                         example: 28
 *                       height:
 *                         type: integer
 *                         example: 165
 *                       currentCity:
 *                         type: string
 *                         example: "Mumbai"
 *                       currentState:
 *                         type: string
 *                         example: "Maharashtra"
 *                       education:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           degree:
 *                             type: string
 *                             example: "Bachelor of Engineering"
 *                           college:
 *                             type: string
 *                             example: "IIT Bombay"
 *                           specialization:
 *                             type: string
 *                             example: "Computer Science"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalRecords:
 *                       type: integer
 *                       example: 47
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me/same-city', authGuard, uc.getSameCityProfiles);
router.get('/me/shortlisted', authGuard, uc.getShortlistedProfiles);

export default router;
