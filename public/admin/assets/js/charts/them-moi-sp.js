import { API_BASE_URL } from "../config.js";

var API_PRODUCT = `${API_BASE_URL}/products`;

// 🧠 Lấy data từ form
function getFormData() {
    return {
        masp: document.getElementById("masp").value.trim(),
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

// 🖼 Preview hình ảnh
document.getElementById("productImage").addEventListener("input", (e) => {
    document.getElementById("previewImage").src = e.target.value;
});

// 🚀 Xử lý submit form để thêm sản phẩm mới
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newProduct = getFormData();

    // Kiểm tra dữ liệu cơ bản
    if (!newProduct.masp || !newProduct.name || !newProduct.price) {
        alert("Vui lòng nhập đầy đủ Mã SP, Tên SP và Giá!");
        return;
    }

    try {
        const res = await fetch(API_PRODUCT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newProduct),
        });
        const result = await res.json();
        if (!res.ok) throw new Error("Thêm sản phẩm thất bại!");
        alert("✅ Thêm sản phẩm thành công!");
        console.log("Kết quả:", result);

        // Reset form
        e.target.reset();
        document.getElementById("previewImage").src = "";

        // Quay lại trang danh sách hoặc reload (tuỳ bạn)
        sessionStorage.setItem("shouldReload", "true");
        history.back();
    } catch (err) {
        alert("❌ Lỗi: " + err.message);
    }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
    history.back();
});
document.querySelector("#out-page").addEventListener("click", (e) => {
    history.back();
});
