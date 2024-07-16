const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    categoryImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
