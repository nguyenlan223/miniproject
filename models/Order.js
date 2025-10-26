const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // Ai là người đặt hàng
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Danh sách sản phẩm trong đơn
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            ten: String,
            gia: Number, // giá tại thời điểm đặt hàng (không nên lấy giá từ Product vì có thể thay đổi sau này)
            soLuong: Number,
        },
    ],

    // Tổng tiền hàng
    tongTienHang: { type: Number, required: true },

    // Thông tin khuyến mãi, mã giảm giá (nếu có)
    giamGia: { type: Number, default: 0 },

    // Tổng tiền cần thanh toán = Tổng tiền hàng - giảm giá + phí vận chuyển
    tongTienThanhToan: { type: Number, required: true },

    // Địa chỉ giao hàng
    diaChiNhanHang: { type: String, required: true },

    // Phương thức thanh toán (COD, VNPay, Momo…)
    paymentMethod: {
        type: String,
        enum: ["COD","VietQr"],
        default: "COD",
    },

    // Trạng thái thanh toán
    paymentStatus: {
        type: String,
        enum: ["Chưa thanh toán", "Đã thanh toán", "Chờ xác nhận chuyển khoản"],
        default: "Chưa thanh toán",
    },

    // Trạng thái đơn hàng
    orderStatus: {
        type: String,
        enum: ["Chờ xử lý", "Đang giao", "Hoàn thành", "Đã hủy", "Hoàn trả"],
        default: "Chờ xử lý",
    },

    // Ngày đặt hàng
    ngayDat: { type: Date, default: Date.now },

    // Ngày giao hàng (nếu có)
    ngayGiao: { type: Date },

    // Log trạng thái đơn hàng (nếu muốn theo dõi lịch sử)
    history: [
        {
            status: String,
            date: { type: Date, default: Date.now },
            note: String,
        },
    ],
});

module.exports = mongoose.model("Order", orderSchema);
