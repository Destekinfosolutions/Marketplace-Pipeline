const express = require("express");
const http = require("http"); // Import http module
const socketIo = require("socket.io"); // Import socket.io
const connectDb = require("./db/connect");
require("dotenv").config();
require("colors");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorMiddleware");
const PORT = process.env.PORT;
const app = express();
const path = require("path");
const Chat = require("./models/chatModel");

connectDb();

// Using Middleware
const allowedOrigins = [
  "*",
  "https://marketplace.waayu.app",
  "http://localhost:4200",
  "http://192.168.1.45:4200",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: false, limit: "50mb", parameterLimit: 50000 })
);

// console.log(__dirname);
const uploadsFolder = path.join(__dirname, "uploads");

// Routes
app.use("/api/vendor", require("./routes/vendorRoutes"));
app.use("/api/customer", require("./routes/customerRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/sub-category", require("./routes/subCategoryRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/home", require("./routes/homePageRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/coupon", require("./routes/couponRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/offer", require("./routes/offerRoutes"));
app.use("/api/complaint", require("./routes/complaintRoutes"));
app.use("/api/enquiry", require("./routes/enquiryRoutes"));
app.use("/api/guest", require("./routes/guestRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/save_item", require("./routes/savedItemsRoutes"));
app.use("/api/notification", require("./routes/notificationRoutes"));

app.use("/uploads", express.static(uploadsFolder));

app.get("/", (_, res) => {
  res.status(200).json({ message: "Marketplace API" });
});

app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("New client connected");

  // Join a room based on custId and vendorId
  socket.on("joinRoom", async ({ custId, vendorId, enquiryId, status }) => {
    const room = `${custId}_${vendorId}_${enquiryId}`;
    socket.join(room);
    console.log(`Client joined room: ${room}`);

    let query;

    if (status == "all") {
      query = { vendorId: vendorId, customerId: custId };
    } else {
      query = {
        vendorId: vendorId,
        customerId: custId,
        enquiryId: enquiryId,
      };
    }

    const chats = await Chat.find(query);

    console.log(chats);

    const data = chats.map((elem) => {
      return {
        custId: elem.customerId,
        vendorId: elem.vendorId,
        enquiryId: elem.enquiryId,
        userType: elem.userType,
        message: elem.message,
        timestamp: elem.timestamp,
      };
    });

    io.to(room).emit("joinRoom", data);
  });

  // Handle messages from the client
  socket.on("message", async (data) => {
    console.log("Message received: ", data);

    const { custId, enquiryId, vendorId, userType, message, timestamp } = data;
    const room = `${custId}_${vendorId}_${enquiryId}`;

    try {
      const chat = await Chat.create({
        customerId: custId,
        enquiryId: enquiryId,
        vendorId,
        userType,
        message,
        timestamp,
      });
      console.log("Chat saved to MongoDB:", chat);

      // Emit the message to the specific room
      io.to(room).emit("message", data);
    } catch (error) {
      console.error("Error creating chat:", error);
      io.to(room).emit("error", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log("Server is Running on Port:", PORT.blue);
});
