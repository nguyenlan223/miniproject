import { API_BASE_URL } from "../config.js";

var API_USER = `${API_BASE_URL}/users`;

async function loadUsers(id = "") {
    try {
        const res = await fetch(`${API_USER}/${id}`, {
            credentials: "include",
        });
        return await res.json();
    } catch (error) {
        console.error(`Lỗi trang Khách Hàng, loadUsers: ${error}`);
    }
}

function renderCustomerStats(stats) {
    document.getElementById("total-customers").textContent =
        stats.totalCustomers;
    document.getElementById("new-customers").textContent = stats.newCustomers;
    document.getElementById("repeat-customers").textContent =
        stats.repeatCustomers;
    document.getElementById("avg-customer-value").textContent =
        stats.avgCustomerValue.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        });
}
async function calculateCustomerStats() {
    try {
        const [userRes, orderRes] = await Promise.all([
            fetch(API_USER, { credentials: "include" }),
            fetch(`${API_BASE_URL}/orders/all`, { credentials: "include" }),
        ]);

        const [userData, orderData] = await Promise.all([
            userRes.json(),
            orderRes.json(),
        ]);

        const users = userData.users || userData;
        const orders = orderData.orders || orderData;

        // ⚠️ 1️⃣ Loại bỏ admin
        const customers = users.filter((u) => u.role !== "admin");

        // 1️⃣ Tổng khách hàng
        const totalCustomers = customers.length;

        // 2️⃣ Khách hàng mới (trong 30 ngày gần nhất)
        const now = new Date();
        const newCustomers = customers.filter((u) => {
            const createdAt = new Date(u.createdAt);
            return (now - createdAt) / (1000 * 60 * 60 * 24) <= 30;
        }).length;

        // 3️⃣ Khách hàng mua lại (có >= 2 đơn Hoàn thành)
        const completedOrders = orders.filter(
            (o) => o.orderStatus === "Hoàn thành" && o.user?._id
        );
        const orderCountByUser = {};
        completedOrders.forEach((o) => {
            const uid = o.user._id;
            orderCountByUser[uid] = (orderCountByUser[uid] || 0) + 1;
        });
        const repeatCustomers = Object.entries(orderCountByUser).filter(
            ([uid, count]) => {
                const user = customers.find((u) => u._id === uid);
                return user && count >= 2;
            }
        ).length;

        // 4️⃣ Giá trị TB/khách
        const totalRevenue = completedOrders.reduce(
            (sum, o) => sum + o.tongTienThanhToan,
            0
        );
        const avgCustomerValue =
            totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

        // --- render ra giao diện
        renderCustomerStats({
            totalCustomers,
            newCustomers,
            repeatCustomers,
            avgCustomerValue,
        });
    } catch (err) {
        console.error("❌ Lỗi khi tính thống kê khách hàng:", err);
    }
}
calculateCustomerStats();

function renderTable(users) {
    const tbody = document.querySelector("#tbody-users");
    tbody.innerHTML = users
        .map(
            (u) => `
            <tr>
                <td class="ps-3">${u.ho} ${u.ten}</td>
                <td class="">${u.email}</td>
                <td class="text-center">${u.username}</td>
                <td class="text-center">
                    <span class="badge bg-${
                        u.role === "admin" ? "danger" : "secondary"
                    }">
                        ${u.role}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary my-1 btn-detail" data-id="${
                        u._id
                    }">Chi tiết</button>
                </td>
            </tr>`
        )
        .join("");
}
function fetchUsers() {
    loadUsers()
        .then((users) => renderTable(users))
        .catch((error) =>
            console.log(`Lỗi trang Khách Hàng, renderTable: ${error}`)
        );
}
fetchUsers();

// Xem chi tiết người dùng
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-detail")) {
        const id = e.target.dataset.id;
        loadUsers(id)
            .then(({ user }) => showUserModal(user))
            .catch((error) =>
                console.log(`Lỗi trang Khách Hàng, showUserModal: ${error}`)
            );
    }
});
async function showUserModal(user) {
    // Điền dữ liệu vào form
    document.getElementById("user-ho").value = user.ho || "";
    document.getElementById("user-ten").value = user.ten || "";
    document.getElementById("user-email").value = user.email || "";
    document.getElementById("user-username").value = user.username || "";
    document.getElementById("user-role").value = user.role || "user";
    document.getElementById("user-status").value = user.off ? "true" : "false";

    const ul = document.getElementById("user-addresses");
    ul.innerHTML = user.diaChi?.length
        ? user.diaChi
              .map((addr) => `<li class="list-group-item">${addr}</li>`)
              .join("")
        : `<li class="list-group-item text-muted">Chưa có địa chỉ</li>`;

    // Hiển thị modal
    const modal = new bootstrap.Modal(
        document.getElementById("userDetailModal")
    );
    modal.show();

    // Gán lại event (tránh lặp)
    document.getElementById("btn-save-user").onclick = async (e) => {
        e.preventDefault();
        const updatedData = {
            ho: document.getElementById("user-ho").value.trim(),
            ten: document.getElementById("user-ten").value.trim(),
            email: document.getElementById("user-email").value.trim(),
            role: document.getElementById("user-role").value,
            off: document.getElementById("user-status").value === "true",
        };

        const res = await fetch(`${API_USER}/${user._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (data.success) {
            alert("Cập nhật người dùng thành công!");
            modal.hide();
            fetchUsers(); // gọi lại render bảng
            calculateCustomerStats();
        } else alert(data.error);
    };

    document.getElementById("btn-delete-user").onclick = async (e) => {
        e.preventDefault();
        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        const res = await fetch(`${API_USER}/${user._id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
            alert("Đã xóa người dùng!");
            modal.hide();
            fetchUsers();
            calculateCustomerStats();
        } else alert(data.error);
    };
}

// Gán sự kiện mở modal (Thêm người dùng)
document.getElementById("btn-create").addEventListener("click", () => {
    const modal = new bootstrap.Modal(
        document.getElementById("createUserModal")
    );
    document.getElementById("create-user-form").reset(); // reset form mỗi khi mở
    modal.show();
});

// Gửi request tạo user
document
    .getElementById("create-user-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();
        const userData = {
            ho: document.getElementById("create-ho").value.trim(),
            ten: document.getElementById("create-ten").value.trim(),
            email: document.getElementById("create-email").value.trim(),
            username: document.getElementById("create-username").value.trim(),
            password: document.getElementById("create-password").value.trim(),
            role: document.getElementById("create-role").value,
        };

        try {
            const res = await fetch(API_USER, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // nếu có xác thực cookie
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (!res.ok)
                throw new Error(data.error || "Tạo người dùng thất bại!");

            // ✅ Thành công
            alert("Tạo người dùng thành công!");
            bootstrap.Modal.getInstance(
                document.getElementById("createUserModal")
            ).hide();
            fetchUsers(); // gọi lại render bảng
            calculateCustomerStats();
        } catch (err) {
            alert(err.message);
        }
    });
