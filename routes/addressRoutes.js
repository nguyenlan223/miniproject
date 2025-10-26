const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const User = require("../models/User");
const { authMiddleware} = require("../middleware/authMiddleware");

// Lấy địa chỉ mặc định của user
router.get("/default", authMiddleware, async (req, res) => {
    try {
        const address = await Address.findOne({
            userId: req.session.userId,
            macDinh: true,
        });
        if (!address)
            return res
                .status(404)
                .json({ message: "Chưa có địa chỉ mặc định" });
        res.json(address);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy danh sách địa chỉ của user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.session.userId });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Thêm địa chỉ của user
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { diaChiChiTiet, phuongXa, quanHuyen, tinhThanh } = req.body;
        const newAddress = new Address({
            userId: req.session.userId,
            diaChiChiTiet,
            phuongXa,
            quanHuyen,
            tinhThanh,
        });
        await newAddress.save();

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $push: { diaChi: newAddress._id } },
            { new: true }
        ).populate("diaChi", "-userId");

        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cập nhật địa chỉ
router.put("/:addressId", authMiddleware, async (req, res) => {
    try {
        // Kiểm tra quyền sở hữu trước khi cập nhật
        const address = await Address.findById(req.params.addressId);
        if (!address)
            return res.status(404).json({ message: "Không tìm thấy địa chỉ" });
        if (address.userId.toString() !== req.session.userId) {
            return res
                .status(403)
                .json({ message: "Không có quyền chỉnh sửa địa chỉ này" });
        }

        const updated = await Address.findByIdAndUpdate(
            req.params.addressId,
            req.body,
            { new: true }
        );
        const user = await User.findById(req.session.userId).populate(
            "diaChi",
            "-userId"
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Xóa địa chỉ
router.delete("/:addressId", authMiddleware, async (req, res) => {
    try {
        const address = await Address.findById(req.params.addressId);
        if (!address)
            return res.status(404).json({ message: "Không tìm thấy địa chỉ" });
        if (address.userId.toString() !== req.session.userId) {
            return res
                .status(403)
                .json({ message: "Không có quyền xóa địa chỉ này" });
        }

        await Address.findByIdAndDelete(req.params.addressId);
        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $pull: { diaChi: address._id } },
            { new: true }
        ).populate("diaChi", "-userId");

        res.json({ message: "Đã xóa địa chỉ thành công", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
