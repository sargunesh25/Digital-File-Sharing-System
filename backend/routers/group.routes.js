const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);

module.exports = router;
