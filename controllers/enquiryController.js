const asyncHandler = require("express-async-handler");
const moment = require("moment-timezone");

const Enquiry = require("../models/enquiryModel");
const Vendor = require("../models/vendorModel");

// Create
const createEnquiry = asyncHandler(async (req, res) => {
  const data = req.body;

  if (!data.customerId) {
    return res
      .status(500)
      .json({ message: "Please provide the customerId", success: false });
  }

  if (!data.productId) {
    return res
      .status(500)
      .json({ message: "Please provide the productId", success: false });
  }
  if (!data.vendorId) {
    return res
      .status(500)
      .json({ message: "Please provide the vendorId", success: false });
  }

  const enquiry = await Enquiry.create(data);

  if (!enquiry) {
    return res
      .status(500)
      .json({ message: "Error while creating enquiry!", success: false });
  }

  res.status(201).send(enquiry);
});

// Get All
const getAllEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const vendorId = req.query.vendorId;
  const limit = 8;
  const skip = (page - 1) * limit;

  const enquiries = await Enquiry.find({ vendorId: vendorId })
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Get Single
const getSingleEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).populate({
    path: "productId",
    select: "productName productImage vendorId",
  });

  if (!enquiry) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const vendorId = enquiry.productId.vendorId;

  // Fetch the vendor data
  const vendor = await Vendor.findById(vendorId).select("mobile");

  const result = {
    _id: enquiry._id,
    customerId: enquiry.customerId,
    productId: enquiry.productId._id,
    productName: enquiry.productId.productName,
    productImage:
      `https://marketplaceaws.waayupro.in/uploads/images/product/${enquiry.productId.productImage[0]}`
        ? `https://marketplaceaws.waayupro.in/uploads/images/product/${enquiry.productId.productImage[0]}`
        : "",
    mobile: vendor ? vendor.mobile : "",
    quantity: enquiry.quantity ? enquiry.quantity : "",
    unit: enquiry.unit ? enquiry.unit : "",
    comment: enquiry.comment ? enquiry.comment : "",
  };

  res.status(200).json({ data: result, success: true });
});

// Update
const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  })
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    });

  if (!enquiry) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  res.status(200).json({ data: enquiry, success: true });
});

// Delete
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiryId = req?.params?.id;

  if (!enquiryId) {
    return res
      .status(400)
      .json({ message: "Please provide the enquiry Id.", success: false });
  }

  const enquiry = await Enquiry.findById(enquiryId);

  if (!enquiry) {
    return res
      .status(404)
      .json({ message: "Enquiry Not Found!", success: false });
  }

  await Enquiry.deleteOne({ _id: enquiryId });

  res.status(200).json({ success: true });
});

// Get Read Enquiries
const getReadEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the vendor Id.", success: false });
  }
  const limit = 8;
  const skip = (page - 1) * limit;

  const enquiries = await Enquiry.find({ isRead: true, vendorId: vendorId })
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.find({
    isRead: true,
    vendorId: vendorId,
  }).countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Get Un-Read Enquiries
const getUnReadEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the vendor Id.", success: false });
  }

  const limit = 8;
  const skip = (page - 1) * limit;

  const enquiries = await Enquiry.find({ isRead: false, vendorId: vendorId })
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.find({
    isRead: false,
    vendorId: vendorId,
  }).countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Filter All
const filterEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the vendor Id.", success: false });
  }

  const limit = 8;
  const skip = (page - 1) * limit;

  const enquiryStatus = req.query.q;

  let query;

  if (enquiryStatus === "all") {
    query = { vendorId: vendorId };
  } else if (!enquiryStatus) {
    return res
      .status(400)
      .json({ message: "Please provide the enquiry status.", success: false });
  } else {
    query = {
      enquiryStatus: { $regex: enquiryStatus, $options: "i" },
      vendorId: vendorId,
    };
  }

  const enquiries = await Enquiry.find(query)
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.find(query).countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Filter Read Enquiries
const filterReadEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;
  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the vendor Id.", success: false });
  }

  const enquiryStatus = req.query.q;

  let query;

  if (enquiryStatus === "all") {
    query = {
      isRead: true,
      vendorId: vendorId,
    };
  } else if (!enquiryStatus) {
    return res
      .status(400)
      .json({ message: "Please provide the enquiry status.", success: false });
  } else {
    query = {
      enquiryStatus: { $regex: enquiryStatus, $options: "i" },
      isRead: true,
      vendorId: vendorId,
    };
  }

  const enquiries = await Enquiry.find(query)
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.find(query).countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Filter Un-Read Enquiries
const filterUnReadEnquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  const vendorId = req.query.vendorId;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide the vendor Id.", success: false });
  }

  const enquiryStatus = req.query.q;

  let query;

  if (enquiryStatus === "all") {
    query = { isRead: false, vendorId: vendorId };
  } else if (!enquiryStatus) {
    return res
      .status(400)
      .json({ message: "Please provide the enquiry status.", success: false });
  } else {
    query = {
      enquiryStatus: { $regex: enquiryStatus, $options: "i" },
      isRead: false,
      vendorId: vendorId,
    };
  }

  const enquiries = await Enquiry.find(query)
    .populate({
      path: "customerId",
      select: "name mobile",
    })
    .populate({
      path: "productId",
      select: "productName productImage",
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!enquiries || enquiries.length === 0) {
    return res
      .status(404)
      .json({ message: "No Enquiry Found!", success: false });
  }

  const totalEnquiries = await Enquiry.find(query).countDocuments();

  const data = {
    totalEnquiries,
    enquiries,
  };

  res.status(200).json({ data, success: true });
});

