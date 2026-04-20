const db = require('../models');
const Notification = db.Notification;

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to recent 50
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findOne({
            where: { id: notificationId, userId: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { read: true },
            { where: { userId: req.user.id, read: false } }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Internal utility function, not a route handler
exports.createNotification = async (userId, text, type = 'SYSTEM') => {
    try {
        const notification = await Notification.create({
            userId,
            text,
            type,
            read: false
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};
