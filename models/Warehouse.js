const mongoose = require("mongoose");
const warehouseSchema = new mongoose.Schema({
    name: String,
    location: String,
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            stock: { type: Number, default: 0 }
        }
    ],
});
module.exports = mongoose.model("Warehouse", warehouseSchema);
