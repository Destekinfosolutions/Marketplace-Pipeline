const asyncHandler = require("express-async-handler");
const excelToJson = require("convert-excel-to-json");
const fs = require("fs-extra");
const Category = require("../models/categoryModel");
const Vendor = require("../models/vendorModel");
const SubCategory = require("../models/subCategoryModel");
const Product = require("../models/productModel");
const Enquiry = require("../models/enquiryModel");
const SavedItem = require("../models/savedItemsModel");

// @desc Create a new product
// @route POST /api/product
// const createProduct = asyncHandler(async (req, res) => {
//   let data = req.body;

//   console.log(req.body);
//   console.log(req.files);

//   if (!data?.vendorId) {
//     return res
//       .status(400)
//       .json({ message: "Please provide the Vendor ID.", success: false });
//   }

//   const vendorExists = await Vendor.findById(data?.vendorId);

//   if (!vendorExists) {
//     return res
//       .status(400)
//       .json({ message: "Vendor does not exists!", success: false });
//   }

//   const categoryExists = await Category.findById(data?.categoryId);

//   if (!categoryExists) {
//     return res
//       .status(400)
//       .json({ message: "Category does not exists!", success: false });
//   }

//   if (!data?.subCategoryId) {
//     return res
//       .status(400)
//       .json({ message: "Please provide the sub category ID.", success: false });
//   }

//   const subCategoryExists = await SubCategory.findById(data?.subCategoryId);

//   if (!subCategoryExists) {
//     return res
//       .status(400)
//       .json({ message: "Product does not exists!", success: false });
//   }

//   if (!data?.productName) {
//     return res
//       .status(400)
//       .json({ message: "Please provide the product name.", success: false });
//   }

//   let productImages = [];
//   let productResImages = [];

//   if (req.files && req.files.length > 0) {
//     productImages = req.files.map((file) => {
//       const filenameWithoutSpaces = file.filename.replace(/\s+/g, "");
//       productResImages.push(
//         `https://marketplaceaws.waayupro.in/uploads/${filenameWithoutSpaces}`
//       );
//       return filenameWithoutSpaces;
//     });
//     data.productImage = productImages;
//   }

//   const product = await Product.create(data);

//   if (product) {
//     if (data.productImage && data.productImage.length > 0) {
//       product.productImage = productResImages;
//     }

//     return res.status(201).json({
//       data: product,
//       success: true,
//     });
//   } else {
//     return res
//       .status(500)
//       .json({ message: "Product creation failed.", success: false });
//   }
// });
const createProduct = asyncHandler(async (req, res) => {
  let data = req.body;

  if (!data?.vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the Vendor ID.", success: false });
  }

  const vendorExists = await Vendor.findById(data?.vendorId);

  if (!vendorExists) {
    return res
      .status(400)
      .json({ message: "Vendor does not exist!", success: false });
  }

  const categoryExists = await Category.findById(data?.categoryId);

  if (!categoryExists) {
    return res
      .status(400)
      .json({ message: "Category does not exist!", success: false });
  }

  if (!data?.subCategoryId) {
    return res
      .status(400)
      .json({ message: "Please provide the sub category ID.", success: false });
  }

  const subCategoryExists = await SubCategory.findById(data?.subCategoryId);

  if (!subCategoryExists) {
    return res
      .status(400)
      .json({ message: "Sub Category does not exist!", success: false });
  }

  if (!data?.productName) {
    return res
      .status(400)
      .json({ message: "Please provide the product name.", success: false });
  }

  let productImages = [];
  let attachmentImages = [];

  // Check if product images were uploaded
  if (req.files && Object.keys(req.files).length > 0) {
    Object.values(req.files).forEach((files) => {
      files.forEach((file) => {
        const filenameWithoutSpaces = file.filename.replace(/\s+/g, "");
        if (file.fieldname === "productImage") {
          productImages.push(filenameWithoutSpaces);
        } else if (file.fieldname === "attachment") {
          attachmentImages.push(filenameWithoutSpaces);
        }
      });
    });
  }

  data.productImage = productImages;
  data.attachment = attachmentImages;

  const product = await Product.create(data);

  if (product) {
    // Now, construct the URLs for frontend response
    const productImageURLs = productImages.map(
      (filename) =>
        `https://marketplaceaws.waayupro.in/uploads/images/product/${filename}`
    );
    const attachmentImageURLs = attachmentImages.map(
      (filename) =>
        `https://marketplaceaws.waayupro.in/uploads/images/product/${filename}`
    );

    return res.status(201).json({
      data: {
        ...product.toObject(), // Convert Mongoose document to plain JavaScript object
        productImage: productImageURLs,
        attachment: attachmentImageURLs,
      },
      success: true,
    });
  } else {
    return res
      .status(500)
      .json({ message: "Product creation failed.", success: false });
  }
});

