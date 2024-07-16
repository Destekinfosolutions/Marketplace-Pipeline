const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/vendorAuthMiddleware");

const {
  registerVendor,
  loginVendor,
  verifyOtp,
  updateVendor,
  initiateRazorpay,
  storeRazorpayResponse,
  easebuzzPaymentInitiate,
  getVendor,
  updateVendorDetails,
  storeEasebuzzResponse,
  loginWithEmail,
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
} = require("../controllers/vendorController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads/images/vendor");
  },
  filename: function (req, file, cb) {
    const filenameWithoutSpaces = file.originalname.replace(/\s+/g, "");
    return cb(null, `${Date.now()}-${filenameWithoutSpaces}`);
  },
});

const upload = multer({ storage });

router.post("/register", upload.single("profileImage"), registerVendor);
router.post("/login-otp", loginVendor);
router.post("/login-email", loginWithEmail);
router.post("/verify-otp", verifyOtp);
router.get("/holiday-list", protect, holidayList);
router.get("/all", protect, getAllVendors);
router.post("/rate-card", upload.array("rateCard"), protect, uploadRateCard);
router.post("/gallery", upload.array("gallery"), protect, uploadGallery);
router.get("/rate-card", protect, getRateCard);
router.post("/profile-score", protect, getVendorProfileScore);
router.get("/gallery", protect, getGalleryImages);
router.put("/update", upload.single("profileImage"), protect, updateVendor);
router.post("/profile-info", protect, getVendorInfo);
router.post("/profile-overview", protect, vendorOverview);
router.get("/city", protect, getVendorCity);
// Razorpay
router.post("/razorpay-initiate", protect, initiateRazorpay);
router.post("/razorpay-response", protect, storeRazorpayResponse);
// Easebuzz
router.post("/easebuzz-initiate", protect, easebuzzPaymentInitiate);
router.post("/easebuzz-response", protect, storeEasebuzzResponse);
router
  .route("/:id")
  .all(protect)
  .get(getVendor)
  .put(upload.single("profileImage"), updateVendorDetails);

module.exports = router;
