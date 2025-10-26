var allOrders = [];
var currentUser = null;
var isAdmin = false; // ✅ Kiểm tra quyền admin
let API_BASE = window.location.origin.includes('localhost')
    ? "http://localhost:5000"
    : "https://miniproject-n8x9.onrender.com";
window.onload = async function () {
  console.log("donmua.js loaded");
  khoiTao();

  // 🟢 Lấy thông tin user hiện tại
  try {
    const res = await fetch(`${API_BASE}/api/users/me`, {
      credentials: "include",
    });
    const result = await res.json();
    if (result.success && result.user) {
      currentUser = result.user;
      isAdmin = currentUser.role === "admin"; // ✅ xác định quyền admin
      console.log("User:", currentUser);
      renderUserInfo();
    } else {
      document.querySelector(".listDonHang").innerHTML = `
        <h2 style="color:red; text-align:center; padding:50px;">
          Bạn chưa đăng nhập !!
        </h2>`;
      return;
    }
  } catch (err) {
    console.error("Lỗi lấy user:", err);
    return;
  }

  // 🟢 Lấy danh sách đơn hàng
  await loadOrders("Tất cả");
};

// =============================== //
//     HÀM LẤY & HIỂN THỊ ĐƠN      //
// =============================== //
async function loadOrders(filterStatus) {
  try {
    const orderRes = await fetch(`${API_BASE}/api/orders`, {
      credentials: "include",
    });
    const orders = await orderRes.json();
    allOrders = orders;
    console.log("Tổng đơn:", allOrders.length);

    renderOrders(filterStatus);
    initTabs();
  } catch (err) {
    console.error("Lỗi lấy đơn hàng:", err);
  }
}

// 🧩 Render thông tin user
function renderUserInfo() {
  const infoUserDiv = document.querySelector(".infoUser");
  if (infoUserDiv && currentUser) {
    infoUserDiv.innerHTML = `
      <div class="user-profile">
        <h3>User: ${currentUser.username}</h3>
        <p>Email: ${currentUser.email || "Không có"}</p>
        <p>Họ tên: ${currentUser.ho || ""} ${currentUser.ten || ""}</p>
        <p>Vai trò: <b>${currentUser.role}</b></p>
      </div>
    `;
  }
}

