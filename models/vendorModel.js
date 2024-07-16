const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    mobile: {
      type: Number,
    },
    status: {
      type: String,
      default: "0",
    },
    otp: {
      type: Number,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    businessWebsite: {
      website: {
        type: String,
      },
      number: {
        type: String,
      },
    },
    categories: {
      type: [
        {
          categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
          categoryName: { type: String },
        },
      ],
    },
    businessDetails: {
      businessName: { type: String },
      legalBusinessName: { type: String },
    },
    contactDetails: {
      contactName: { type: String },
      designation: { type: String },
      owner: { type: String },
      whatsapp: { type: Number },
      mobileNumber: { type: Number },
      emailAddress: { type: String },
      landline: { type: Number },
      tollFreeNumber: { type: Number },
    },
    locationDetails: {
      buildingName: { type: String },
      streetName: { type: String },
      landmark: { type: String },
      area: { type: String },
      pincode: { type: Number },
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    businessTimings: {
      regular: {
        days: [],
        regularTime: [{ openAt: { type: String }, closeAt: { type: String } }],
      },
      holiday: {
        days: [],
        holidayTimings: [
          { openAt: { type: String }, closeAt: { type: String } },
        ],
      },
      isAdditionalNote: { type: Boolean, default: false },
      notes: { type: String },
    },
    establishment: {
      month: { type: String },
      year: { type: String },
    },
    turnover: {
      type: String,
    },
    employees: {
      type: String,
    },
    social: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
      others: { type: String },
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
    isPayment: {
      type: Boolean,
      default: false,
    },
    notes: {
      userId: { type: String },
      response: { type: String },
      amount: { type: String },
    },
    razorpayResponse: {
      razorpayPaymentId: { type: String },
      razorpayOrderId: { type: String },
      razorpaySignature: { type: String },
    },
    easeBuzzResponse: {
      bankRefNumber: { type: String },
      easepayId: { type: String },
      email: { type: String },
      hash: { type: String },
      key: { type: String },
      status: { type: String },
      txnId: { type: String },
    },
    isCouponApplied: { type: Boolean, default: false },
    couponAmount: { type: String },
    couponCode: { type: String },
    couponDiscount: { type: String },
    rateCard: { type: [] },
    gallery: { type: [] },
    kyc: {
      businessType: { type: String },
      personName: { type: String },
      hasGstin: { type: Boolean, default: false },
      gstNumber: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
