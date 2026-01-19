const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  siteName: { type: String, required: true },
  username: { type: String, required: true }, // The login username for the site
  password: { type: String, required: true }, // The login password for the site
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true,
  },
});

module.exports = mongoose.model('Credential', CredentialSchema);
