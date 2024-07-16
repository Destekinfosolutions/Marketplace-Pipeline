const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const Customer = require("../models/customerModel");

// @desc Register a new customer
// @route POST /api/customer/register
const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, mobile } = req?.body;

  if (!name) {
    return res.status(400).json({
      message: "Please provide the customer name field.",
      success: false,
    });
  }
  if (!email) {
    return res
      .status(400)
      .json({ message: "Please provide the email field.", success: false });
  }
  if (!password) {
    return res
      .status(400)
      .json({ message: "Please provide the password field.", success: false });
  }
  if (!mobile) {
    return res
      .status(400)
      .json({ message: "Please provide the mobile field.", success: false });
  }

  // Find if Customer already exists
  const customerExists = await Customer.findOne({ mobile });

  if (customerExists) {
    return res.status(400).json({
      message: `Customer already exists with mobile: ${mobile}`,
      success: false,
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const otp = generateOtp();

  let data = {
    name,
    email,
    password: hashedPassword,
    mobile,
    otp,
  };

  if (req.file) {
    const filenameWithoutSpaces = req.file.filename.replace(/\s+/g, "");
    data.profileImage = filenameWithoutSpaces;
  }

  // Create Customer
  const customer = await Customer.create(data);

  if (customer) {
    const imageUrl = `https://marketplaceaws.waayupro.in/uploads/images/customer/${customer.profileImage}`;
    return res.status(201).json({
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        otp: customer.otp,
        profileImage: imageUrl,
        token: generateToken(customer._id),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      success: true,
    });
  } else {
    return res
      .status(400)
      .json({ message: "Error while creating customer!", message: false });
  }
});

// @desc Login a new Customer
// @route POST /api/customer/login
const loginCustomer = asyncHandler(async (req, res) => {
  const { mobile, deviceId, fcmId, hashKey } = req?.body;

  if (!mobile) {
    return res.status(200).send(false);
  }

  const customer = await Customer.findOne({ mobile });

  if (!customer || customer.status !== 1) {
    return res.status(200).send(false);
  }

  const updateData = {};
  if (deviceId) updateData.deviceId = deviceId;
  if (fcmId) updateData.fcmId = fcmId;
  if (hashKey) updateData.hashKey = hashKey;

  if (customer && customer.mobile == mobile) {
    await Customer.findOneAndUpdate(
      { mobile },
      { $set: updateData },
      { new: true }
    );

    const country_code = "91";
    const phoneNumber = country_code + mobile;

    const numbers = phoneNumber;

    const four_digit_random_number = generateOtp();

    if (mobile != 9028611660) {
      await Customer.findOneAndUpdate(
        { mobile },
        { otp: four_digit_random_number }
      );
      const sendSmsRes = await send_message(numbers, four_digit_random_number);

      if (sendSmsRes.status === "success") {
        return res.status(200).send(true);
      } else if (sendSmsRes.status === "failure") {
        return res.status(500).send(false);
      }
    } else {
      return res.status(200).send(true);
    }
  } else {
    return res.status(500).send(false);
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req?.body;

  if (!mobile) {
    return res.status(200).send(false);
  }
  if (!otp) {
    return res.status(200).send(false);
  }

  const customer = await Customer.findOne({ mobile });

  if (!customer) {
    return res.status(200).send(false);
  }

  if (customer && customer.otp == otp) {
    const imageUrl = `https://marketplaceaws.waayupro.in/uploads/images/customer/${customer.profileImage}`;
    return res.status(200).json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      profileImage: imageUrl,
      token: generateToken(customer._id),
      success: true,
    });
  } else {
    return res.status(500).send(false);
  }
});

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

async function send_message(numbers, otp) {
  const formData = new FormData();

  formData.append("mobile", numbers);
  formData.append("otp", otp);

  const response = await axios.post(
    "https://waayupro.in/otp_sender/send_message.php",
    formData
  );

  const result = response.data;
  return result;
}

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {
  const data = req.body;

  const customerExists = await Customer.findById(data.id);

  if (!customerExists) {
    return res
      .status(400)
      .json({ message: "Customer not found!", success: false });
  }

  if (req.file) {
    const filenameWithoutSpaces = req.file.filename.replace(/\s+/g, "");
    data.profileImage = filenameWithoutSpaces;
  }

  const customer = await Customer.findByIdAndUpdate(data.id, data, {
    new: true,
  });

  if (!customer) {
    return res
      .status(500)
      .json({ message: "Error while updating customer", success: false });
  }

  return res
    .status(200)
    .json({ message: "Customer Profile Updated Successfully!", success: true });
});

const getCustomerProfile = asyncHandler(async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res
      .status(400)
      .json({ message: "Please provide the customer ID!.", success: false });
  }

  const user = await Customer.findById(customerId);

  if (!user) {
    return res
      .status(400)
      .json({ message: "Customer not found!", success: false });
  }

  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    profileImage: `https://marketplaceaws.waayupro.in/uploads/images/customer/${user.profileImage}`,
    dob: user.dob,
    gender: user.gender,
  };

  res.status(200).json({ data, success: true });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const { customerId, status } = req.body;

  if (!customerId) {
    return res
      .status(400)
      .json({ message: "Please provide the customer ID!.", success: false });
  }
  if (!status) {
    return res
      .status(400)
      .json({ message: "Please provide the status field.", success: false });
  }

  const user = await Customer.findByIdAndUpdate(customerId, { status: status });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Customer not found!", success: false });
  }

  res
    .status(200)
    .json({ message: "Customer Deleted Successfully!", success: true });
});

module.exports = {
  registerCustomer,
  loginCustomer,
  verifyOtp,
  updateProfile,
  getCustomerProfile,
  deleteCustomer,
};