// @desc Get product
// @route GET /api/product/:id
const getProduct = asyncHandler(async (req, res) => {
  const productId = req?.params?.id;

  if (!productId) {
    return res
      .status(500)
      .json({ message: "Please provide the product ID.", success: false });
  }

  let product = await Product.findById(productId)
    .populate({
      path: "vendorId",
      select: "name",
    })
    .populate({
      path: "categoryId",
      select: "categoryName",
    })
    .populate({
      path: "subCategoryId",
      select: "subCategoryName",
    });

  if (!product) {
    return res
      .status(500)
      .json({ message: "Product Not Found!", success: false });
  }

  let productResImages = [];

  if (product.productImage && product.productImage.length > 0) {
    product.productImage = product.productImage.map((image) => {
      return productResImages.push(
        `https://marketplaceaws.waayupro.in/uploads/images/product/${image}`
      );
    });
    product.productImage = productResImages;
  }

  // Restructure the product data
  let data = {
    ...product._doc,
    vendorId: product?.vendorId?._id,
    vendorName: product?.vendorId?.name,
    categoryId: product?.categoryId?._id,
    categoryName: product?.categoryId?.categoryName,
    subCategoryId: product?.subCategoryId?._id,
    subCategoryName: product?.subCategoryId?.subCategoryName,
  };

  res.status(200).json({
    data,
    success: true,
  });
});

// @desc Get all products
// @route GET /api/product/all
const getAllProducts = asyncHandler(async (req, res) => {
  let { isService } = req.query;

  if (!isService) {
    isService = false;
  }
  const products = await Product.find({ isService: isService })
    .populate({
      path: "vendorId",
      select: "name",
    })
    .populate({
      path: "categoryId",
      select: "categoryName",
    })
    .populate({
      path: "subCategoryId",
      select: "subCategoryName",
    });

  if (!products || products.length === 0) {
    return res.status(500).send(false);
  }

  const result = products.map((product) => {
    let productResImages = [];

    if (product.productImage && product.productImage.length > 0) {
      product.productImage = product.productImage.map((image) => {
        return productResImages.push(
          `https://marketplaceaws.waayupro.in/uploads/images/product/${image}`
        );
      });
      product.productImage = productResImages;
    }

    return {
      vendorId: product?.vendorId?._id._id,
      vendorName: product?.vendorId?.name,
      categoryId: product?.categoryId?._id,
      categoryName: product?.categoryId?.categoryName,
      subCategoryId: product?.subCategoryId?._id,
      subCategoryName: product?.subCategoryId?.subCategoryName,
      ...product._doc,
    };
  });

  return res
    .status(200)
    .json({ data: result, count: products.length, success: true });
});

// @desc Update Product
// @route PUT /api/product/:id
const updateProduct = asyncHandler(async (req, res) => {
  const productId = req?.params?.id;

  if (!productId) {
    return res
      .status(400)
      .json({ message: "Please provide the product ID.", success: false });
  }

  const productExists = await Product.findById(productId);

  if (!productExists) {
    res.status(404).json({ message: "Product not found!", success: false });
  }

  let data = req?.body;

  let productImages = [];
  let productResImages = [];

  if (req.files && req.files.length > 0) {
    productImages = req.files.map((file) => {
      const filenameWithoutSpaces = file.filename.replace(/\s+/g, "");
      productResImages.push(
        `https://marketplaceaws.waayupro.in/uploads/images/product/${filenameWithoutSpaces}`
      );
      return filenameWithoutSpaces;
    });
    data.productImage = productImages;
  }

  let product = await Product.findByIdAndUpdate(productId, data, {
    new: true,
  })
    .populate({
      path: "vendorId",
      select: "name",
    })
    .populate({
      path: "categoryId",
      select: "categoryName",
    })
    .populate({
      path: "subCategoryId",
      select: "subCategoryName",
    });

  if (!product) {
    return res
      .status(500)
      .json({ message: "Error while updating product!", success: false });
  }

  if (data.productImage && data.productImage.length > 0) {
    product.productImage = productResImages;
  }

  let result = {
    ...product._doc,
    vendorId: product?.vendorId?._id,
    vendorName: product?.vendorId?.name,
    categoryId: product?.categoryId?._id,
    categoryName: product?.categoryId?.categoryName,
    subCategoryId: product?.subCategoryId?._id,
    subCategoryName: product?.subCategoryId?.subCategoryName,
  };

  res.status(200).json({
    data: result,
    message: "Product Updated Successfully",
    success: true,
  });
});

