// test-age.js - 修改为检查所有用户
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAllUsers() {
    try {
    await mongoose.connect('mongodb://localhost:27017/hukonnect', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log('查询所有用户...');
    
    // 查询所有用户
    const allUsers = await User.find({});
    console.log(`数据库中共有 ${allUsers.length} 个用户:`);
    
    allUsers.forEach((user, index) => {
     console.log(`\n用户 ${index + 1}:`);
     console.log(`- 邮箱: ${user.email}`);
     console.log(`- 姓名: ${user.firstName} ${user.lastName}`);
    });

    // 特别查询 sarah@hu.edu
    console.log('\n=== 特别查询 sarah@hu.edu ===');
    const sarah = await User.findOne({ email: 'sarah@hu.edu' });
    if (sarah) {
      console.log(`找到用户, she is born in ${sarah.birthDate} and now ${sarah.age} years old.`);
    } else {
      console.log('❌ 未找到邮箱为 sarah@hu.edu 的用户');
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAllUsers();