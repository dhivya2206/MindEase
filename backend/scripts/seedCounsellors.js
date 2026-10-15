/**
 * scripts/seedCounsellors.js
 * Seeds counsellor profiles and accounts for appointment booking demo — Part 16.
 */

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Counsellor } from '../models/Counsellor.js';

const SEED_COUNSELLORS = [
  {
    name: 'Dr. Maya Patel',
    email: 'maya.counsellor@mindease.test',
    password: 'Password123!',
    specialization: 'Anxiety & Stress Management',
    experience: 8,
    description: 'Licensed clinical psychologist specializing in cognitive behavioral therapy (CBT), mindfulness-based stress reduction, and anxiety disorders.',
    location: 'Bangalore, India · Online & In-Person',
    availability: [
      { day: 'Monday',    startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday',   startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday',  startTime: '09:00', endTime: '17:00' },
      { day: 'Friday',    startTime: '10:00', endTime: '16:00' },
    ],
  },
  {
    name: 'Dr. Elena Vance',
    email: 'elena.counsellor@mindease.test',
    password: 'Password123!',
    specialization: 'Depression & Mood Disorders',
    experience: 12,
    description: 'Senior psychotherapist dedicated to helping individuals navigate life transitions, depressive episodes, emotional resilience, and grief recovery.',
    location: 'Mumbai, India · Online Sessions',
    availability: [
      { day: 'Tuesday',   startTime: '10:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '10:00', endTime: '18:00' },
      { day: 'Thursday',  startTime: '10:00', endTime: '18:00' },
      { day: 'Saturday',  startTime: '11:00', endTime: '15:00' },
    ],
  },
  {
    name: 'Dr. Marcus Reed',
    email: 'marcus.counsellor@mindease.test',
    password: 'Password123!',
    specialization: 'Cognitive Behavioural Therapy (CBT)',
    experience: 6,
    description: 'Empathetic counselor focusing on thought pattern restructuring, panic management, and practical habit transformation.',
    location: 'New Delhi, India · Online Video Consultations',
    availability: [
      { day: 'Monday',    startTime: '13:00', endTime: '20:00' },
      { day: 'Wednesday', startTime: '13:00', endTime: '20:00' },
      { day: 'Friday',    startTime: '13:00', endTime: '20:00' },
      { day: 'Sunday',    startTime: '10:00', endTime: '14:00' },
    ],
  },
];

const seed = async () => {
  await connectDB();
  console.log('Seeding counsellors...');

  // Also setup Bob Counsellor if exists
  const bob = await User.findOne({ email: 'counsellor@rbac.test' });
  if (bob) {
    await Counsellor.findOneAndUpdate(
      { user: bob._id },
      {
        user: bob._id,
        specialization: 'Relationship Counselling',
        experience: 5,
        description: 'Compassionate licensed therapist specializing in interpersonal communication, couples support, and emotional wellness.',
        location: 'Online Only',
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'Friday', startTime: '09:00', endTime: '17:00' },
        ],
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('✓ Bob Counsellor profile seeded');
  }

  for (const c of SEED_COUNSELLORS) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        name: c.name,
        email: c.email,
        password: c.password,
        role: 'counsellor',
      });
      console.log(`✓ Created user: ${c.name}`);
    }

    await Counsellor.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        specialization: c.specialization,
        experience: c.experience,
        description: c.description,
        location: c.location,
        availability: c.availability,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log(`✓ Created counsellor profile: ${c.name}`);
  }

  console.log('Done seeding counsellors!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