// Get Particular Vendor Products
// /api/product/vendor?id=
const getVendorProducts = asyncHandler(async (req, res) => {
  const id = req?.query.id;
  let isService = req?.query.isService;

  if (!isService) {
    isService = false;
  }

  const products = await Product.find({ vendorId: id, isService: isService })
    .populate({
      path: "vendorId",
      select: "name",
    })
    .populate({
      path: "categoryId",
      select: "categoryName",
    })
    .populate({
      path: "subCategoryId",
      select: "subCategoryName",
    })
    .sort({ createdAt: -1 });

  if (!products || products.length === 0) {
    return res
      .status(404)
      .json({ message: "No Products Found!", success: false });
  }

  const result = products.map((product) => {
    let productResImages = [];

    if (product.productImage && product.productImage.length > 0) {
      product.productImage = product.productImage.map((image) => {
        return productResImages.push(
          `https://marketplaceaws.waayupro.in/uploads/images/product/${image}`
        );
      });
      product.productImage = productResImages;
    }

    return {
      ...product._doc,
      vendorId: product?.vendorId ? product?.vendorId?._id : "",
      vendorName: product?.vendorId ? product?.vendorId?.name : "",
      categoryId: product?.categoryId?._id,
      categoryName: product?.categoryId?.categoryName,
      subCategoryId: product?.subCategoryId?._id,
      subCategoryName: product?.subCategoryId?.subCategoryName,
    };
  });

  res.status(200).json({ data: result, success: true });
});

// Get Particular Vendor Products by vendorId OR CategoryId
// /api/product?
const getProductsBasedOnVendorOrCategory = asyncHandler(async (req, res) => {
  const { catId, vendorId, subCatId, customerId, isService } = req.query;

  let query = {};

  if (vendorId) {
    query.vendorId = vendorId;
  }

  if (catId) {
    query.categoryId = catId;
  }

  if (subCatId) {
    query.subCategoryId = subCatId;
  }
  if (isService) {
    query.isService = isService;
  }
  try {
    const products = await Product.find(query).populate("vendorId");

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No Product found!" });
    }

    const transformedProducts = await Promise.all(
      products.map(async (product) => {
        let isSaved = false;

        if (customerId) {
          const saveItem = await SavedItem.findOne({
            customerId,
            productId: product._id,
          });

          if (saveItem) {
            isSaved = saveItem.isSaved;
          }
        }

        let yearDifference;
        if (product?.vendorId?.establishment?.year) {
          const establishmentYear = product?.vendorId?.establishment?.year || 0;

          if (establishmentYear > 0) {
            const currentYear = new Date().getFullYear();
            yearDifference = currentYear - establishmentYear;
          }
        }

        return {
          _id: product?._id,
          name: product?.productName || "",
          image: `https://marketplaceaws.waayupro.in/uploads/images/product/${product.productImage[0]}`,
          price: product?.singlePrice?.price || 0,
          city: product?.city || "",
          vendorId: product?.vendorId?._id || "",
          vendorName: product?.vendorId?.name || "",
          mobile: product?.vendorId?.mobile || "",
          year: yearDifference || 0,
          verified: true,
          enquiries: 0,
          isSaved: isSaved,
          isService: product?.isService,
        };
      })
    );

    res.status(200).send(transformedProducts);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// @desc Delete Product
// @route DELETE /api/product/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req?.params?.id;

  if (!productId) {
    return res
      .status(400)
      .json({ message: "Please provide the product ID.", success: false });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res
      .status(404)
      .json({ message: "Product Not Found!", success: false });
  }

  await Product.deleteOne({ _id: productId });

  res.status(200).json({ success: true });
});

