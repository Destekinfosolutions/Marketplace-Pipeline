const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Razorpay = require("razorpay");
const ShortUniqueId = require("short-unique-id");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const Vendor = require("../models/vendorModel");
const Product = require("../models/productModel");
const ChatEnquiries = require("../models/chatModel");
const Enquiry = require("../models/enquiryModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendRegistrationMail = (email, password, url) => {
  const emailTemplatePath = path.join(
    __dirname,
    "..",
    "email_template",
    "emailTemplate.html"
  );

  fs.readFile(emailTemplatePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      return;
    }

    const emailContent = data
      .replace("{{EMAIL}}", email)
      .replace("{{PASSWORD}}", password)
      .replace("{{URL}}", url);

    transporter
      .sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Waayu Marketplace Registration",
        html: emailContent,
      })
      .then((info) => {
        console.log(info);
      })
      .catch(console.error);
  });
};

// @desc Register a new Vendor
// @route POST /api/vendor/register
const registerVendor = asyncHandler(async (req, res) => {
  let { email, mobile } = req?.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Please provide the email field.", success: false });
  }
  if (!mobile) {
    return res
      .status(400)
      .json({ message: "Please provide the mobile field.", success: false });
  }

  // Find if Vendor already exists
  let vendorExists = await Vendor.findOne({ mobile });

  if (vendorExists?.isPayment === true && vendorExists?.status == 1) {
    return res
      .status(400)
      .json({ message: "Vendor already registered!", success: false });
  }

  const four_digit_random_number = generateOtp();

  const data = {
    email,
    mobile,
    otp: four_digit_random_number,
    isPayment: false,
  };

  if (vendorExists) {
    await Vendor.findOneAndUpdate(
      { mobile, email },
      { otp: four_digit_random_number }
    );

    sendRegistrationMail(vendorExists.email, (url = "https://google.com"));
    const country_code = "91";
    const phoneNumber = country_code + mobile;

    const numbers = phoneNumber;

    await send_message(numbers, four_digit_random_number, "waayu");

    return res.status(200).json({
      _id: vendorExists._id,
      email: vendorExists.email,
      mobile: vendorExists.mobile,
      otp: four_digit_random_number,
      token: generateToken(vendorExists._id),
      isPayment: false,
      createdAt: vendorExists.createdAt,
      updatedAt: vendorExists.updatedAt,
      success: true,
    });
  } else {
    let vendor = await Vendor.create(data);

    if (vendor) {
      sendRegistrationMail(vendor.email, (url = "https://google.com"));
      const country_code = "91";
      const phoneNumber = country_code + mobile;

      const numbers = phoneNumber;

      await send_message(numbers, four_digit_random_number, "waayu");

      return res.status(201).json({
        _id: vendor._id,
        email: vendor.email,
        mobile: vendor.mobile,
        otp: four_digit_random_number,
        token: generateToken(vendor._id),
        isPayment: false,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        success: true,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Error while creating vendor!", message: false });
    }
  }
});

// @desc Login a new Vendor
// @route POST /api/vendor/login
const loginVendor = asyncHandler(async (req, res) => {
  const { mobile, deviceId, fcmId, hashKey } = req?.body;

  if (!mobile) {
    return res
      .status(400)
      .json({ message: "Please provide the moobile field!", success: false });
  }

  const vendor = await Vendor.findOne({ mobile });

  if (!vendor) {
    return res
      .status(404)
      .json({ message: "Vendor not found!", success: false });
  }

  if (vendor && vendor.mobile == mobile && vendor.status == 1) {
    if (deviceId && fcmId) {
      await Vendor.findOneAndUpdate(
        { mobile },
        { deviceId: deviceId, fcmId: fcmId }
      );
      console.log("Updated");
    }

    const country_code = "91";
    const phoneNumber = country_code + mobile;

    const numbers = phoneNumber;
    // const sender = "WAAYUF";

    const four_digit_random_number = generateOtp();
    // const message = `Dear Vendor, your OTP is "${four_digit_random_number}" to login/signup in Marketplace App. Thank You!`;

    // const apikey = "NzE2NzRjNmQ3OTc2NzA3YTU1Mzg0MTQ0NzA0YzMxNjI=";

    await Vendor.findOneAndUpdate(
      { mobile },
      { otp: four_digit_random_number }
    );

    // const sendSmsRes = await send_message(numbers, four_digit_random_number);
    const sendSmsRes = await send_message(
      numbers,
      four_digit_random_number,
      "waayu"
    );

    console.log("sendSmsRes", sendSmsRes);

    if (sendSmsRes.status === "success") {
      return res
        .status(200)
        .json({ message: "OTP sent successfully!", success: true });
    } else if (sendSmsRes.status === "failure") {
      return res
        .status(500)
        .json({ message: "Error while sending otp!", success: false });
    }
  } else {
    return res
      .status(500)
      .json({ message: "INternal server error", success: false });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req?.body;

  if (!mobile) {
    return res
      .status(400)
      .json({ message: "Please provide the mobile field!", success: false });
  }
  if (!otp) {
    return res
      .status(400)
      .json({ message: "Please provide the otp field!", success: false });
  }

  const vendor = await Vendor.findOne({ mobile });

  if (!vendor) {
    return res
      .status(404)
      .json({ message: "Vendor not found!", success: false });
  }

  if (vendor && vendor.otp == otp) {
    return res.status(200).json({
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      mobile: vendor.mobile,
      city: vendor.city ? vendor.city : "",
      businessName: vendor.businessDetails.businessName
        ? vendor.businessDetails.businessName
        : "",
      isPayment: vendor?.isPayment || false,
      token: generateToken(vendor._id),
      success: true,
    });
  } else {
    return res.status(500).json({ message: "Wrong OTP!", success: false });
  }
});

// Login with Email
const loginWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req?.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Provide the email field!", success: false });
  }
  if (!password) {
    return res
      .status(400)
      .json({ message: "Provide the password field!", success: false });
  }

  const vendor = await Vendor.findOne({ email });

  if (!vendor) {
    return res
      .status(404)
      .json({ message: "Vendor not found!", success: false });
  }

  if (vendor && vendor.password == password) {
    return res.status(200).json({
      _id: vendor._id,
      email: vendor.email,
      name: vendor.name,
      mobile: vendor.mobile,
      city: vendor.city ? vendor.city : "",
      businessName: vendor.businessDetails.businessName
        ? vendor.businessDetails.businessName
        : "",
      isPayment: vendor?.isPayment || false,
      token: generateToken(vendor._id),
      success: true,
    });
  } else {
    return res.status(500).json({ message: "Wrong Password", success: false });
  }
});

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// async function send_message(numbers, otp) {
//   const formData = new FormData();

