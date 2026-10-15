/**
 * scripts/seedAdmin.js
 * Ensures a default admin account exists for testing and demo purposes.
 * Email: admin@mindease.test
 * Password: Password123!
 */

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ensureActivitiesSeeded } from '../services/adminService.js';

const seedAdmin = async () => {
  await connectDB();

  console.log('Checking for admin account...');
  let admin = await User.findOne({ email: 'admin@mindease.test' });

  if (!admin) {
    admin = await User.create({
      name: 'Admin Chief',
      email: 'admin@mindease.test',
      password: 'Password123!',
      role: 'admin',
      isVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
    });
    console.log('✅ Admin account created: admin@mindease.test / Password123!');
  } else {
    admin.role = 'admin';
    admin.isActive = true;
    admin.isVerified = true;
    admin.lastLoginAt = new Date();
    await admin.save();
    console.log('✅ Admin account confirmed: admin@mindease.test (role: admin)');
  }

  // Ensure activities are also seeded
  await ensureActivitiesSeeded();
  console.log('✅ Default wellness activities verified.');

  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('❌ Error seeding admin:', err);
  process.exit(1);
});
