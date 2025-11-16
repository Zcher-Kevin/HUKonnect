#!/usr/bin/env node
/**
 * migrate-users.js
 * Safe, idempotent migration helper for the `users` collection.
 * - Dry-run by default: prints planned changes.
 * - Use `--apply` to actually write updates.
 *
 * Actions performed (only if target field missing):
 * - ensure `gender` exists (set to 'unspecified')
 * - copy `year` -> `yearOfStudy` when missing
 * - copy `dob` (or string dob) -> `birthdate` when missing
 * - copy `lastLogin` -> `lastlogin` when missing
 *
 * Usage:
 *   node backend/scripts/migrate-users.js         # dry-run
 *   node backend/scripts/migrate-users.js --apply # apply changes
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hukonnect';
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const CLEANUP = argv.includes('--cleanup');

async function run() {
  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected. Scanning users...');

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users`);

  const ops = [];
  let planCount = 0;

  for (const u of users) {
    const update = {};

    // Ensure gender exists
    if (!('gender' in u) || u.gender === undefined || u.gender === null) {
      update.gender = 'unspecified';
    }

    // year -> yearOfStudy
    if ((u.year || u.year === 0) && !u.yearOfStudy) {
      update.yearOfStudy = u.year;
    }

    // dob -> birthdate (if dob present and birthdate missing)
    if ((u.dob || u.dob === 0) && !u.birthdate) {
      try {
        const parsed = new Date(u.dob);
        if (!isNaN(parsed.getTime())) update.birthdate = parsed;
      } catch (e) {}
    }

    // lastLogin -> lastlogin
    if ((u.lastLogin || u.lastLogin === 0) && !u.lastlogin) {
      update.lastlogin = u.lastLogin;
    }

    // Only create an op if there's something to change
    if (Object.keys(update).length > 0) {
      planCount++;
      ops.push({ updateOne: { filter: { _id: u._id }, update: { $set: update } } });
    }
  }

  console.log(`Planned updates for ${planCount} users`);

  if (planCount === 0) {
    console.log('Nothing to do. Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!APPLY) {
    console.log('Dry-run mode (no changes written). Re-run with --apply to perform updates.');
    // print a few sample ops
    console.log('\nSample planned update (first 5):');
    ops.slice(0, 5).forEach((op, i) => {
      console.log(`#${i + 1}`, JSON.stringify(op, null, 2));
    });
    if (CLEANUP) {
      // Prepare cleanup plan (which legacy fields we'd unset)
      const legacyFields = ['year', 'lastLogin', 'birthDate'];
      const cleanupOps = [];
      for (const u of users) {
        const unset = {};
        legacyFields.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(u, k)) unset[k] = '';
        });
        if (Object.keys(unset).length > 0) {
          cleanupOps.push({ updateOne: { filter: { _id: u._id }, update: { $unset: unset } } });
        }
      }
      console.log(`\nPlanned cleanup (dry-run): would unset legacy fields from ${cleanupOps.length} users.`);
      console.log('Sample cleanup ops (first 5):');
      cleanupOps.slice(0, 5).forEach((op, i) => console.log(`#${i + 1}`, JSON.stringify(op, null, 2)));
    }
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Applying updates...');
  try {
    // Perform bulk write in batches to avoid huge single requests
    const BATCH = 500;
    for (let i = 0; i < ops.length; i += BATCH) {
      const batch = ops.slice(i, i + BATCH);
      const res = await User.bulkWrite(batch);
      console.log(`Applied batch ${i / BATCH + 1}: matched=${res.matchedCount || res.nMatched || 0} modified=${res.modifiedCount || res.nModified || 0}`);
    }
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying updates:', err);
  } finally {
    // If cleanup requested, perform unset of legacy fields
    if (CLEANUP) {
      console.log('Preparing cleanup of legacy fields (--cleanup)');
      const legacyFields = ['year', 'lastLogin', 'birthDate'];
      const cleanupOps = [];
      for (const u of users) {
        const unset = {};
        legacyFields.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(u, k)) unset[k] = '';
        });
        if (Object.keys(unset).length > 0) {
          cleanupOps.push({ updateOne: { filter: { _id: u._id }, update: { $unset: unset } } });
        }
      }

      console.log(`Planned cleanup ops for ${cleanupOps.length} users`);
      if (!APPLY) {
        console.log('Dry-run for cleanup (no changes written). Re-run with --apply --cleanup to perform unsets.');
        cleanupOps.slice(0, 5).forEach((op, i) => console.log(`#${i + 1}`, JSON.stringify(op, null, 2)));
      } else {
        try {
          const BATCH2 = 500;
          for (let i = 0; i < cleanupOps.length; i += BATCH2) {
            const batch = cleanupOps.slice(i, i + BATCH2);
            const res = await User.bulkWrite(batch);
            console.log(`Cleanup batch ${i / BATCH2 + 1}: matched=${res.matchedCount || res.nMatched || 0} modified=${res.modifiedCount || res.nModified || 0}`);
          }
          console.log('Cleanup applied successfully.');
        } catch (err) {
          console.error('Error applying cleanup:', err);
        }
      }

    }

    await mongoose.disconnect();
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

// Copy year -> yearOfStudy for docs that only have 'year'
db.users.find({ year: { $exists: true }, yearOfStudy: { $exists: false } }).forEach(function(u){
  var map = {"Freshman":"one","Sophomore":"two","Junior":"three","Senior":"four","Graduate":"master"};
  var val = u.year;
  var mapped = map[val] || val;
  db.users.updateOne({_id:u._id}, {$set:{yearOfStudy:mapped}});
});