//   formData.append("mobile", numbers);
//   formData.append("otp", otp);

//   const response = await axios.post(
//     "https://waayupro.in/otp_sender/send_message.php",
//     formData
//   );

//   const result = response.data;
//   return result;
// }
async function send_message(numbers, otp, hashkey) {
  const formData = new FormData();

  formData.append("mobile", numbers);
  formData.append("otp", otp);
  formData.append("hashkey", hashkey);

  const response = await axios.post(
    "https://master.waayu.app/otp_sender/send_message.php",
    formData
  );

  const result = response.data;
  return result;
}

// router.put("/update") for registeration page
const updateVendor = asyncHandler(async (req, res) => {
  let data = req?.body;

  if (!data || data.length === 0) {
    return res.json({ message: "No data found from body!", success: false });
  }

  const vendorExists = await Vendor.findOne({ mobile: data.mobile });

  if (!vendorExists) {
    return res
      .status(400)
      .json({ message: "Vendor not Found!", success: false });
  }

  if (req.file) {
    const filenameWithoutSpaces = req.file.filename.replace(/\s+/g, "");
    data.profileImage = filenameWithoutSpaces;
  }

  const updateVendor = await Vendor.findByIdAndUpdate(vendorExists?._id, data, {
    new: true,
  });

  if (!updateVendor) {
    return res
      .status(400)
      .json({ message: "Error while updating vendor!", success: false });
  }

  res.status(200).json({ data: updateVendor, success: true });
});

// Profile Update
const updateVendorDetails = asyncHandler(async (req, res) => {
  let data = req?.body;

  if (!data || data.length === 0) {
    return res.json({ message: "No data found from body!", success: false });
  }

  const id = req.params.id;

  const vendorExists = await Vendor.findById(id);

  if (!vendorExists) {
    return res
      .status(400)
      .json({ message: "Vendor not Found!", success: false });
  }

  if (req.file) {
    const filenameWithoutSpaces = req.file.filename.replace(/\s+/g, "");
    data.profileImage = filenameWithoutSpaces;
  }

  const updateVendor = await Vendor.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updateVendor) {
    return res
      .status(400)
      .json({ message: "Error while updating vendor!", success: false });
  }

  res.status(200).json({ data: updateVendor, success: true });
});