// =============================== //
//        HIỂN THỊ ĐƠN HÀNG        //
// =============================== //
function renderOrders(filterStatus) {
  const container = document.querySelector(".listDonHang");
  container.innerHTML = "";

  let filtered =
    filterStatus === "Tất cả"
      ? allOrders
      : allOrders.filter((o) => o.orderStatus === filterStatus);

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding:40px; font-size:1.3em;">
      ${
        filterStatus === "Tất cả"
          ? "Bạn chưa có đơn hàng nào."
          : "Không có đơn nào trong mục này."
      }
    </p>`;
    return;
  }

  filtered.forEach((dh) => {
    container.innerHTML += taoDonHangHTML(dh);
  });

  // 🟢 Sau khi render xong, gắn sự kiện cho các nút
  attachEventButtons(filterStatus);
}

function attachEventButtons(filterStatus) {
  // Nút hủy đơn cho client
  document.querySelectorAll(".btn-huydon").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Bạn có chắc muốn hủy đơn hàng này không?")) {
        try {
          const res = await fetch(
            `${API_BASE}/api/orders/${id}/cancel`,
            {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );
          const data = await res.json();
          alert(data.message || "Đã hủy đơn hàng thành công!");
          await loadOrders(filterStatus);
        } catch (err) {
          alert("Lỗi khi hủy đơn hàng!");
          console.error(err);
        }
      }
    });
  });
}

// =============================== //
//          TẠO HTML MỖI ĐƠN        //
// =============================== //
function taoDonHangHTML(dh) {
  let tongTien = 0;
  dh.products.forEach((p) => (tongTien += p.gia * p.soLuong));

  let spHTML = dh.products
    .map(
      (p) => `
    <div class="product-info">
      <img src="${p.product?.img || "img/noimage.jpg"}" class="product-img" alt="">
      <div class="product-details">
        <p class="product-name">${p.ten}</p>
        <p class="product-type">Phân loại hàng: ${p.loai || "Không có"}</p>
        <p class="product-quantity">x${p.soLuong}</p>
      </div>
      <div class="product-price">
        <span class="price-new">${numToString(p.gia)}₫</span>
      </div>
    </div>`
    )
    .join("");

  const colorTrangThai = getColorStatus(dh.orderStatus);
  const trangThaiText = getTextStatus(dh.orderStatus);

  // 🟢 User: có thể hủy đơn ở 2 trạng thái
   const btnHuy =
    dh.orderStatus === "Chờ xử lý"
      ? `<button class="btn-danger btn-huydon" data-id="${dh._id}">Hủy đơn hàng</button>`
      : "";

  const btnMuaLai =
    dh.orderStatus === "Hoàn thành" || dh.orderStatus === "Đã hủy"
      ? `<button class="btn-primary" onclick="muaLai('${dh._id}')">Mua lại</button>`
      : "";

  // 🆕 Nút xem chi tiết
  const btnChiTiet = `<button class="btn-outline" onclick="xemChiTiet('${dh._id}')">Xem chi tiết</button>`;

  return `
  <div class="donhang-item" data-status="${dh.orderStatus}">
    <div class="donhang-header">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div>
          <span class="shop-label">Yêu thích+</span>
          <span class="shop-name">${dh.tenShop || "Smartphone Store"}</span>
        </div>
        <div class="order-status" style="color:${colorTrangThai}; font-weight:600;">
          Trạng thái: ${trangThaiText}
        </div>
      </div>
    </div>

    ${spHTML}

    <div class="order-footer">
      <div class="order-total">
        <span>Thành tiền:</span>
        <strong>${numToString(tongTien)}₫</strong>
      </div>
      <div class="order-actions">
        ${btnChiTiet}  <!-- 🆕 -->
        ${btnHuy}
        ${btnMuaLai}
      </div>
    </div>
  </div>`;
}

// Hàm điều hướng sang trang chi tiết
function xemChiTiet(orderId) {
  window.location.href = `chitietdonhang.html?id=${orderId}`;
}

// =============================== //
//             TABS                //
// =============================== //
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderOrders(tab.dataset.status);
    };
  });
}

// =============================== //
//        HÀM PHỤ TRỢ              //
// =============================== //
function numToString(x) {
  if (!x && x !== 0) return "";
  return x.toLocaleString("vi-VN");
}

function getColorStatus(status) {
  switch (status) {
    case "Chờ xác nhận":
      return "#ff9f00";
    case "Đang xử lý":
      return "#17a2b8";
    case "Đang giao":
      return "#007bff";
    case "Hoàn thành":
      return "#28a745";
    case "Đã hủy":
      return "#dc3545";
    default:
      return "#666";
  }
}

function getTextStatus(status) {
  switch (status) {
    case "Hoàn thành":
      return "✅ Giao hàng thành công";
    case "Đang giao":
      return "🚚 Đang giao hàng";
    default:
      return status;
  }
}

// =============================== //
//         MUA LẠI (thêm vào giỏ hàng) //
// =============================== //
async function muaLai(orderId) {
  const dh = allOrders.find((o) => o._id === orderId);
  if (!dh) return alert("Không tìm thấy đơn hàng!");

  if (!confirm("Bạn có muốn thêm lại toàn bộ sản phẩm trong đơn này vào giỏ hàng không?")) {
    return;
  }

  try {
    for (const p of dh.products) {
      const res = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: p.product._id,
          soLuong: p.soLuong,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        console.warn("⚠️ Không thể thêm sản phẩm:", p.ten, data.message || "");
      }
    }

    alert(" Sản phẩm trong đơn đã được thêm vào giỏ hàng!");
    window.location.href = "giohang.html";
  } catch (err) {
    console.error("❌ Lỗi khi mua lại:", err);
    alert("Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng!");
  }
}
