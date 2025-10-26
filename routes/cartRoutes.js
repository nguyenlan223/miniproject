const Cart = require("../models/Cart");
const Product = require("../models/Product");
const express = require("express");
const router = express.Router();
const { authMiddleware} = require("../middleware/authMiddleware");

// 🟢 Thêm sản phẩm vào giỏ (hoặc tăng số lượng)
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId, soLuong } = req.body;

        if (!productId || !soLuong)
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Thiếu productId hoặc soLuong",
                });

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                products: [{ product: productId, soLuong }],
            });
        } else {
            const index = cart.products.findIndex(
                (p) => p.product.toString() === productId
            );
            if (index >= 0) {
                cart.products[index].soLuong += soLuong;
            } else {
                cart.products.push({ product: productId, soLuong });
            }
            cart.updatedAt = new Date();
        }

        await cart.save();
        res.status(200).json({
            success: true,
            message: "Đã cập nhật giỏ hàng thành công",
            cart,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật giỏ hàng",
        });
    }
});

// 🟢 Lấy giỏ hàng của user hiện tại
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId }).populate(
            "products.product",
            "name price img promo"
        );

        if (!cart)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy giỏ hàng" });
        res.json({ success: true, cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// 🟢 Cập nhật số lượng sản phẩm trong giỏ
router.put("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { products } = req.body;

        if (!products)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu products" });

        const cart = await Cart.findOne({ user: userId });
        if (!cart)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy giỏ hàng" });

        for (let p of products) {
            const item = cart.products.find(
                (i) => i.product.toString() === p.product
            );
            if (item) item.soLuong = p.soLuong;
        }

        await cart.save();
        res.json({ success: true, cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// 🟢 Xóa sản phẩm hoặc xóa toàn bộ giỏ hàng
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.query;

        const cart = await Cart.findOne({ user: userId });
        if (!cart)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy giỏ hàng" });

        if (productId) {
            cart.products = cart.products.filter(
                (p) => p.product.toString() !== productId
            );
            await cart.save();
            return res.json({
                success: true,
                message: "Xóa sản phẩm thành công",
                cart,
            });
        }

        // Xóa toàn bộ giỏ hàng
        cart.products = [];
        await cart.save();
        res.json({ success: true, message: "Xóa toàn bộ giỏ hàng", cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

module.exports = router;
