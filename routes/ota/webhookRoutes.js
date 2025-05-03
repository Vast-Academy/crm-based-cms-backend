const express = require('express');
const router = express.Router();
const {
  verifyGithubSignature,
  githubWebhookHandler
} = require('../../controllers/ota/webhookController');

router.post(
  '/github-webhook',
  express.raw({ type: 'application/json' }), // to access raw body for signature verification
  (req, res, next) => {
    try {
      verifyGithubSignature(req, res, req.body);
      req.body = JSON.parse(req.body.toString()); // convert raw body to JSON after verifying
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  },
  githubWebhookHandler
);

module.exports = router;