const getVendor = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const vendor = await Vendor.findById(id);

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  res.status(200).json({ vendor, success: true });
});

const initiateRazorpay = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide the data!", success: false });
  }
  const amount = parseInt(data?.amount);
  const currency = "INR";
  const uid = new ShortUniqueId({ length: 10 });
  const todayDate = new Date().getTime();

  const options = {
    amount: amount * 100,
    currency: currency,
    receipt: `${todayDate}`,
  };

  try {
    const response = await razorpay.orders.create(options);
    return res.status(200).json({ data: response, success: true });
  } catch (error) {
    return res.status(400).json({ data: error, success: false });
  }
});

const storeRazorpayResponse = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide the data!", success: false });
  }

  let newData = {
    notes: data.notes,
    razorpayResponse: data.razorpayResponse,
    isPayment: true,
  };

  const storeData = await Vendor.findByIdAndUpdate(
    data?.notes?.userId,
    newData
  );

  await Vendor.findByIdAndUpdate(data?.notes?.userId, { status: "1" });

  if (storeData) {
    return res.status(200).json({
      vendor: storeData,
      message: "Data stored successfully!",
      success: true,
    });
  } else {
    return res
      .status(400)
      .json({ message: "Error while storing data!", success: false });
  }
});

const easebuzzPaymentInitiate = asyncHandler(async (req, res) => {
  const bodydata = req.body;

  if (!bodydata || Object.keys(bodydata).length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide the body data!", success: false });
  }

  const todayDate = new Date().getTime();

  const key = process.env.EASEBUZZ_KEY;
  const salt = process.env.EASEBUZZ_SALT;
  const txnid = `${todayDate}`;
  const amount = parseFloat(bodydata.amount).toFixed(2);
  const productinfo = "Marketplace Vendor Registration";
  const firstname = bodydata.name;
  const email = bodydata.email;
  const phone = bodydata.mobile;
  const surl = "https://www.google.co.in";
  const furl = "https://www.youtube.com";

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  const encodedParams = new URLSearchParams();
  encodedParams.set("txnid", txnid);
  encodedParams.set("key", key);
  encodedParams.set("amount", amount);
  encodedParams.set("productinfo", productinfo);
  encodedParams.set("firstname", firstname);
  encodedParams.set("email", email);
  encodedParams.set("phone", phone);
  encodedParams.set("surl", surl);
  encodedParams.set("furl", furl);
  encodedParams.set("hash", hash);

  const options = {
    method: "POST",
    url: "https://testpay.easebuzz.in/payment/initiateLink",
    // url: "https://pay.easebuzz.in/payment/initiateLink",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    data: encodedParams,
  };

  const { data } = await axios.request(options);

  if (data.status === 1) {
    return res.status(200).json({ ...data, success: true });
  } else if (data.status === 0) {
    return res.status(400).json({ ...data, success: false });
  }
});

const storeEasebuzzResponse = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide the body data!", success: false });
  }

  let newData = {
    notes: data.notes,
    easeBuzzResponse: data.easeBuzzResponse,
    isPayment: true,
  };

  const storeData = await Vendor.findByIdAndUpdate(
    data?.notes?.userId,
    newData
  );

  await Vendor.findByIdAndUpdate(data?.notes?.userId, { status: "1" });

  if (storeData) {
    return res.status(200).json({
      vendor: storeData,
      message: "Data stored successfully!",
      success: true,
    });
  } else {
    return res
      .status(400)
      .json({ message: "Error while storing data!", success: false });
  }
});

const holidayList = asyncHandler(async (req, res) => {
  const data = [
    { name: "New Year", date: "01-Jan-2024" },
    { name: "Republic Day", date: "26-Jan-2024" },
    { name: "Holi", date: "25-Mar-2024" },
    { name: "Gudhi Padwa", date: "09-Apr-2024" },
    { name: "Maharashtra Day", date: "01-May-2024" },
    { name: "Independence Day", date: "15-Aug-2024" },
    { name: "Ganesh Chaturthi", date: "07-Sep-2024" },
    { name: "Anant Chaturdashi", date: "17-Sep-2024" },
    { name: "Mahatma Gandhi Jayanti", date: "02-Oct-2024" },
    { name: "Dusshera", date: "12-Oct-2024" },
    { name: "Diwali- Laxmi Pujan", date: "01-Nov-2024" },
    { name: "Diwali- Balipratipada", date: "02-Nov-2024" },
    { name: "Christmas Day", date: "25-Dec-2024" },
  ];

  res.status(200).json({ data, success: true });
});

