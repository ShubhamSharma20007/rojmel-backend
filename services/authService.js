const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerSchema, loginSchema, forgotPasswordValidation, resetPasswordValidation } = require('../validations/authValidation');
const { sendEmail } = require('./emailService');
const Otp = require('../models/Otp');

require('dotenv').config();

// Register Service
exports.registerUser = async (data) => {
  const { error } = registerSchema.validate(data);
  if (error) throw { status: 400, message: error.details[0].message };

  const { bank_account_no, password } = data;

  // Check if user exists
  const existingUser = await User.findOne({ bank_account_no });
  if (existingUser) throw { status: 400, message: 'Account number already registered.' };

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user
  const user = new User({ ...data, password: hashedPassword });
  await user.save();

  return user;
};

// Login Service
exports.loginUser = async (data) => {
  const { error } = loginSchema.validate(data);
  if (error) throw { status: 400, message: error.details[0].message };
  const { bank_account_no, password } = data;

  // Find user
  const user = await User.findOne({ bank_account_no });
  if (!user) throw { status: 400, message: 'Invalid bank account number or password.' };

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 400, message: 'Invalid bank account number or password.' };

  const userDetail = {}
  if(user) {
    userDetail.brc_full_name = user.brc_full_name;
    userDetail.school_name = user.school_name;
    userDetail.rojmel_name = user.rojmel_name;
  }
  // Generate token
  const token = jwt.sign({ id: user._id, current_subscription_id: user.current_subscription_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token, userDetail };
};

// Send OTP for Forgot Password
exports.sendOtpToEmail = async (business_email) => {
  // Validate input
  const { error } = forgotPasswordValidation.validate({email: business_email});
  if (error) throw { status: 400, message: error.details[0].message };


  const user = await User.findOne({ business_email });
  if (!user) throw { status: 404, message: 'User not found.' };

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  // Save OTP in the database
  await Otp.create({ email: business_email, otp, expiresAt });

  await sendEmail(business_email, 'Password Reset OTP', `Your OTP is: ${otp}`);
  return { business_email, otpExpiresIn: '10 minutes' };
};

exports.resetPassword = async (business_email, otp, newPassword) => {

  // Validate input
  const { error } = resetPasswordValidation.validate({email: business_email, otp, new_password: newPassword});
  if (error) throw { status: 400, message: error.details[0].message };


  const otpRecord = await Otp.findOne({ email:business_email, otp });
  if (!otpRecord) throw { status: 400, message: 'Invalid OTP.' };

  if (otpRecord.expiresAt < Date.now()) {
    throw { status: 400, message: 'OTP has expired.' };
  }

  // Hash the new password and update the user record
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ business_email }, { password: hashedPassword });

  // Delete the used OTP
  await Otp.deleteOne({ _id: otpRecord._id });

  return { message: 'Password reset successful.' };
};
