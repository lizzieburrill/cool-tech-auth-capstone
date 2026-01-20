const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Users register as 'normal' by default
  role: {
    type: String,
    enum: ['normal', 'management', 'admin'],
    default: 'normal',
  },
  // Users can belong to multiple Divisions/OUs
  divisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Division' }],
  organisationUnits: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'OrganisationUnit' },
  ],
});

module.exports = mongoose.model('User', UserSchema);
