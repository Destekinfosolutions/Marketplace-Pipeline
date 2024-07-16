const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Marketplace-App",
    });
    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );
  } catch (error) {
    console.log(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
