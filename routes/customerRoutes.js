const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  registerCustomer,
  loginCustomer,
  verifyOtp,
  updateProfile,
  getCustomerProfile,
  deleteCustomer,
} = require("../controllers/customerController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads/images/customer");
  },
  filename: function (req, file, cb) {
    const filenameWithoutSpaces = file.originalname.replace(/\s+/g, "");
    return cb(null, `${Date.now()}-${filenameWithoutSpaces}`);
  },
});

const upload = multer({ storage });

router.post("/register", upload.single("profileImage"), registerCustomer);
router.post("/login", loginCustomer);
router.post("/verify-otp", verifyOtp);
router.post("/profile", getCustomerProfile);
router.post("/delete", deleteCustomer);
router.post("/update", upload.single("profileImage"), updateProfile);

module.exports = router;
