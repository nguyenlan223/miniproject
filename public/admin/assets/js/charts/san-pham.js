import { API_BASE_URL } from "../config.js";
var API_PRODUCT = `${API_BASE_URL}/products`;
var API_BASE = `${API_BASE_URL}/products`;
window.addEventListener("load", () => {
  if (sessionStorage.getItem("shouldReload") === "true") {
    sessionStorage.removeItem("shouldReload");
    location.reload(); // 🔁 tải lại danh sách để hiển thị dữ liệu mới
  }
});

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/all`, { credentials: "include" });
        if (!res.ok) throw new Error("Không lấy được dữ liệu sản phẩm!");
        const data = await res.json();
        return Array.isArray(data) ? data : []; // luôn trả về mảng
    } catch (error) {
        console.error(`Lỗi trang Sản Phẩm, loadProducts: ${error}`);
        return []; // fallback mảng rỗng để tránh crash
    }
}
async function loadProductID(id) {
    try {
        const res = await fetch(`${API_BASE}/${id}`,{credentials: "include"});
        if (!res.ok)
            throw new Error("Không lấy được dữ liệu sản phẩm theo ID !");
        return await res.json();
    } catch (err) {
        alert("Lỗi trang Sản Phẩm, loadProductID: " + err.message);
    }
}

async function renderProducts(products = []) {
    if (!Array.isArray(products) || products.length === 0) {
        document.querySelector("#total-products").innerText = 0;
        document.querySelector("#low-stock").innerText = "0 sp";
        document.querySelector("#out-stock").innerText = "0 sp";
        document.querySelector("#inventory-value").innerText = formatCurrency(0);
        return;
    }

    document.querySelector("#total-products").innerText = `${
        products.filter((p) => p.masp).length || 0
    }`;
    document.querySelector("#low-stock").innerText = `${
        products.filter((p) => p.stock && p.stock <= 10).length || 0
    } sp`;
    document.querySelector("#out-stock").innerText = `${
        products.filter((p) => p.stock === 0).length || 0
    } sp`;
    document.querySelector("#inventory-value").innerText = formatCurrency(
        products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)
    );
}
// Chạy khi load trang
window.addEventListener("load", async () => {
    const products = await loadProducts();
    renderProducts(products);
    tableProduct(products); // render bảng ngay sau khi có dữ liệu
});

const glowPlugin = {
    id: "glow",
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                ctx.save();
                ctx.shadowColor = dataset.borderColor;
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = dataset.borderWidth;
                ctx.strokeStyle = dataset.borderColor;
                ctx.beginPath();
                meta.dataset.draw(ctx);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
};
const crosshairPlugin = {
    id: "crosshair",
    beforeDatasetsDraw(chart) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y?.top ?? chart.chartArea.top;
            const bottomY = chart.scales.y?.bottom ?? chart.chartArea.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#aaa";
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    },
};



async function renderProductCharts(data) {
    // 🔹 Biểu đồ Top 5 sản phẩm bán chạy
    new Chart(document.getElementById("chart-top-products"), {
        type: "bar",
        data: {
            // labels: [
            //     "iPhone 15 Pro",
            //     "Galaxy Z Flip 6",
            //     "AirPods Pro 2",
            //     "MacBook Air M3",
            //     "iPad Air M2",
            // ],
            labels: data.topProducts.labels,
            datasets: [
                {
                    label: "Số lượng bán",
                    // data: [1200, 950, 780, 650, 500],
                    data: data.topProducts.data,
                    backgroundColor: "#4e73df",
                    borderRadius: 8,
                    maxBarThickness: 40,
                    // barPercentage: 0.7,
                    categoryPercentage: 0.7,
                },
            ],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ` ${ctx.formattedValue} sản phẩm`,
                    },
                    bodyFont: { size: 14 },
                    padding: 8,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { color: "#eee", borderDash: [5, 5] },
                },
                y: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { display: false },
                },
            },
        },
    });

    // 🔹 Biểu đồ Cơ cấu tồn kho theo danh mục
    new Chart(document.getElementById("chart-inventory-structure"), {
        type: "doughnut",
        data: {
            // labels: ["Điện thoại", "Laptop", "Tablet", "Phụ kiện"],
            labels: data.inventoryStructure.labels,
            datasets: [
                {
                    // data: [1200, 800, 500, 950],
                    data: data.inventoryStructure.data,
                    backgroundColor: [
                        "#1cc88a",
                        "#36b9cc",
                        "#4e73df",
                        "#6e11df",
                        "#a01ecc",
                    ],
                    borderWidth: 3,
                    borderColor: "#fff",
                    hoverBorderColor: "#fff",
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                        padding: 20,
                        font: { size: 14 },
                    },
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => {
                            const total =
                                ctx.chart._metasets[ctx.datasetIndex].total;
                            const value = ctx.raw;
                            const percent = ((value / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${value} (${percent}%)`;
                        },
                    },
                    bodyFont: { size: 14 },
                    padding: 8,
                },
            },
        },
    });

    // // 🔹 Biểu đồ Xu hướng doanh số theo tháng
    // new Chart(document.getElementById("chart-sales-trend"), {
    //     type: "line",
    //     data: {
    //         // labels: [
    //         //     "01",
    //         //     "02",
    //         //     "03",
    //         //     "04",
    //         //     "05",
    //         //     "06",
    //         //     "07",
    //         //     "08",
    //         //     "09",
    //         //     "10",
    //         //     "11",
    //         //     "12",
    //         // ],
    //         labels: data.salesTrend.labels,
    //         datasets: [
    //             {
    //                 label: " Doanh số",
    //                 // data: [
    //                 //     120, 150, 180, 200, 250, 270, 320, 300, 280, 350, 400,
    //                 //     420,
    //                 // ],
    //                 data: data.salesTrend.data,
    //                 borderColor: "#1cc88a",
    //                 backgroundColor: "rgba(28,200,138,0.15)",
    //                 fill: true,
    //                 tension: 0.4,
    //                 borderWidth: 3,
    //                 pointRadius: 4,
    //                 pointBackgroundColor: "#1cc88a",
    //                 pointBorderWidth: 2,
    //                 pointHoverBackgroundColor: "#FFF",
    //                 pointHoverRadius: 5,
    //                 pointHoverBorderColor: "#1cc88a",
    //                 pointHoverBorderWidth: 3,
    //             },
    //         ],
    //     },
    //     options: {
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         plugins: {
    //             legend: { display: false },
    //             tooltip: {
    //                 usePointStyle: true,
    //                 callbacks: {
    //                     title: (ctx) => `Tháng ${ctx[0].label}`,
    //                     label: (ctx) =>
    //                         ` ${ctx.dataset.label}: ${ctx.formattedValue} triệu ₫`,
    //                     labelPointStyle: () => ({
    //                         pointStyle: "rectRounded",
    //                         rotation: 0,
    //                     }),
    //                 },
    //                 bodyFont: { size: 14 },
    //                 padding: 10,
    //             },
    //         },
    //         interaction: { intersect: false, mode: "index" },
    //         scales: {
    //             y: {
    //                 beginAtZero: true,
    //                 ticks: { color: "#555", font: { size: 13 } },
    //                 grid: { color: "#eee", borderDash: [5, 5] },
    //             },
    //             x: {
    //                 ticks: { color: "#555", font: { size: 13 } },
    //                 grid: { display: false },
    //             },
    //         },
    //     },
    //     plugins: [glowPlugin, crosshairPlugin],
    // });
}
function processDashboardData(orders, products = []) {
    // 🔹 1️⃣ Top 5 sản phẩm bán chạy
    const salesCount = {};

    orders
        .filter((order) => order.orderStatus === "Hoàn thành") // chỉ tính đơn hoàn thành
        .forEach((order) => {
            order.products.forEach((item) => {
                const name = item.product?.name || item.ten;
                const qty = item.soLuong || 0;

                if (!salesCount[name]) {
                    salesCount[name] = 0;
                }
                salesCount[name] += qty;
            });
        });

    // Chuyển sang mảng và sắp xếp giảm dần
    const sorted = Object.entries(salesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const topProducts = {
        labels: sorted.map(([name]) => name),
        data: sorted.map(([_, qty]) => qty),
    };

    // 🔹 2️⃣ Cơ cấu tồn kho theo danh mục
    const categoryStock = {};

    // Gom tồn kho theo hãng
    products.forEach((p) => {
        const company = p.company || "Khác";
        const stock = p.stock ?? 0;

        if (!categoryStock[company]) categoryStock[company] = 0;
        categoryStock[company] += stock;
    });

    // Sắp xếp theo tồn kho tăng dần → Lấy 5 hãng có ít hàng nhất
    const sorted2 = Object.entries(categoryStock)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5);

    // Chuyển sang dạng mà Chart.js cần
    const inventoryStructure = {
        labels: sorted2.map(([company]) => company),
        data: sorted2.map(([_, stock]) => stock),
    };

    return { topProducts, inventoryStructure };
}
async function loadProductCharts() {
    const [orders, products] = await Promise.all([
        fetch(`${API_BASE_URL}/orders/all`,{credentials: "include"})
            .then((res) => res.json())
            .catch((error) => {
                console.error(
                    `Lỗi trang Sản Phẩm, renderProductCharts: ${error}`
                );
            }),
        fetch(`${API_BASE}/all`, {  // gọi đúng admin route sản phẩm
            credentials: "include",        // gửi cookie session
        })
            .then((res) => res.json())
            .catch((error) => {
                console.error(
                    `Lỗi trang Sản Phẩm, renderProductCharts: ${error}`
                );
            }),
    ]);
    const chartData = processDashboardData(orders, products);
    renderProductCharts(chartData);
}
loadProductCharts();

