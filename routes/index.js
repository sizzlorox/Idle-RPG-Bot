const express = require('express');

const router = express.Router();

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Idle-RPG Homepage'
  });
});

module.exports = router;