const bulkUpload = asyncHandler(async (req, res) => {
  if (!req?.file) {
    return res.json({ message: "No File Found!", success: false });
  } else {
    const filenameWithoutSpaces =
      "uploads/" + req.file.filename.replace(/\s+/g, "");

    const excelData = excelToJson({
      sourceFile: filenameWithoutSpaces,
      header: {
        rows: 1,
      },
      columnToKey: {
        "*": "{{columnHeader}}",
      },
    });

    fs.remove(filenameWithoutSpaces);

    const excelSheetName = Object.keys(excelData)[0];

    const data = excelData[excelSheetName];

    // Can add checks before adding if vendor, category, subcategory exists

    const products = await Product.insertMany(data);

    if (!products || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Error while adding products", success: false });
    }

    res.status(201).json({
      data: products,
      success: true,
      message: "Products Added Successfully.",
    });
  }
});

const getProductDetails = asyncHandler(async (req, res) => {
  const { productId, customerId } = req.query; // Add customerId to the query

  try {
    const product = await Product.findById(productId).populate("vendorId");

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    const enquiry = await Enquiry.find({ productId });

    let yearDifference;
    if (product?.vendorId?.establishment?.year) {
      const establishmentYear = product?.vendorId?.establishment?.year || 0;

      if (establishmentYear > 0) {
        const currentYear = new Date().getFullYear();
        yearDifference = currentYear - establishmentYear;
      }
    }

    let productResImages = [];

    if (product?.productImage && product?.productImage?.length > 0) {
      productResImages = product?.productImage?.map((image) => {
        return `https://marketplaceaws.waayupro.in/uploads/images/product/${image}`;
      });
    }

    // Check if the product is saved by the customer
    let isSaved = false;
    if (customerId) {
      const saveItem = await SavedItem.findOne({
        customerId,
        productId: product._id,
      });

      if (saveItem) {
        isSaved = saveItem.isSaved;
      }
    }

    const data = {
      _id: product?._id,
      productName: product?.productName,
      vendorId: product?.vendorId?._id || "",
      vendorName: product?.vendorId.name || "",
      vendorImage: product?.vendorId.profileImage
        ? `https://marketplaceaws.waayupro.in/uploads/images/vendor/${product?.vendorId.profileImage}`
        : "",
      responseRate: "83%",
      image: productResImages,
      price: product?.singlePrice?.price ? product?.singlePrice?.price : "",
      city: product?.city ? product?.city : "",
      description: product?.description ? product?.description : "",
      enquiries: enquiry?.length ? enquiry?.length : 0,
      categoryName: product?.categoryName ? product?.categoryName : "",
      subCategoryName: product?.subCategoryName ? product?.subCategoryName : "",
      priceRange: product?.priceRange ? product?.priceRange : "",
      specification: product?.specification?.inputs
        ? product?.specification?.inputs
        : "",
      priceBasedOnQty: product?.priceBasedOnQty ? product?.priceBasedOnQty : "",
      mobile: product?.vendorId?.mobile ? product?.vendorId?.mobile : "",
      year: yearDifference ? yearDifference : 0,
      isSaved: isSaved,
      isService: product?.isService,
    };

    res.status(200).send(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

const getProductBestPriceDetail = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res
      .status(400)
      .json({ message: "Please provide the product ID.", success: false });
  }

  const product = await Product.findOne({ _id: productId }).populate(
    "vendorId"
  );

  if (!product || product.length === 0) {
    return res
      .status(404)
      .json({ message: "Product Not Found!", success: false });
  }

  let productResImages = [];

  if (product.productImage && product.productImage.length > 0) {
    product.productImage = product.productImage.map((image) => {
      return productResImages.push(
        `https://marketplaceaws.waayupro.in/uploads/images/product/${image}`
      );
    });
    product.productImage = productResImages;
  }
  let yearDifference;
  if (product.vendorId.establishment.year) {
    const establishmentYear = product.vendorId.establishment.year;

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Calculate the difference between the current year and establishment year
    yearDifference = currentYear - establishmentYear;
  }

  const data = {
    _id: product._id,
    productName: product?.productName,
    vendorName: product?.vendorId?.name,
    vendorId: product?.vendorId?._id,
    mobile: product?.vendorId?.mobile,
    image: productResImages,
    city: product?.city ? product?.city : "",
    description: product?.description ? product?.description : "",
    year: yearDifference ? yearDifference : 0,
    isService: product?.isService,
  };

  res.status(200).send(data);
});

module.exports = {
  createProduct,
  getProduct,
  getAllProducts,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  bulkUpload,
  getProductsBasedOnVendorOrCategory,
  getProductDetails,
  getProductBestPriceDetail,
};
