const express = require('express');

const router = express.Router();

router.use((req, res, next) => {
  console.log(Date.now());
  next();
});

router.get('/', (req, res) => {});

module.exports = router;
