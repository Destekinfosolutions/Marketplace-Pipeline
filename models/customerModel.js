const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
    },
    dob: {
      type: String,
    },
    otp: {
      type: Number,
    },
    deviceId: {
      type: String,
    },
    fcmId: {
      type: String,
    },
    hashKey: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
