const db = require('../models');
const Group = db.Group;
const User = db.User;

exports.createGroup = async (req, res) => {
    try {
        const { name, userIds } = req.body;
        
        if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'Group name and at least one user ID are required.' });
        }

        const newGroup = await Group.create({
            name,
            ownerId: req.user.id
        });

        // Add members. We need to find the users to ensure they exist.
        const users = await User.findAll({ where: { id: userIds } });
        if (users.length > 0) {
            await newGroup.addMembers(users);
        }

        // Return the group with its expanded members
        const groupWithMembers = await Group.findOne({
            where: { id: newGroup.id },
            include: [{
                model: User,
                as: 'members',
                attributes: ['id', 'username', 'email']
            }]
        });

        res.status(201).json(groupWithMembers);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const groups = await Group.findAll({
            where: { ownerId: req.user.id },
            include: [{
                model: User,
                as: 'members',
                attributes: ['id', 'username', 'email']
            }]
        });
        
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error retrieving groups:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
