const fs = require("fs");

// Đọc danh sách sản phẩm từ file products.json
const products = JSON.parse(fs.readFileSync("myshop.products.json", "utf8"));

// Hàm tạo ObjectId giả 24 ký tự hex
function generateObjectId() {
  return [...Array(24)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

// Hàm tạo số ngẫu nhiên từ min–max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Tạo đối tượng kho duy nhất với Extended JSON ($oid)
const warehouse = {
  _id: { $oid: generateObjectId() }, // ObjectId dạng Extended JSON
  name: "Kho trung tâm MyShop",
  location: "TP. Hồ Chí Minh",
  products: products.map(p => ({
    product: { $oid: p._id.$oid || p._id }, // giữ $oid từ products.json
    stock: randomInt(0, 100)
  }))
};

// Ghi ra file warehouse.json
fs.writeFileSync(
  "warehouse.json",
  JSON.stringify([warehouse], null, 2),
  "utf8"
);

console.log(
  "✅ Đã tạo warehouse.json (Extended JSON) với",
  warehouse.products.length,
  "sản phẩm."
);
