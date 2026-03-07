const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/', authMiddleware, transferController.logTransfer);
router.get('/', authMiddleware, transferController.getTransferHistory);

module.exports = router;
