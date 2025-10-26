const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    masp: {
      type: String,
      required: [true, "Mã sản phẩm không được để trống"],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Tên sản phẩm không được để trống"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Thương hiệu không được để trống"],
      trim: true,
    },
    img: {
      type: String,
      required: [true, "Hình ảnh không được để trống"],
      match: [
      /^(https?:\/\/|\/img\/).+\.(jpg|jpeg|png|gif|webp)$/i,
      "Đường dẫn hình ảnh không hợp lệ",
    ],
    },
    price: {
      type: Number,
      required: [true, "Giá không được để trống"],
      min: [0, "Giá không được âm"],
    },
    star: {
      type: Number,
      min: [0, "Số sao tối thiểu là 0"],
      max: [5, "Số sao tối đa là 5"],
      default: 0,
    },
    rateCount: {
      type: Number,
      min: [0, "Lượt đánh giá không được âm"],
      default: 0,
    },
    promo: {
      name: {
        type: String,
        enum: ["giareonline", "tragop", "moiramat", "giamgia", ""],
        default: "",
      },
      value: {
        type: Number,
        min: [0, "Giá trị khuyến mãi không được âm"],
        default: 0,
      },
    },
    detail: {
      screen: { type: String, default: "" },
      os: { type: String, default: "" },
      camara: { type: String, default: "" },
      camaraFront: { type: String, default: "" },
      cpu: { type: String, default: "" },
      ram: { type: String, default: "" },
      rom: { type: String, default: "" },
      microUSB: { type: String, default: "" },
      battery: { type: String, default: "" },
    },
  },
  {
    timestamps: true, // ✅ tự động tạo createdAt & updatedAt
  }
);

module.exports = mongoose.model("Product", productSchema);
