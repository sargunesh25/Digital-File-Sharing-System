const db = require('../models');
const { Op } = require('sequelize');

// Mock User Settings Data
let userSettings = {
    notifications: true,
    darkMode: false,
    twoFactor: false,
    language: 'English (US)'
};

exports.getSettings = (req, res) => {
    try {
        // In a real app, fetch from DB using req.user.id
        res.json(userSettings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateSettings = (req, res) => {
    try {
        const { notifications, darkMode, twoFactor, language } = req.body;

        // Update settings
        if (notifications !== undefined) userSettings.notifications = notifications;
        if (darkMode !== undefined) userSettings.darkMode = darkMode;
        if (twoFactor !== undefined) userSettings.twoFactor = twoFactor;
        if (language !== undefined) userSettings.language = language;

        res.json({ message: 'Settings updated successfully', settings: userSettings });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await db.User.findAll({
            where: {
                id: { [Op.ne]: req.user.id } // Exclude the requesting user
            },
            attributes: ['id', 'username', 'email'] // Only send safe fields
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};
