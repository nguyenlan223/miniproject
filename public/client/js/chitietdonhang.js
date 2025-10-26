var API_BASE = window.location.origin.includes('localhost')
    ? "http://localhost:5000"
    : "https://miniproject-n8x9.onrender.com";
$(document).ready(async function () {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    $(".chitiet-container").html("<p>Không tìm thấy mã đơn hàng!</p>");
    return;
  }

  try {
    // 🟢 Lấy thông tin user hiện tại (để lấy địa chỉ)
    let currentUser = null;
    try {
      const userRes = await fetch(`${API_BASE}/api/users/me`, {
        credentials: "include",
      });
      const userData = await userRes.json();
      if (userData.success && userData.user) currentUser = userData.user;
    } catch (e) {
      console.warn("Không lấy được user:", e);
    }

    // 🟢 Lấy chi tiết đơn hàng
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      credentials: "include",
    });
    const dh = await res.json();

    if (!dh || !dh._id) {
      $(".chitiet-container").html("<p>Đơn hàng không tồn tại!</p>");
      return;
    }

    console.log("Chi tiết đơn hàng:", dh);
    console.log("User:", currentUser);

    // ===============================
    // 🔹 HIỂN THỊ THÔNG TIN NGƯỜI DÙNG
    // ===============================
    $("#madon").text("#" + dh._id);
    $("#tennguoinhan").text(dh.user?.username || dh.user?.name || "Không có");

    // ===============================
    // 🔹 HIỂN THỊ ĐỊA CHỈ (LÀM MỜ)
    // ===============================
    let diaChi = "Không có";

    // Nếu user có danh sách địa chỉ → lấy địa chỉ đầu tiên
    if (currentUser?.diaChi?.length > 0) {
      const dc = currentUser.diaChi[0];
      diaChi = `${dc.diaChiChiTiet}, ${dc.phuongXa}, ${dc.quanHuyen}, ${dc.tinhThanh}`;
    }
    // Nếu đơn hàng có shippingInfo riêng thì ưu tiên
    else if (dh.shippingInfo?.address) {
      diaChi = dh.shippingInfo.address;
    }

    // 🧊 Làm mờ địa chỉ trước khi hiển thị
    $("#diachi").text(maskAddress(diaChi)).attr("title", diaChi); // thêm tooltip khi hover

    // ===============================
    // 🔹 NGÀY ĐẶT HÀNG
    // ===============================
    const rawDate =
      dh.createdAt || dh.orderDate || dh.dateOrdered || dh.date || dh.ngayDat;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        $("#ngaydat").text(
          d.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } else {
        $("#ngaydat").text("Không xác định");
      }
    } else {
      // ⚙️ Nếu backend chưa có ngày → suy ra từ ObjectID (ước tính)
      try {
        const timestamp = parseInt(dh._id.substring(0, 8), 16) * 1000;
        const d = new Date(timestamp);
        $("#ngaydat").text(
          d.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }) + " (ước tính)"
        );
      } catch {
        $("#ngaydat").text("Không có");
      }
    }

    // ===============================
    // 🔹 TRẠNG THÁI
    // ===============================
    $("#trangthai").text(dh.orderStatus || "Không rõ");

    // ===============================
    // 🔹 DANH SÁCH SẢN PHẨM
    // ===============================
    const tbody = $("#table-sanpham tbody");
    let tong = 0;

    (dh.products || []).forEach((sp) => {
      const tamTinh = sp.gia * sp.soLuong;
      tong += tamTinh;

      const tenSP = sp.ten || sp.product?.name || "Sản phẩm";

      // Dùng slug từ tên sản phẩm
      const slugSP = tenSP
        .trim()
        .replace(/\s+/g, "-")
        .replace(/\//g, "-")
        .replace(/[^a-zA-Z0-9\-+]/g, "");

      const linkSP = `chitietsanpham.html?${slugSP}`;

      tbody.append(`
        <tr>
          <td><img src="${sp.product?.img || "img/noimage.jpg"}" alt=""></td>
          <td>
            <a href="${linkSP}" class="link-sp" style="color:#007bff; text-decoration:none;">
              ${tenSP}
            </a>
          </td>
          <td>${sp.soLuong}</td>
          <td>${sp.gia.toLocaleString("vi-VN")}₫</td>
          <td>${tamTinh.toLocaleString("vi-VN")}₫</td>
        </tr>
      `);
    });

    // ===============================
    // 🔹 TỔNG TIỀN
    // ===============================
    $("#tongtien").text(tong.toLocaleString("vi-VN") + "₫");
  } catch (err) {
    console.error("Lỗi tải chi tiết đơn:", err);
    $(".chitiet-container").html(
      "<p style='color:red'>Lỗi khi tải chi tiết đơn hàng!</p>"
    );
  }
});

// ===============================
// 🔹 HÀM ẨN / LÀM MỜ ĐỊA CHỈ
// ===============================
function maskAddress(address) {
  if (!address || typeof address !== "string") return "Không có";

  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    // Giữ phần đầu và cuối, làm mờ phần giữa
    return `${parts[0]}, ***, ${parts[parts.length - 1]}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}, ***`;
  }
  return "***";
}
