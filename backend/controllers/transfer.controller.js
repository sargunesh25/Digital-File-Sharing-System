const db = require('../models');

exports.logTransfer = async (req, res) => {
    try {
        const { filename, size, senderDevice, receiverDevice, method, status, duration } = req.body;

        const transfer = await db.Transfer.create({
            userId: req.user.id,
            filename,
            size,
            senderDevice: senderDevice || 'Unknown',
            receiverDevice: receiverDevice || 'Unknown',
            method: method || 'p2p',
            status: status || 'completed',
            duration: duration || 0
        });

        res.status(201).json({ message: 'Transfer logged', transfer });
    } catch (error) {
        console.error('Log transfer error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTransferHistory = async (req, res) => {
    try {
        const transfers = await db.Transfer.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json(transfers);
    } catch (error) {
        console.error('Get transfers error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
