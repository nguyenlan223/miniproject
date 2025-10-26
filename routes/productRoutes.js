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
            const wProduct = warehouse?.products.find(wp => wp.product._id.equals(p._id));
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
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
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


//Xóa sản phẩm (Delete)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json({ message: "Sản phẩm đã được xóa" });
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
