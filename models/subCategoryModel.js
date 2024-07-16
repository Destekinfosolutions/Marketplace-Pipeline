const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // categoryName: {
    //   type: String,
    //   required: true,
    // },
    subCategoryName: {
      type: String,
      required: true,
    },
    subCategoryImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Sub_Category", subCategorySchema);