// Upload Rate Card
// /api/vendor/rate-card
const uploadRateCard = asyncHandler(async (req, res) => {
  const vendorId = req.body.vendorId;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  let vendor = await Vendor.findOne({ _id: vendorId });

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  let productImages = [];
  let productResImages = [];

  if (req.files && req.files.length > 0) {
    productImages = req.files.map((file) => {
      const filenameWithoutSpaces = file.filename.replace(/\s+/g, "");
      productResImages.push(
        `https://marketplaceaws.waayupro.in/uploads/images/vendor/${filenameWithoutSpaces}`
      );
      return filenameWithoutSpaces;
    });
    vendor.rateCard = productImages;
  }

  const result = await vendor.save();

  if (!result) {
    return res
      .status(400)
      .json({ message: "Error while uploading rate card!", success: false });
  }

  res.status(200).json({ data: result, success: true });
});

// Get Rate Card Data
const getRateCard = asyncHandler(async (req, res) => {
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  let vendor = await Vendor.findOne({ _id: vendorId });

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  res.status(200).json({ data: vendor.rateCard, success: true });
});

// Upload Gallery
// /api/vendor/gallery
const uploadGallery = asyncHandler(async (req, res) => {
  const vendorId = req.body.vendorId;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  let vendor = await Vendor.findOne({ _id: vendorId });

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  let productImages = [];
  let productResImages = [];

  if (req.files && req.files.length > 0) {
    productImages = req.files.map((file) => {
      const filenameWithoutSpaces = file.filename.replace(/\s+/g, "");
      productResImages.push(
        `https://marketplaceaws.waayupro.in/uploads/images/vendor/${filenameWithoutSpaces}`
      );
      return filenameWithoutSpaces;
    });
    vendor.gallery = productImages;
  }

  const result = await vendor.save();

  if (!result) {
    return res
      .status(400)
      .json({ message: "Error while uploading gallery!", success: false });
  }

  res.status(200).json({ data: result, success: true });
});

// Get Gallery Images
const getGalleryImages = asyncHandler(async (req, res) => {
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  let vendor = await Vendor.findOne({ _id: vendorId });

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  res.status(200).json({ data: vendor.gallery, success: true });
});

const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().select("_id name profileImage").limit(3);

  if (!vendors || vendors.length === 0) {
    return res.status(201).send([]);
  }

  const transformedVendors = vendors.map((vendor) => ({
    _id: vendor._id,
    name: vendor.name,
    image: `https://marketplaceaws.waayupro.in/uploads/images/vendor/${vendor.profileImage}`,
  }));

  return res.status(200).send(transformedVendors);
});

