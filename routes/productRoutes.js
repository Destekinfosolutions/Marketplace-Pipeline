const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  bulkUpload,
  getVendorProducts,
  getProductsBasedOnVendorOrCategory,
  getProductDetails,
  getProductBestPriceDetail,
} = require("../controllers/productController");
const { protect } = require("../middleware/vendorAuthMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads/images/product");
  },
  filename: function (req, file, cb) {
    const filenameWithoutSpaces = file.originalname.replace(/\s+/g, "");
    return cb(null, `${Date.now()}-${filenameWithoutSpaces}`);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  upload.fields([
    { name: "productImage", maxCount: 12 },
    { name: "attachment", maxCount: 12 },
  ]),
  protect,
  createProduct
);
router.get("/all", protect, getAllProducts);
router.get("/", protect, getProductsBasedOnVendorOrCategory);
router.get("/detail", protect, getProductDetails); // app side
router.get("/vendor", protect, getVendorProducts);
router.post("/best-price-detail", protect, getProductBestPriceDetail);
router.post("/bulk", upload.single("excelFile"), protect, bulkUpload);
router
  .route("/:id")
  .all(protect)
  .get(getProduct)
  .put(upload.array("productImage"), updateProduct)
  .delete(deleteProduct);

module.exports = router;