// Định dạng tiền tệ VND
function formatCurrency(value) {
    return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    });
}
// Trả về class màu badge dựa theo tồn kho
function getStockClass(stock) {
    if (stock === 0) return "bg-danger"; // hết hàng
    if (stock <= 10) return "bg-warning text-dark"; // sắp hết
    return "bg-success"; // còn hàng
}
// Trả về nội dung badge
function getStockStatus(stock) {
    if (stock === 0) return "Hết hàng";
    if (stock <= 10) return "Sắp hết";
    return "Còn hàng";
}

async function tableProduct(products, currentPage = 1, itemsPerPage = 10) {
    const tbody = document.querySelector("#table-products");
    const pagination = document.querySelector("#pagination");

    // Tính số trang
    const totalPages = Math.ceil(products.length / itemsPerPage);

    // Cắt danh sách sản phẩm cho trang hiện tại
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = products.slice(start, end);

    // Render bảng
    tbody.innerHTML = pageProducts
        .map(
            (product) => `
                <tr>
                    <td class="text-center pe-2">${product.masp}</td>
                    <td class="text-center">${product.name}</td>
                    <td class="text-center">${product.company}</td>
                    <td class="text-center">${formatCurrency(
                        product.price
                    )}</td>
                    <td class="text-center">${product.stock}</td>
                    <td class="text-center">
                        <span class="badge p-2 ${getStockClass(product.stock)}">
                            ${getStockStatus(product.stock)}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary my-1 btn-detail"
                            data-id="${product._id}">
                                Chi tiết
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");

    // Gắn sự kiện cho nút "Chi tiết"
    tbody.querySelectorAll(".btn-detail").forEach((btn) => {
        btn.addEventListener("click", async () => {
            loadProductID(btn.dataset.id)
                .then((product) => showProductDetail(product))
                .catch((error) => {
                    console.log(
                        `Lỗi trang Sản Phẩm, showProductDetail: ${error}`
                    );
                });
        });
    });

    // Render nút phân trang ngay sau khi render bảng
    pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return `
        <li class="page-item px-1 ${pageNum === currentPage ? "active" : ""}">
            <a class="page-link ${
                pageNum === currentPage
                    ? "bg-secondary text-white border-secondary"
                    : ""
            }" 
                style="border-radius:0.45rem !important;" 
                href="#">
                ${pageNum}
            </a>
        </li>
    `;
    }).join("");

    // Gắn sự kiện click để đổi trang
    pagination.querySelectorAll(".page-link").forEach((btn, index) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            tableProduct(products, index + 1, itemsPerPage);
        });
    });
}
loadProducts()
    .then((products) => tableProduct(products))
    .catch((error) =>
        console.log(`Lỗi trang Sản Phẩm, tableProduct: ${error}`)
    );
function showProductDetail(product) {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

    document.getElementById("detail-img").src = `${product.img}`;
    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-company").textContent = product.company;
    document.getElementById("detail-masp").textContent = product.masp;
    document.getElementById("detail-price").textContent = formatCurrency(
        product.price
    );
    document.getElementById("detail-stock").textContent = product.stock;
    document.getElementById("detail-promo").textContent = product.promo?.name
        ? `${product.promo.name} (${product.promo.value}%)`
        : "Không có";

    const d = product.detail || {};
    document.getElementById("detail-screen").textContent = d.screen || "-";
    document.getElementById("detail-os").textContent = d.os || "-";
    document.getElementById("detail-camara").textContent = d.camara || "-";
    document.getElementById("detail-camaraFront").textContent =
        d.camaraFront || "-";
    document.getElementById("detail-cpu").textContent = d.cpu || "-";
    document.getElementById("detail-ram").textContent = d.ram || "-";
    document.getElementById("detail-rom").textContent = d.rom || "-";
    document.getElementById("detail-microUSB").textContent = d.microUSB || "-";
    document.getElementById("detail-battery").textContent = d.battery || "-";

    // Hiển thị modal
    const modal = new bootstrap.Modal(
        document.getElementById("productDetailModal")
    );
    modal.show();

    const editBtn = document.getElementById("editProductBtn");
    if (editBtn) {
        editBtn.onclick = () => {
            // chuyển hướng sang trang chỉnh sửa, kèm id sản phẩm
            location.href = `chinh-sua-sp.html?id=${product._id}`;
        };
    }
     // Nút xoá sản phẩm
    document
        .getElementById("deleteProductBtn")
        .addEventListener("click", async () => {
            if (!confirm("Bạn có chắc muốn xoá sản phẩm này không?")) return;

            try {
                const res = await fetch(`${API_PRODUCT}/${product._id}`, {
                    method: "DELETE",
                    credentials: "include",
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Xoá sản phẩm thất bại!");
                    return;
                }

                alert("Đã xoá sản phẩm thành công!");
                location.reload(); // 🔁 tải lại danh sách để hiển thị dữ liệu mới
            } catch (err) {
                console.error(err);
                alert("Lỗi khi xoá sản phẩm!");
            }
        });
}

document.getElementById("createProductBtn").onclick = () => {
    // chuyển hướng sang trang tạo sản phẩm
    location.href = "them-moi-sp.html";
};

async function renderCategories(productCategories) {
    const newArrivals = document.querySelector("#new-arrivals");
    const promotions = document.querySelector("#promotions");
    const discontinued = document.querySelector("#discontinued");

    newArrivals.innerHTML = productCategories.newArrivals
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
    promotions.innerHTML = productCategories.promotions
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
    discontinued.innerHTML = productCategories.discontinued
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
}

window.addEventListener("pageshow", () => {
    if (sessionStorage.getItem("shouldReload") === "true") {
        loadProducts()
            .then((products) => tableProduct(products))
            .catch((error) =>
                console.log(`Lỗi trang Sản Phẩm, tableProduct: ${error}`)
            );
        sessionStorage.removeItem("shouldReload");
        const productId = sessionStorage.getItem("ProductID");
        if (productId) {
            loadProductID(productId)
                .then((product) => showProductDetail(product))
                .catch((error) => {
                    console.log(`Lỗi trang Sản Phẩm, showProductDetail: ${error}`);
                });
            sessionStorage.removeItem("ProductID");
        }
    }
});
