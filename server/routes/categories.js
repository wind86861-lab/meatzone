const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { parent, search, active } = req.query;
    const match = {};
    if (parent === 'null') match.parent = null;
    else if (parent) match.parent = new mongoose.Types.ObjectId(parent);
    if (active !== undefined) match.isActive = active === 'true';
    if (search) {
      match.$or = [
        { 'name.uz': { $regex: search, $options: 'i' } },
        { 'name.ru': { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } },
      ];
    }

    const categories = await Category.aggregate([
      { $match: match },
      { $sort: { order: 1, createdAt: 1 } },
      {
        $lookup: {
          from: 'products',
          let: { catId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [
              { $eq: ['$category', '$$catId'] },
              { $eq: ['$isActive', true] },
            ]}}},
            { $count: 'n' },
          ],
          as: 'productCount',
        },
      },
      {
        $addFields: {
          count: { $ifNull: [{ $arrayElemAt: ['$productCount.n', 0] }, 0] },
        },
      },
      { $project: { productCount: 0 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'parent',
          foreignField: '_id',
          as: 'parent',
        },
      },
      { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent');
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
