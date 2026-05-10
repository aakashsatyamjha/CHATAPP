const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Message = require('../models/Message');

const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// GET /api/messages — Fetch recent messages
router.get('/', auth, async (req, res) => {
  try {
    const { recipientId } = req.query;
    let query = {};

    if (recipientId) {
      // SECURITY: Ensure req.user.id is either the sender or the recipient
      query = {
        $and: [
          {
            $or: [
              { sender: req.user.id, recipient: recipientId },
              { sender: recipientId, recipient: req.user.id }
            ]
          },
          {
            // Only get messages where we are a participant AND haven't deleted it for ourselves
            $and: [
              { $or: [{ sender: req.user.id }, { recipient: req.user.id }] },
              { deletedBy: { $ne: req.user.id } }
            ]
          }
        ]
      };
    } else {
      // Fetch public messages - DISABLED for total privacy
      query = { _id: null };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages/upload — Upload an image
router.post('/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// DELETE /api/messages/:id — Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const { mode } = req.body; // 'me' or 'everyone'
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Security: Only participants can delete
    const isSender = message.sender.toString() === req.user.id;
    const isRecipient = message.recipient?.toString() === req.user.id;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (mode === 'everyone') {
      if (!isSender) {
        return res.status(403).json({ message: 'Only sender can delete for everyone' });
      }
      await Message.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Deleted for everyone', id: req.params.id, mode: 'everyone' });
    } else {
      // Delete for me
      if (!message.deletedBy.includes(req.user.id)) {
        message.deletedBy.push(req.user.id);
        await message.save();
      }
      return res.json({ message: 'Deleted for me', id: req.params.id, mode: 'me' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
