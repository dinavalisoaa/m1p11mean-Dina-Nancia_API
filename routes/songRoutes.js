const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

router.get('/songs', songController.getAllSong);
router.post('/songs', songController.createSong);
router.get('/songs/:id', songController.getSong);
router.put('/songs/:id', songController.updateSong);
router.delete('/songs/:id', songController.deleteSong);


router.get('/service', songController.getAllSong);
router.post('/service', songController.createSong);
router.get('/service/:id', songController.getSong);
router.put('/service/:id', songController.updateSong);
router.delete('/service/:id', songController.deleteSong);

module.exports = router;