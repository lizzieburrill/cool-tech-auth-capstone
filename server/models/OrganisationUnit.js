const mongoose = require('mongoose');

const OUSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('OrganisationUnit', OUSchema);
