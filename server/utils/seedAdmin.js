const Admin = require('../models/admin');

const seedDefaultAdmin = async () => {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const password = process.env.ADMIN_PASSWORD || 'admin';

  if (!username || !password) {
    console.warn('Skipping admin seed: ADMIN_USERNAME or ADMIN_PASSWORD is empty.');
    return;
  }

  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) return;

  await Admin.create({ username, password });
  console.log(`Default admin created with username "${username}".`);
};

module.exports = seedDefaultAdmin;
