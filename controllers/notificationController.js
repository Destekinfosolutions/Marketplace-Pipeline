const asyncHandler = require("express-async-handler");
const moment = require("moment-timezone");
const admin = require("firebase-admin");

const Customer = require("../models/customerModel");
const Notification = require("../models/notificationModel");
const Product = require("../models/productModel");

const serviceAccountAndroid = require("../market-places-9554d-firebase-adminsdk-qq1uj-c7857ffa1d.json");

const adminAndroid = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccountAndroid),
  },
  "androidApp"
);

const sendEnquiryNotification = asyncHandler(async (req, res) => {
  const { customerId, vendorId, enquiryId } = req.body;

  if (!customerId || !vendorId || !enquiryId) {
    return res
      .status(400)
      .json({ message: "Please fill all the fields", success: false });
  }

  const userTitle = "Enquiry Raised!!";
  const userMsg = `Your enquiry has been raised successfully.`;

  const userMessage = {
    notification: {
      title: userTitle,
      body: userMsg,
    },
  };

  await Notification.create({
    customerId,
    vendorId,
    enquiryId,
    title: userTitle,
    description: userMsg,
  });

  const customer = await Customer.findById(customerId);
  const fcmIdArray = [customer.fcmId];
  console.log(fcmIdArray);

  await sendMessageAndroid(fcmIdArray, userMessage);

  res
    .status(200)
    .json({ message: "Notification sent successfully", success: true });
});

async function sendMessageAndroid(fcmIdArray, messageData) {
  const promises = fcmIdArray.map(async (fcmToken) => {
    console.log(fcmToken);
    const message = {
      ...messageData,
      token: fcmToken,
      android: {
        priority: "high",
      },
    };
    return adminAndroid.messaging().send(message);
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`Message sent successfully to token ${fcmIdArray[index]}`);
    } else {
      console.log(
        `Error sending message to token ${fcmIdArray[index]}:`,
        result.reason
      );
    }
  });
}

const listCustomerNotifications = asyncHandler(async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res
      .status(400)
      .json({ message: "Please provide customer id", success: false });
  }

  const notifications = await Notification.find({ customerId })
    .populate({
      path: "vendorId",
      select: "name profileImage", // Select specific fields from vendor
    })
    .sort({ createdAt: -1 });

  if (!notifications || notifications.length === 0) {
    return res.status(404).json({
      message: "No notifications found for this customer",
      success: false,
    });
  }

  const data = notifications.map((notification) => {
    return {
      _id: notification._id,
      vendorId: notification.vendorId._id,
      vendorName: notification.vendorId.name,
      image: `https://marketplaceaws.waayupro.in/uploads/images/vendor/${notification.vendorId.profileImage}`,
      customerId: notification.customerId,
      enquiryId: notification.enquiryId,
      title: notification.title,
      description: notification.description,
      createdAt: moment(notification.createdAt)
        .tz("Asia/Calcutta")
        .format("YYYY-MM-DD HH:mm:ss"),
    };
  });

  res.status(200).json({ data, success: true });
});

const listVendorNotifications = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;

  if (!vendorId) {
    return res
      .status(400)
      .json({ message: "Please provide vendor id", success: false });
  }

  const notifications = await Notification.find({ vendorId })
    .populate({
      path: "vendorId",
      select: "name profileImage", // Select specific fields from vendor
    })
    .populate({
      path: "customerId",
      select: "name profileImage", // Select specific fields from customer
    })
    .populate({
      path: "enquiryId",
      select: "productId", // Select productId from enquiry
    })
    .sort({ createdAt: -1 });

  if (!notifications || notifications.length === 0) {
    return res.status(404).json({
      message: "No notifications found for this vendor",
      success: false,
    });
  }

  const productIds = notifications.map(
    (notification) => notification.enquiryId.productId
  );
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "productName"
  );

  const productMap = products.reduce((map, product) => {
    map[product._id] = product.productName;
    return map;
  }, {});

  const data = notifications.map((notification) => {
    const productName = productMap[notification.enquiryId.productId];
    return {
      _id: notification?._id,
      vendorId: notification?.vendorId?._id,
      vendorName: notification?.vendorId?.name,
      image: `https://marketplaceaws.waayupro.in/uploads/images/vendor/${notification?.vendorId?.profileImage}`,
      customerId: notification?.customerId?._id,
      customerName: notification?.customerId?.name,
      enquiryId: notification?.enquiryId?._id,
      title: notification?.title,
      description: `Enquiry has been raised against ${productName}`,
      createdAt: moment(notification?.createdAt)
        .tz("Asia/Calcutta")
        .format("YYYY-MM-DD HH:mm:ss"),
    };
  });

  res.status(200).json({ data, success: true });
});