const calculateProfileScore = (vendor) => {
  let totalFields = 0;
  let completedFields = 0;

  // Function to check if a field is completed
  const isCompleted = (field) => {
    return field !== undefined && field !== null && field !== "";
  };

  // Helper function to count fields in nested objects
  const countFields = (obj, path = "") => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        totalFields++;
        if (isCompleted(obj[key])) {
          completedFields++;
        }
      }
    }
  };

  // List of fields to check
  const fieldsToCheck = [
    "name",
    "email",
    "password",
    "mobile",
    "status",
    "otp",
    "address",
    "city",
    "state",
    "pincode",
    "businessWebsite.website",
    "businessWebsite.number",
    "categories",
    "businessDetails.businessName",
    "businessDetails.legalBusinessName",
    "contactDetails.contactName",
    "contactDetails.designation",
    "contactDetails.owner",
    "contactDetails.whatsapp",
    "contactDetails.mobileNumber",
    "contactDetails.emailAddress",
    "contactDetails.landline",
    "contactDetails.tollFreeNumber",
    "locationDetails.buildingName",
    "locationDetails.streetName",
    "locationDetails.landmark",
    "locationDetails.area",
    "locationDetails.pincode",
    "locationDetails.city",
    "locationDetails.state",
    "locationDetails.country",
    "businessTimings.regular.days",
    "businessTimings.regular.regularTime",
    "businessTimings.holiday.days",
    "businessTimings.holiday.holidayTimings",
    "businessTimings.isAdditionalNote",
    "businessTimings.notes",
    "establishment.month",
    "establishment.year",
    "turnover",
    "employees",
    "social.facebook",
    "social.instagram",
    "social.twitter",
    "social.youtube",
    "social.linkedin",
    "social.others",
    "deviceId",
    "fcmId",
    "hashKey",
    "profileImage",
    "isPayment",
    "notes.userId",
    "notes.response",
    "notes.amount",
    "razorpayResponse.razorpayPaymentId",
    "razorpayResponse.razorpayOrderId",
    "razorpayResponse.razorpaySignature",
    "easeBuzzResponse.bankRefNumber",
    "easeBuzzResponse.easepayId",
    "easeBuzzResponse.email",
    "easeBuzzResponse.hash",
    "easeBuzzResponse.key",
    "easeBuzzResponse.status",
    "easeBuzzResponse.txnId",
    "isCouponApplied",
    "couponAmount",
    "couponCode",
    "couponDiscount",
    "rateCard",
    "gallery",
    "kyc.businessType",
    "kyc.personName",
    "kyc.hasGstin",
    "kyc.gstNumber",
  ];

  // Check each field
  fieldsToCheck.forEach((field) => {
    const value = field
      .split(".")
      .reduce((o, i) => (o ? o[i] : undefined), vendor);
    totalFields++;
    if (isCompleted(value)) {
      completedFields++;
    }
  });

  // Calculate the percentage
  const profileScore = (completedFields / totalFields) * 100;

  return Math.round(profileScore); // Return the score as a percentage
};

const getVendorProfileScore = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  try {
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) {
      return res
        .status(404)
        .json({ message: "Vendor not found", success: false });
    }

    let enquiry = await Enquiry.find({
      vendorId: vendorId,
    }).countDocuments();

    if (!enquiry) {
      enquiry = 0;
    }

    const profileScore = calculateProfileScore(vendor) + "%";

    res
      .status(200)
      .json({ profileScore, enquiryCount: enquiry, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Mobile App
// const getVendorInfo = asyncHandler(async (req, res) => {
//   const { vendorId } = req.body;

//   if (!vendorId) {
//     return res.status(400).json({ message: "Please provide the vendorId!" });
//   }

//   const vendor = await Vendor.findById(vendorId);

//   if (!vendor) {
//     return res
//       .status(400)
//       .json({ message: "Vendor not found!", success: false });
//   }

//   const enquiries = await ChatEnquiries.find({
//     vendorId: vendorId,
//   }).countDocuments();

//   const products = await Product.find({ vendorId: vendorId });

//   const formatProducts = products.map((product) => ({
//     _id: product._id,
//     name: product.productName,
//     image: `https://marketplaceaws.waayupro.in/uploads/images/product/${product?.productImage[0]}`,
//     singlePrice: product.singlePrice || "",
//     priceRange: product.priceRange || "",
//     priceBasedOnQty: product.priceBasedOnQty || "",
//   }));

//   let yearDifference;

//   let establishmentYear = vendor?.establishment?.year || 0;

//   if (establishmentYear > 0) {
//     // Get the current year
//     const currentYear = new Date().getFullYear();

//     // Calculate the difference between the current year and establishment year
//     yearDifference = currentYear - establishmentYear;
//   }

//   let categories = vendor.categories || [];

//   // Create an array of promises to fetch the product counts for each category
//   const categoryProductCounts = await Promise.all(
//     categories.map(async (category) => {
//       const productCount = await Product.find({
//         vendorId: vendorId,
//         categoryId: category.categoryId,
//       }).countDocuments();
//       return {
//         ...category._doc,
//         products: productCount,
//       };
//     })
//   );

//   // Add the "All" category at the beginning of the array
//   categoryProductCounts.unshift({ categoryName: "All" });

//   const data = {
//     _id: vendor._id,
//     name: vendor.name,
//     image: `https://marketplaceaws.waayupro.in/uploads/images/vendor/${vendor.profileImage}`,
//     address: vendor.address,
//     city: vendor.city || "",
//     mobile: vendor.mobile || "",
//     state: vendor?.locationDetails?.state || "",
//     pincode: vendor?.locationDetails?.pincode || "",
//     year: yearDifference,
//     enquiries: enquiries || 0,
//     rating: vendor?.rating || 0,
//     businessDays: vendor?.businessTimings?.regular?.days || "",
//     businessTime: vendor?.businessTimings?.regular?.regularTime || "",
//     categories: categoryProductCounts,
//     products: formatProducts,
//   };

//   res.status(200).json({ data, success: true });
// });

const getVendorInfo = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  const enquiries = await ChatEnquiries.find({
    vendorId: vendorId,
  }).countDocuments();

  const products = await Product.find({ vendorId: vendorId });

  const formatProducts = products.map((product) => ({
    _id: product._id,
    name: product.productName,
    image: `https://marketplaceaws.waayupro.in/uploads/images/product/${product?.productImage[0]}`,
    singlePrice: product.singlePrice || "",
    priceRange: product.priceRange || "",
    priceBasedOnQty: product.priceBasedOnQty || "",
    categoryId: product.categoryId,
    isService: product.isService,
  }));

  let yearDifference;

  let establishmentYear = vendor?.establishment?.year || 0;

  if (establishmentYear > 0) {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Calculate the difference between the current year and establishment year
    yearDifference = currentYear - establishmentYear;
  }

  let categories = vendor.categories || [];

  // Create an array to hold the formatted categories
  const formattedCategories = categories.map((category) => {
    const categoryProducts = formatProducts.filter(
      (product) =>
        product.categoryId.toString() === category.categoryId.toString()
    );

    return {
      ...category._doc,
      products: categoryProducts.slice(0, 3),
      numberOfProducts: categoryProducts.length,
    };
  });

  // Add the "All" category containing all products (limit to 3 for display)
  formattedCategories.unshift({
    categoryName: "All",
    products: formatProducts.slice(0, 3),
    numberOfProducts: formatProducts.length,
  });

  const data = {
    _id: vendor._id,
    name: vendor.name,
    image: `https://marketplaceaws.waayupro.in/uploads/images/vendor/${vendor.profileImage}`,
    address: vendor.address,
    city: vendor.city || "",
    mobile: vendor.mobile || "",
    state: vendor?.locationDetails?.state || "",
    pincode: vendor?.locationDetails?.pincode || "",
    year: yearDifference,
    enquiries: enquiries || 0,
    rating: vendor?.rating || 0,
    businessDays: vendor?.businessTimings?.regular?.days || "",
    businessTime: vendor?.businessTimings?.regular?.regularTime || "",
    categories: formattedCategories,
  };

  res.status(200).json({ data, success: true });
});

