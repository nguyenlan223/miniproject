const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    ho: {
      type: String,
      trim: true,
      required: [true, "Họ không được để trống"],
      maxlength: [30, "Họ quá dài (tối đa 30 ký tự)"],
    },
    ten: {
      type: String,
      trim: true,
      required: [true, "Tên không được để trống"],
      maxlength: [30, "Tên quá dài (tối đa 30 ký tự)"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email không được để trống"],
      lowercase: true,
      validate: {
        validator: function (value) {
          // Regex đơn giản check email
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Email không hợp lệ",
      },
    },
    username: {
      type: String,
      unique: true,
      required: [true, "Username không được để trống"],
      minlength: [4, "Username phải có ít nhất 4 ký tự"],
      maxlength: [20, "Username không được vượt quá 20 ký tự"],
      match: [
        /^[a-zA-Z0-9._-]+$/,
        "Username chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang",
      ],
    },
    password: {
      type: String,
      required: [true, "Password không được để trống"],
      minlength: [6, "Password phải có ít nhất 6 ký tự"],
      validate: {
        validator: function (v) {
          // ít nhất 1 chữ hoa, 1 chữ thường, 1 số
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(v);
        },
        message: "Password phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
      },
    },
    diaChi: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    off: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default:"https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
