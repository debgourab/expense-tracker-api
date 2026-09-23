const express = require('express');
const mongoose = require('mongoose');

const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateExpenseInput(data, isPartial = false) {
  const errors = [];
  const allowedFields = ['title', 'amount', 'category', 'date'];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['Request body must be a JSON object'];
  }

  const unknownFields = Object.keys(data).filter((field) => !allowedFields.includes(field));
  const receivedFields = Object.keys(data).filter((field) => allowedFields.includes(field));

  if (unknownFields.length > 0) {
    errors.push(`Unsupported fields: ${unknownFields.join(', ')}`);
  }

  if (isPartial && receivedFields.length === 0) {
    errors.push('At least one expense field is required');
  }

  if (!isPartial || Object.prototype.hasOwnProperty.call(data, 'title')) {
    if (!data.title || String(data.title).trim().length === 0) {
      errors.push('Title is required');
    } else if (String(data.title).trim().length > 100) {
      errors.push('Title cannot be longer than 100 characters');
    }
  }

  if (!isPartial || Object.prototype.hasOwnProperty.call(data, 'amount')) {
    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
      errors.push('Amount must be between 0.01 and 100000000');
    }
  }

  if (!isPartial || Object.prototype.hasOwnProperty.call(data, 'category')) {
    if (!data.category || String(data.category).trim().length === 0) {
      errors.push('Category is required');
    } else if (String(data.category).trim().length > 50) {
      errors.push('Category cannot be longer than 50 characters');
    }
  }

  if (data.date && Number.isNaN(Date.parse(data.date))) {
    errors.push('Date must be a valid date');
  }

  return errors;
}

function buildExpensePayload(data) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    payload.title = String(data.title).trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'amount')) {
    payload.amount = Number(data.amount);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'category')) {
    payload.category = String(data.category).trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'date') && data.date) {
    payload.date = new Date(data.date);
  }

  return payload;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildExpenseQuery(userId, query) {
  const filter = { userId };

  if (typeof query.category === 'string' && query.category.trim()) {
    filter.category = new RegExp(`^${escapeRegex(query.category.trim())}$`, 'i');
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim().slice(0, 100)), 'i');
    filter.$or = [{ title: search }, { category: search }];
  }

  if (query.from || query.to) {
    filter.date = {};

    if (query.from) {
      const from = new Date(query.from);

      if (Number.isNaN(from.getTime())) {
        return { error: 'from must be a valid date' };
      }

      filter.date.$gte = from;
    }

    if (query.to) {
      const to = new Date(query.to);

      if (Number.isNaN(to.getTime())) {
        return { error: 'to must be a valid date' };
      }

      to.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const sortOptions = {
    newest: { date: -1, createdAt: -1 },
    oldest: { date: 1, createdAt: 1 },
    highest: { amount: -1, date: -1 },
    lowest: { amount: 1, date: -1 },
  };

  return { filter, sort: sortOptions[query.sort] || sortOptions.newest };
}

router.post('/', async (req, res, next) => {
  try {
    const errors = validateExpenseInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const expense = await Expense.create({
      ...buildExpensePayload(req.body),
      userId: req.userId,
    });

    return res.status(201).json(expense);
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const query = buildExpenseQuery(req.userId, req.query);

    if (query.error) {
      return res.status(400).json({ message: query.error });
    }

    const expenses = await Expense.find(query.filter).sort(query.sort);
    return res.json(expenses);
  } catch (error) {
    return next(error);
  }
});

router.get('/dashboard/category-totals', async (req, res, next) => {
  try {
    const totals = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    return res.json(totals);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const errors = validateExpenseInput(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      buildExpensePayload(req.body),
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.json(updatedExpense);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense id' });
    }

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deletedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