const vendorOverview = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({ message: "Please provide the vendorId!" });
  }

  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  let yearDifference;

  let establishmentYear = vendor?.establishment?.year || 0;

  if (establishmentYear > 0) {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Calculate the difference between the current year and establishment year
    yearDifference = currentYear - establishmentYear;
  }

  const data = {
    _id: vendor._id,
    name: vendor.name,
    address: vendor.address,
    city: vendor?.city || "",
    state: vendor?.locationDetails?.state || "",
    pincode: vendor?.locationDetails?.pincode || "",
    streetName: vendor?.locationDetails?.streetName || "",
    buildingName: vendor?.locationDetails?.buildingName || "",
    establishmentYear: vendor?.establishment?.year || "",
    rating: vendor?.rating || 0,
    businessDays: vendor?.businessTimings?.regular?.days || "",
    businessTime: vendor?.businessTimings?.regular?.regularTime || "",
    gstin: vendor?.kyc?.gstNumber || "",
  };

  res.status(200).json({ data, success: true });
});

const getVendorCity = asyncHandler(async (req, res) => {
  const vendor = await Vendor.find();

  if (!vendor || vendor.length === 0) {
    return res
      .status(400)
      .json({ message: "Vendor not found!", success: false });
  }

  const cities = vendor
    .map((elem) => elem.locationDetails?.city)
    .filter((city) => city && city.trim() !== "");

  const uniqueCities = [...new Set(cities)];

  const cityObjects = uniqueCities.map((city) => ({ name: city }));

  res.status(200).json({ data: cityObjects, success: true });
});

module.exports = {
  registerVendor,
  loginVendor,
  verifyOtp,
  loginWithEmail,
  updateVendor,
  updateVendorDetails,
  getVendor,
  initiateRazorpay,
  storeRazorpayResponse,
  easebuzzPaymentInitiate,
  storeEasebuzzResponse,
  holidayList,
  uploadRateCard,
  uploadGallery,
  getRateCard,
  getGalleryImages,
  getAllVendors,
  getVendorProfileScore,
  getVendorInfo,
  vendorOverview,
  getVendorCity,
};
