/**
 * routes/journalRoutes.js
 * Journal API endpoints — Personal Wellness Journal.
 *
 * All routes require JWT authentication (`protect`).
 */

import { Router } from 'express';
import { protect } from '../middleware/protect.js';
import * as journalController from '../controllers/journalController.js';

const router = Router();

// Apply authentication middleware to all journal routes
router.use(protect);

router.post('/',       journalController.createEntry);
router.get('/',        journalController.getEntries);
router.get('/stats',   journalController.getStats);
router.get('/:id',     journalController.getEntryById);
router.put('/:id',     journalController.updateEntry);
router.patch('/:id',   journalController.updateEntry);
router.delete('/:id',  journalController.deleteEntry);

export default router;