module.exports = {
  sendEnquiryNotification,
  listCustomerNotifications,
  listVendorNotifications,
};

// const axios = require("axios");
// const { JWT } = require("google-auth-library");
// const admin = require("firebase-admin");
// const asyncHandler = require("express-async-handler");

// const Customer = require("../models/customerModel");
// const Notification = require("../models/notificationModel");

// const serviceAccount = require("../market-places-9554d-firebase-adminsdk-qq1uj-068b371c02.json"); // Update with the path to your downloaded service account key file

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const projectId = serviceAccount.project_id; // Use the project_id from the service account file

// const sendEnquiryNotification = asyncHandler(async (req, res) => {
//   const { customerId, vendorId, enquiryId } = req.body;

//   if (!customerId || !vendorId || !enquiryId) {
//     return res
//       .status(400)
//       .json({ message: "Please fill all the fields", success: false });
//   }

//   const userTitle = "Enquiry Raised!!";
//   const userMsg = "Your enquiry has been raised successfully.";

//   const userMessage = {
//     message: {
//       notification: {
//         title: userTitle,
//         body: userMsg,
//       },
//       token: "", // Will be filled later
//     },
//   };

//   await Notification.create({
//     customerId,
//     vendorId,
//     enquiryId,
//     title: userTitle,
//     description: userMsg,
//   });

//   const customer = await Customer.findById(customerId);
//   const fcmIdArray = [customer.fcmId];
//   console.log(fcmIdArray);

//   await sendMessageAndroid(fcmIdArray, userMessage);

//   res
//     .status(200)
//     .json({ message: "Notification sent successfully", success: true });
// });

// async function sendMessageAndroid(fcmIdArray, messageData) {
//   const promises = fcmIdArray.map(async (fcmToken) => {
//     const message = {
//       ...messageData,
//       message: {
//         ...messageData.message,
//         token: fcmToken,
//       },
//     };

//     const config = {
//       method: "post",
//       url: `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
//       headers: {
//         Authorization: `Bearer ${await getAccessToken()}`,
//         "Content-Type": "application/json",
//       },
//       data: JSON.stringify(message),
//     };

//     try {
//       const response = await axios(config);
//       console.log(`Message sent successfully to token ${fcmToken}`);
//       return response.data;
//     } catch (error) {
//       console.error(
//         `Error sending message to token ${fcmToken}:`,
//         error.response.data
//       );
//       throw error;
//     }
//   });

//   const results = await Promise.allSettled(promises);

//   results.forEach((result, index) => {
//     if (result.status === "fulfilled") {
//       console.log(`Message sent successfully to token ${fcmIdArray[index]}`);
//     } else {
//       console.log(
//         `Error sending message to token ${fcmIdArray[index]}:`,
//         result.reason
//       );
//     }
//   });
// }

// async function getAccessToken() {
//   const client = new JWT({
//     email: serviceAccount.client_email,
//     key: serviceAccount.private_key,
//     scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//   });

//   const token = await client.authorize();
//   return token.access_token;
// }

// module.exports = { sendEnquiryNotification };
