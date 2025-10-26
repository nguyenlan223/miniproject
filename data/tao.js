

const fs = require("fs");
const path = require("path");

// === Đọc dữ liệu gốc ===
const users = JSON.parse(fs.readFileSync("myshop.users.json"));
const addresses = JSON.parse(fs.readFileSync("myshop.addresses.json"));
const products = JSON.parse(fs.readFileSync("myshop.products.json"));

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const orders = [];
let orderCount = 100;

// Tạo 100 đơn hàng
for (let i = 0; i < orderCount; i++) {
  const user = randomChoice(users);
  const userAddresses = addresses.filter(a => a.userId.$oid === user._id.$oid);
  if (userAddresses.length === 0) continue;
  const address = randomChoice(userAddresses);

  const numProducts = randomInt(1, 5);
  const productsSelected = Array.from({ length: numProducts }, () => randomChoice(products));

  const productList = productsSelected.map(p => {
    const soLuong = randomInt(1, 3);
    return {
      product: { $oid: p._id.$oid },
      ten: p.name,
      gia: p.price,
      soLuong,
      promo: p.promo
    };
  });

  const tongTienHang = productList.reduce((sum, p) => sum + p.gia * p.soLuong, 0);
  const giamGia = productList.reduce((sum, p) => {
    if (p.promo?.name === "giamgia") return sum + p.promo.value;
    return sum;
  }, 0);

  const tongTienThanhToan = tongTienHang - giamGia + 30000;
  const paymentMethod = Math.random() < 0.5 ? "COD" : "VietQr";
  const paymentStatus = paymentMethod === "COD" ? "Chưa thanh toán" : "Đã thanh toán";

  const orderStatuses = ["Chờ xử lý", "Đang giao", "Hoàn thành", "Đã hủy", "Hoàn trả"];
  const orderStatus = randomChoice(orderStatuses);

  const ngayDat = randomDate(new Date("2025-06-01"), new Date("2025-10-25"));
  const ngayGiao = new Date(ngayDat.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000);

  const history = [
    { status: "Chờ xử lý", date: ngayDat },
  ];
  if (orderStatus !== "Chờ xử lý") {
    history.push({ status: orderStatus, date: ngayGiao });
  }

  orders.push({
_id: { $oid: (Math.random().toString(16).substring(2, 10) + Date.now().toString(16)).substring(0, 24) },
    user: { $oid: user._id.$oid },
    products: productList,
    tongTienHang,
    giamGia,
    tongTienThanhToan,
    diaChiNhanHang: `${address.diaChiChiTiet}, ${address.phuongXa}, ${address.quanHuyen}, ${address.tinhThanh}`,
    paymentMethod,
    paymentStatus,
    orderStatus,
    ngayDat: { $date: ngayDat.toISOString() },
    ngayGiao: { $date: ngayGiao.toISOString() },
    history,
  });
}

// === Ghi file JSON ===
fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2), "utf8");
console.log("✅ Đã tạo file orders.json thành công với", orders.length, "đơn hàng.");
