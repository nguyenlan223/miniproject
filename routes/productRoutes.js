const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");




/* ===== ADMIN ROUTES ===== */
// Lấy danh sách sản phẩm kèm stock kho
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const products = await Product.find();
        const warehouse = await Warehouse.findOne({}).populate("products.product");

        const productsWithStock = products.map(p => {
            const wProduct = warehouse?.products.find(wp => wp.product && wp.product._id.equals(p._id));
            return {
                ...p._doc,
                stock: wProduct?.stock || 0,
            };
        });

        res.json(productsWithStock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết sản phẩm kèm stock kho (admin)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        const warehouse = await Warehouse.findOne({}).populate("products.product");
        const wProduct = warehouse?.products.find(wp => wp.product._id.equals(product._id));

        res.json({
            ...product._doc,
            stock: wProduct?.stock || 0,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// thêm sản phẩm
// 👉 Thêm sản phẩm (và thêm vào kho)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { stock = 0, ...productData } = req.body;

    // 1️⃣ Tạo sản phẩm
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    // 2️⃣ Tìm hoặc tạo kho
    let warehouse = await Warehouse.findOne();
    if (!warehouse) {
      warehouse = new Warehouse({
        name: "Kho mặc định",
        location: "Chưa xác định",
        products: [],
      });
    }

    // 3️⃣ Thêm sản phẩm vào kho
    warehouse.products.push({
      product: savedProduct._id,
      stock: Number.isFinite(stock) ? stock : 0,
    });
    await warehouse.save();

    // 4️⃣ Phản hồi
    res.status(201).json({
      success: true,
      message: "✅ Thêm sản phẩm thành công và đã cập nhật kho!",
      product: savedProduct,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm sản phẩm:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Cập nhật sản phẩm (và tồn kho nếu có)
router.patch("/:id", async (req, res) => {
  try {
    const { stock, ...productData } = req.body; // tách riêng stock

    // --- Cập nhật thông tin sản phẩm ---
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });

    // --- Nếu có field stock thì cập nhật luôn trong Warehouse ---
    if (typeof stock === "number") {
      const warehouse = await Warehouse.findOne(); // giả sử chỉ có 1 kho

      if (warehouse) {
        const existing = warehouse.products.find((p) =>
          p.product.equals(req.params.id)
        );

        if (existing) {
          existing.stock = stock; // gán số lượng mới
        } else {
          warehouse.products.push({
            product: req.params.id,
            stock: stock,
          });
        }

        await warehouse.save();
      }
    }

    res.json({
      success: true,
      message: "Cập nhật thành công!",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật sản phẩm!" });
  }
});


// 👉 Xóa sản phẩm
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Xóa khỏi kho
    await Warehouse.updateMany({}, { $pull: { products: { product: deleted._id } } });

    res.json({ message: "🗑️ Sản phẩm đã được xóa khỏi hệ thống và kho" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* ===== USER ROUTES ===== */
// Lấy danh sách sản phẩm
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết sản phẩm theo ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
