const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/services', serviceController.getAllService);
router.post('/service', serviceController.createService);
router.get('/service/sum', serviceController.sumService);
router.get('/service/:id', serviceController.getService);
router.put('/service/:id', serviceController.updateService);
router.delete('/service/:id', serviceController.deleteService);

module.exports = router;