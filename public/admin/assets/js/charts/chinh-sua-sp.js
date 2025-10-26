import { API_BASE_URL } from "../config.js";
let product = {};
const params = new URLSearchParams(location.search);
const id = params.get("id");

const API_BASE = `${API_BASE_URL}/products`;

async function loadProduct() {
    try {
        const res = await fetch(`${API_BASE}/${id}`,{credentials: "include"});
        if (!res.ok) throw new Error("Không thể tải dữ liệu sản phẩm!");
         product = await res.json();
        renderProduct(product);
    } catch (err) {
        alert(err.message);
        history.back();
    }
}

document.querySelector("#out-page").addEventListener("click", (e) => {
    history.back();
});

function renderProduct(p) {
    document.getElementById("masp").value = p.masp;
    document.getElementById("productName").value = p.name;
    document.getElementById("company").value = p.company;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productStock").value = p.stock;
    document.getElementById("promoName").value = p.promo?.name || "";
    document.getElementById("promoValue").value = p.promo?.value || 0;

    const d = p.detail || {};
    document.getElementById("screen").value = d.screen || "";
    document.getElementById("os").value = d.os || "";
    document.getElementById("camara").value = d.camara || "";
    document.getElementById("camaraFront").value = d.camaraFront || "";
    document.getElementById("cpu").value = d.cpu || "";
    document.getElementById("ram").value = d.ram || "";
    document.getElementById("rom").value = d.rom || "";
    document.getElementById("microUSB").value = d.microUSB || "";
    document.getElementById("battery").value = d.battery || "";
    // Chuẩn hóa đường dẫn tuyệt đối
   // Chuẩn hóa đường dẫn tuyệt đối từ root
    let imgPath = p.img;
    document.getElementById("previewImage").src = imgPath;
    document.getElementById("productImage").value = imgPath;
}

// Preview hình ảnh khi nhập URL
document.getElementById("productImage").addEventListener("input", (e) => {
    let val = e.target.value;
    document.getElementById("previewImage").src = val;
});


// ✅ Lấy data từ form
function getFormData() {
  return {
    name: document.getElementById("productName").value.trim(),
    company: document.getElementById("company").value.trim(),
    price: +document.getElementById("productPrice").value,
    stock: +document.getElementById("productStock").value,
    img: document.getElementById("productImage").value.trim(),
    promo: {
      name: document.getElementById("promoName").value.trim(),
      value: +document.getElementById("promoValue").value,
    },
    detail: {
      screen: document.getElementById("screen").value.trim(),
      os: document.getElementById("os").value.trim(),
      camara: document.getElementById("camara").value.trim(),
      camaraFront: document.getElementById("camaraFront").value.trim(),
      cpu: document.getElementById("cpu").value.trim(),
      ram: document.getElementById("ram").value.trim(),
      rom: document.getElementById("rom").value.trim(),
      microUSB: document.getElementById("microUSB").value.trim(),
      battery: document.getElementById("battery").value.trim(),
    },
  };
}
// ✅ So sánh object và chỉ lấy phần thay đổi
function diffObjects(newObj, oldObj) {
  const diff = {};
  for (const key in newObj) {
    if (typeof newObj[key] === "object" && newObj[key] !== null) {
      const nestedDiff = diffObjects(newObj[key], oldObj[key] || {});
      if (Object.keys(nestedDiff).length > 0) diff[key] = nestedDiff;
    } else if (newObj[key] !== oldObj[key]) {
      diff[key] = newObj[key];
    }
  }
  return diff;
}

// ✅ Gửi request cập nhật
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newData = getFormData();
  const changedData = diffObjects(newData, product);

  if (Object.keys(changedData).length === 0) {
    alert("Không có thay đổi nào.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH", // ✅ dùng PATCH thay vì PUT cho partial update
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(changedData),
    });

    if (!res.ok) throw new Error("Cập nhật thất bại!");
    // 🔥 Lưu flag vào sessionStorage
    sessionStorage.setItem("shouldReload", "true");
    alert("Cập nhật thành công!");
    history.back();
  } catch (err) {
    alert(err.message);
  }
});
// Nút hủy
document.getElementById("cancelBtn").addEventListener("click", () => {
    history.back();
});

// Tải dữ liệu khi trang mở
loadProduct();

