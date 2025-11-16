#!/usr/bin/env node
/**
 * normalize-yearofstudy.js
 * Convert existing documents that use legacy year labels (Freshman, Sophomore, etc.)
 * into the new canonical values: one, two, three, four, master, phd, other.
 * Dry-run by default. Use --apply to commit changes.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hukonnect';
const APPLY = process.argv.includes('--apply');

const mapOldToNew = {
  'freshman': 'one',
  'sophomore': 'two',
  'junior': 'three',
  'senior': 'four',
  'graduate': 'master',
  'other': 'other'
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Scanning users for legacy yearOfStudy values...');

  const users = await User.find({ yearOfStudy: { $exists: true } }).lean();
  const ops = [];

  for (const u of users) {
    const cur = u.yearOfStudy;
    if (!cur) continue;
    const mapped = mapOldToNew[String(cur).trim().toLowerCase()];
    if (mapped && mapped !== cur) {
      ops.push({ updateOne: { filter: { _id: u._id }, update: { $set: { yearOfStudy: mapped } } } });
    }
  }

  console.log(`Planned normalization for ${ops.length} users`);
  if (ops.length === 0) {
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!APPLY) {
    console.log('Dry-run: sample ops:');
    ops.slice(0,5).forEach((o,i)=>console.log(i+1, JSON.stringify(o))); 
    await mongoose.disconnect();
    process.exit(0);
  }

  try {
    const BATCH = 500;
    for (let i=0;i<ops.length;i+=BATCH) {
      const batch = ops.slice(i,i+BATCH);
      const res = await User.bulkWrite(batch);
      console.log(`Applied batch ${i/BATCH+1}:`, res.modifiedCount || res.nModified || 0);
    }
    console.log('Normalization complete.');
  } catch (err) {
    console.error('Error applying normalization:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run().catch(err=>{console.error(err);process.exit(1)});