// Get Customer Enquiry For Mobile
const customerEnquiry = asyncHandler(async (req, res) => {
  const customerId = req.query.custId;
  const status = req.query.status;
  let sortQuery;

  if (status == "old") {
    sortQuery = { createdAt: 1 };
  } else {
    sortQuery = { createdAt: -1 };
  }

  const enquiries = await Enquiry.find({ customerId })
    .populate({
      path: "productId",
      select: "_id productName productImage vendorId",
    })
    .sort(sortQuery);

  if (!enquiries || enquiries.length === 0) {
    return res.status(200).send([]);
  }

  const transformedEnquiry = await Promise.all(
    enquiries.map(async (enquiry) => {
      if (!enquiry?.productId) {
        // Skip this enquiry if productId is null
        return null;
      }

      const vendorId = enquiry.productId.vendorId;

      let vendorMobile = "";
      let vendorName = "";
      let vendorCity = "";
      if (vendorId) {
        // Fetch the vendor data if vendorId is present
        const vendor = await Vendor.findById(vendorId).select(
          "mobile name city"
        );
        vendorMobile = vendor ? vendor.mobile : "";
        vendorName = vendor ? vendor.name : "";
        vendorCity = vendor ? vendor.city : "";
      }

      return {
        _id: enquiry._id,
        customerId: enquiry.customerId,
        productId: enquiry.productId._id,
        vendorId: enquiry.productId.vendorId,
        vendorName: vendorName,
        productName: enquiry.productId.productName,
        productImage:
          enquiry.productId.productImage.length > 0
            ? `https://marketplaceaws.waayupro.in/uploads/images/product/${enquiry.productId.productImage[0]}`
            : "",
        mobile: vendorMobile,
        city: vendorCity,
        quantity: enquiry.quantity || "",
        unit: enquiry.unit || "",
        comment: enquiry.comment || "",
        createdAt: moment(enquiry.createdAt)
          .tz("Asia/Calcutta")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
    })
  );

  // Filter out any null values from the transformedEnquiry array
  const filteredEnquiry = transformedEnquiry.filter((item) => item !== null);

  res.status(200).send(filteredEnquiry);
});

function splitAndFormatDate(dateStr) {
  // Create a Date object from the ISO date string
  const date = new Date(dateStr);

  // Extract individual components
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // getUTCMonth() is zero-based
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  // Format as MM/DD/YYYY HH:MM:SS
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

  return formattedDate;
}

// Search Enquiry
const searchEnquiry = asyncHandler(async (req, res) => {
  try {
    const q = req.query.q;
    const page = parseInt(req?.query?.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    console.log("Search query:", q);

    const regexQuery = new RegExp(q, "i");

    const enquiries = await Enquiry.aggregate([
      {
        $lookup: {
          from: "customers", // Assuming the name of the customers collection
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "products", // Assuming the name of the products collection
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $match: {
          $or: [
            { "product.productName": { $regex: regexQuery } },
            { "customer.name": { $regex: regexQuery } },
          ],
        },
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ["$customer", 0] },
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          quantity: 1,
          comment: 1,
          enquiryStatus: 1,
          isRead: 1,
          customer: { name: "$customer.name", mobile: "$customer.mobile" },
          product: {
            productName: "$product.productName",
            productImage: "$product.productImage",
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // console.log("Enquiries found:", enquiries);

    if (!enquiries || enquiries.length === 0) {
      return res
        .status(404)
        .json({ message: "No Enquiry Found!", success: false });
    }

    const data = {
      totalEnquiries: enquiries.length,
      enquiries,
      success: true,
    };

    res.status(200).send(data);
  } catch (error) {
    console.error("Error searching enquiries:", error.message);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getSingleEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getReadEnquiries,
  getUnReadEnquiries,
  filterEnquiries,
  filterReadEnquiries,
  filterUnReadEnquiries,
  customerEnquiry,
  searchEnquiry,
};
