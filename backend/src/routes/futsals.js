const express = require('express');
const router = express.Router();
const futsalCtrl = require('../controllers/futsal');
const slotCtrl = require('../controllers/slot');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Futsals
router.get('/', futsalCtrl.listFutsals);
router.post('/', authMiddleware, futsalCtrl.createFutsal); // authenticated users become owners
router.get('/my', authMiddleware, futsalCtrl.listMyFutsals);
router.get('/:id', futsalCtrl.getFutsal);
router.get('/:id/admin', authMiddleware, futsalCtrl.getFutsalAdmin);

// Admin: generate daily slots for a futsal (query param: date=YYYY-MM-DD)
router.post('/:id/generate', authMiddleware, adminMiddleware, futsalCtrl.generateDailySlots);

// Slot actions
router.post('/:id/slots/:slotId/reserve', authMiddleware, slotCtrl.reserveSlot);
router.post('/:id/slots/:slotId/confirm', authMiddleware, slotCtrl.confirmByUser);
router.post('/:id/slots/:slotId/cancel', authMiddleware, slotCtrl.cancelByUser);
router.post('/:id/slots/:slotId/admin-confirm', authMiddleware, adminMiddleware, slotCtrl.adminConfirm);
// Admin: delete/cancel any booking
router.delete('/:id/slots/:slotId', authMiddleware, adminMiddleware, slotCtrl.adminDeleteBooking);

// Utility: release expired reservations (admin)
router.post('/slots/release-expired', authMiddleware, adminMiddleware, slotCtrl.releaseExpired);

module.exports = router;