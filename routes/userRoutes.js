const express = require('express');
const {registerUser, loginUser, allUsers} = require('../controllers/userControllers');
const {protect} = require('../middleware/authMiddleware');
const router = express.Router();

const multer  = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route('/')
    .post(upload.single('image'), registerUser)
    .get(protect, allUsers)
router.post('/login', loginUser);

module.exports = router;
