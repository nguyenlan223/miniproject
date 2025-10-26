const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Warehouse = require("../models/Warehouse");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
/// 🟢 Tạo đơn hàng từ giỏ hàng (chỉ user login)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const cart = await Cart.findOne({ user: userId }).populate(
            "products.product"
        );
        if (!cart || cart.products.length === 0)
            return res.status(400).json({ message: "Giỏ hàng trống" });

        const {
            products,
            ngayDat,
            paymentMethod,
            paymentStatus,
            diaChiNhanHang,
        } = req.body;
        const diaChiNhanHang2 = `${diaChiNhanHang.diaChiChiTiet}, ${diaChiNhanHang.phuongXa}, ${diaChiNhanHang.quanHuyen}, ${diaChiNhanHang.tinhThanh}`;
        
        // Lấy kho (ở đây lấy kho mặc định, có thể nâng cấp chọn kho theo sản phẩm)
        const warehouse = await Warehouse.findOne({});
        if (!warehouse) return res.status(500).json({ message: "Kho không tồn tại" });

        // Kiểm tra tồn kho
        for (let p of products) {
            const wProduct = warehouse.products.find(item => item.product.equals(p.product._id));
            if (!wProduct || wProduct.stock < p.soLuong) {
                return res.status(400).json({ message: `${p.product.name} không đủ hàng` });
            }
        }

        let tongTienHang = 0;
        let giamGia=0;
        const orderProducts = products.map((p) => {
            const price = p.product?.promo?.name === "giareonline" ? p.product.promo.value
                                                                            : p.product.price;
        // Nếu có giảm giá kiểu "giamgia", cộng dồn phần giảm
        if (p.product?.promo?.name === "giamgia") {
        giamGia += p.product.promo.value || 0;
        }
            tongTienHang += Number(price) * p.soLuong;
            return {
                product: p.product._id,
                ten: p.product.name,
                gia: price,
                soLuong: p.soLuong
            };
        });

        const phiVanChuyen = 30000;
        const tongTienThanhToan = tongTienHang - giamGia + phiVanChuyen;
        const newOrder = new Order({
            user: userId,
            products: orderProducts,
            ngayDat,
            diaChiNhanHang: diaChiNhanHang2,
            tongTienHang,
            giamGia,
            tongTienThanhToan,
            paymentMethod,
            paymentStatus,
        });

        await newOrder.save();
       
        // Trừ stock trong kho
        for (let p of products) {
            await Warehouse.updateOne(
                { _id: warehouse._id, "products.product": p.product._id },
                { $inc: { "products.$.stock": -p.soLuong } }
            );
        }
        // Xóa các sản phẩm đã đặt trong giỏ hàng
        const orderedProductIds = products.map((p) => p.product);
        await Cart.updateOne(
            { user: userId },
            { $pull: { products: { product: { $in: orderedProductIds } } } }
        );

        res.json({
            success: true,
            message: "Đặt hàng thành công",
            order: newOrder,
        });
    } catch (err) {
        console.error("Lỗi khi tạo đơn hàng:", err);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: err.message,
        });
    }
});

//Của client
//  Lấy danh sách đơn hàng của user hiện tại
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.find({ user: userId })
            .populate("user", "username email")
            .populate("products.product", "img name company")
            .sort({ ngayDat: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error("Lỗi lấy đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy danh sách đơn hàng",
        });
    }
});

//  Lấy tất cả đơn hàng của tất cả users (chỉ admin)
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate("user", "username email")
            .populate("products.product", "img name company")
            .sort({ ngayDat: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error("Lỗi lấy tất cả đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy danh sách tất cả đơn hàng",
        });
    }
});

// 🟢 Lấy chi tiết 1 đơn hàng (chỉ admin)
router.get("/all/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "username email")
            .populate("products.product", "name img price company");
        if (!order)
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.status(200).json(order);
    } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng (admin):", err);
        res.status(500).json({
            message: "Lỗi server khi lấy chi tiết đơn hàng (admin)",
        });
    }
});

// 🟢 Cập nhật trạng thái đơn hàng (chỉ admin)
router.put(
    "/all/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { status } = req.body;

            const validStatuses = [
                "Chờ xử lý",
                "Đang giao",
                "Hoàn thành",
                "Đã hủy",
                "Hoàn trả",
            ];

            if (!validStatuses.includes(status)) {
                return res
                    .status(400)
                    .json({ message: "Trạng thái không hợp lệ" });
            }

            const order = await Order.findByIdAndUpdate(
                req.params.id,
                { orderStatus: status }, // ✅ Sửa ở đây
                { new: true }
            );

            if (!order) {
                return res
                    .status(404)
                    .json({ message: "Không tìm thấy đơn hàng" });
            }

            res.status(200).json({
                success: true,
                message: "Cập nhật trạng thái đơn hàng thành công",
                order,
            });
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi cập nhật trạng thái đơn hàng",
            });
        }
    }
);

// Lấy chi tiết 1 đơn hàng (của user hiện tại)
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const order = await Order.findOne({ _id: req.params.id, user: userId })
            .populate("user", "username email")
            .populate("products.product", "name img price company");

        if (!order)
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.status(200).json(order);
    } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy chi tiết đơn hàng",
        });
    }
});
// =============================== //
//   HỦY ĐƠN HÀNG CỦA CLIENT      //
// =============================== //
// Hủy đơn hàng (client) và hoàn lại stock, xóa khỏi CSDL
router.put("/:id/cancel", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const order = await Order.findOne({ _id: req.params.id, user: userId });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Lấy kho mặc định
        const warehouse = await Warehouse.findOne({});
        if (warehouse) {
            for (let p of order.products) {
                await Warehouse.updateOne(
                    { _id: warehouse._id, "products.product": p.product },
                    { $inc: { "products.$.stock": p.soLuong } }
                );
            }
        }

        // Cập nhật history trước khi xóa (nếu muốn lưu log)
        order.history.push({ status: "Đã hủy", note: "Hủy bởi user" });
        await order.save(); // lưu log trước

        // Cập nhật trạng thái thay vì xóa
       order.orderStatus = "Đã hủy";
       order.history.push({ status: "Đã hủy", note: "Hủy bởi user", date: new Date() });
       await order.save();

       res.json({
         success: true,
         message: "Đơn hàng đã được hủy và giữ lại trong hệ thống",
         order
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
});



//Hủy đơn hàng (cập nhật orderStatus: "Đã hủy")

/*API: PUT /api/orders/admin/:id/cancel
Middleware: authMiddleware + adminOnly
Mục đích: Hủy đơn, ghi vào lịch sử.*/

// Hủy đơn hàng (admin) và cộng stock về kho
router.put("/admin/:id/cancel", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const warehouse = await Warehouse.findOne({});
        if (warehouse) {
            for (let p of order.products) {
                await Warehouse.updateOne(
                    { _id: warehouse._id, "products.product": p.product },
                    { $inc: { "products.$.stock": p.soLuong } }
                );
            }
        }

        order.orderStatus = "Đã hủy";
        order.history.push({ status: "Đã hủy", note: "Hủy bởi admin" });

        const updatedOrder = await order.save();
        res.json({ success: true, message: "Đã hủy đơn hàng và cập nhật kho", order: updatedOrder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
});
module.exports = router;
