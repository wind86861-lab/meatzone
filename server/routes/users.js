const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const TelegramUser = require('../models/TelegramUser');
const { sendTelegramNotification } = require('../bot/index');
const { protect, admin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user (admin only)
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    const { name, email, role, phone, isActive } = req.body;

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    // Check if role is changing
    const roleChanged = role && role !== oldRole;
    if (role) user.role = role;

    await user.save();

    // Create notification if role changed
    if (roleChanged) {
      console.log(`[ROLE CHANGE] User ${user._id} role changed from ${oldRole} to ${role}`);
      try {
        // Web notification
        const notification = await Notification.create({
          user: user._id,
          type: 'role_change',
          title: 'Your role has been updated',
          message: `Your role has been changed from ${oldRole} to ${role}`,
          data: {
            oldRole,
            newRole: role,
            changedBy: req.user._id,
          },
        });
        console.log(`[NOTIFICATION CREATED] ID: ${notification._id} for user ${user._id}`);

        // Telegram notification - find user by phone
        if (user.phone) {
          const tgUser = await TelegramUser.findOne({ phone: { $regex: user.phone.replace(/[^0-9]/g, '').slice(-9) } });
          if (tgUser) {
            const roleLabels = { admin: '👑 Admin', manager: '📋 Manager', master: '🔧 Master', technician: '🛠 Texnik' };
            await sendTelegramNotification(
              tgUser.chatId,
              `🔔 <b>Rolingiz o'zgartirildi!</b>\n\n` +
              `👤 Oldingi rol: <b>${roleLabels[oldRole] || oldRole}</b>\n` +
              `👤 Yangi rol: <b>${roleLabels[role] || role}</b>\n\n` +
              `O'zgartirgan: <b>${req.user.name}</b>`
            );

            // Also update the role in TelegramUser
            tgUser.role = role;
            await tgUser.save();
            console.log(`[TELEGRAM NOTIFIED] chatId: ${tgUser.chatId}`);
          } else {
            console.log(`[TELEGRAM] No TelegramUser found for phone: ${user.phone}`);
          }
        }
      } catch (notifError) {
        console.error('[NOTIFICATION ERROR]', notifError);
      }
    }

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
