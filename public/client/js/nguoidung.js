var currentUser;
var tongTienTatCaDonHang = 0;
var tongSanPhamTatCaDonHang = 0;
var selectedDiachi = null;
// frontend config

window.onload = async function () {
    console.log('nguoidung.js loaded');
    khoiTao();

    try {
    const res = await fetch("https://miniproject-n8x9.onrender.com/api/products");
    const list_products = await res.json();
    } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
  }

    // Lấy user hiện tại từ server (session)
    try {
        const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/me", { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.user) {
            currentUser = data.user;

            // Render thông tin user
           addInfoUser(currentUser);

            // Render danh sách địa chỉ
            renderDiachiList(currentUser);
        } else {
            document.getElementsByClassName('infoUser')[0].innerHTML = `
                <h2 style="color:red; text-align:center; padding:50px;">
                    Bạn chưa đăng nhập !!
                </h2>`;
        }
    } catch (err) {
        console.error("Lỗi lấy user từ server:", err);
    }
};

async function changeAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Preview ảnh ngay lập tức trên giao diện
  const img = document.querySelector('.avatar-box img');
  img.src = URL.createObjectURL(file);

  // Gửi formData lên server
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/avatar", {
      method: "PUT",
      body: formData,
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // ✅ Cập nhật user hiện tại
      currentUser.avatar = data.user.avatar;
      setCurrentUser(currentUser);

      addAlertBox("Cập nhật ảnh đại diện thành công!", "#5f5", "#000", 3000);
    } else {
      addAlertBox(data.error || "Lỗi khi cập nhật ảnh đại diện!", "#ff6b6b", "#fff", 3000);
    }
  } catch (err) {
    console.error("Lỗi khi upload avatar:", err);
    addAlertBox("Không thể kết nối tới server!", "#ff6b6b", "#fff", 3000);
  }
}


function toggleAvatarMenu() {
  const menu = document.getElementById("avatarMenu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function openFileInput() {
  document.getElementById("avatarFile").click();
  document.getElementById("avatarMenu").style.display = "none";
}

async function removeAvatar() {
  if (!confirm("Bạn có chắc muốn xóa ảnh đại diện?")) return;

  try {
    const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/avatar", {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();

    if (res.ok && data.success) {
      currentUser.avatar = null;
      setCurrentUser(currentUser);
      document.querySelector(".avatar-box img").src = "https://placehold.co/140x140";
      document.querySelector(".avatar-box img").alt = "Avatar";
      addAlertBox("Đã xóa ảnh đại diện!", "#5f5", "#000", 3000);
    } else {
      addAlertBox(data.error || "Không thể xóa ảnh đại diện!", "#ff6b6b", "#fff", 3000);
    }
  } catch (err) {
    console.error(err);
    addAlertBox("Lỗi kết nối server!", "#ff6b6b", "#fff", 3000);
  }

  document.getElementById("avatarMenu").style.display = "none";
}

// Đóng menu nếu click ra ngoài
document.addEventListener("click", (e) => {
  const menu = document.getElementById("avatarMenu");
  const avatarBox = document.querySelector(".avatar-box");
  if (menu && avatarBox && !avatarBox.contains(e.target)) {
    menu.style.display = "none";
  }
});

function addInfoUser(user) {
    if (!user) return;

    document.getElementsByClassName('infoUser')[0].innerHTML = `
    <div class="user-container">
        <!-- LEFT: Avatar -->
        <div class="user-left avatar-box">
  <div class="avatar-wrapper" onclick="toggleAvatarMenu()">
    <img src="${user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" alt="Avatar">
    <div class="avatar-overlay">
      <i class="fa fa-camera"></i>
    </div>
  </div>

  <div class="avatar-menu" id="avatarMenu">
    <button onclick="openFileInput()"><i class="fa fa-upload"></i> Đổi ảnh đại diện</button>
    <button onclick="removeAvatar()"><i class="fa fa-trash"></i> Xóa ảnh đại diện</button>
  </div>

  <input type="file" id="avatarFile" accept="image/*" style="display:none" onchange="changeAvatar(event)">
</div>


        <!-- RIGHT: Thông tin -->
        <div class="user-right info-card">
            <h2>Hồ sơ của tôi</h2>

            <div class="info-row">
                <label>Tài khoản</label>
                <input type="text" value="${user.username}" readonly>
            </div>

            <div class="info-row editable">
                <label>Họ</label>
                <input type="text" value="${user.ho}" readonly>
                <i class="fa fa-pencil" onclick="changeInfo(this, 'ho')"></i>
            </div>

            <div class="info-row editable">
                <label>Tên</label>
                <input type="text" value="${user.ten}" readonly>
                <i class="fa fa-pencil" onclick="changeInfo(this, 'ten')"></i>
            </div>

            <div class="info-row editable">
                <label>Email</label>
                <input type="text" value="${user.email}" readonly>
                <i class="fa fa-pencil" onclick="changeInfo(this, 'email')"></i>
            </div>

            <div class="info-row password-row">
                <label>Mật khẩu</label>
                <i class="fa fa-pencil" onclick="openChangePass()">Đổi mật khẩu</i>
            </div>

            <div id="khungDoiMatKhau">
                <div class="pass-row"><label>Mật khẩu cũ:</label><input type="password"></div>
                <div class="pass-row"><label>Mật khẩu mới:</label><input type="password"></div>
                <div class="pass-row"><label>Xác nhận mật khẩu:</label><input type="password"></div>
                <div class="pass-row" id="btn_container"><button onclick="changePass()">Đồng ý</button></div>
            </div>

            <div class="info-row">
                <label>Địa chỉ</label>
                <div id="diachiList" id="diaChi_container"></div>
                <button id="btnThemDiaChi" onclick="openAddDiachiModal()" class="btn-them-diachi">
                    <i class="fa fa-plus"></i> Thêm địa chỉ
                </button>
            </div>
        </div>
    </div>`;
}


function openChangePass() {
    var khungChangePass = document.getElementById('khungDoiMatKhau');
    var actived = khungChangePass.classList.contains('active');
    if (actived) khungChangePass.classList.remove('active');
    else khungChangePass.classList.add('active');
}

async function changePass() {
    const khungChangePass = document.getElementById('khungDoiMatKhau');
    const inps = khungChangePass.getElementsByTagName('input');
    const oldPassword = inps[0].value.trim();
    const newPassword = inps[1].value.trim();
    const confirmPassword = inps[2].value.trim();

    if (!oldPassword) {
        alert('Vui lòng nhập mật khẩu cũ');
        inps[0].focus();
        return;
    }
    if (!newPassword) {
        alert('Vui lòng nhập mật khẩu mới');
        inps[1].focus();
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        inps[2].focus();
        return;
    }

    try {
        const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/change-password", {
            method: 'PUT', // dùng PUT vì backend là PUT
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // gửi cookie session
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Lỗi khi đổi mật khẩu');
            return;
        }

        alert('Đổi mật khẩu thành công!');
        openChangePass(); // đóng khung đổi mật khẩu
    } catch (err) {
        console.error(err);
        alert('Lỗi kết nối server!');
    }
}


async function changeInfo(iTag, field) {
    const inp = iTag.parentElement.previousElementSibling.querySelector('input');
    
    if (!inp.readOnly && inp.value !== '') {
        const value = inp.value;

        try {
            const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/update", {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ field, value })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.error || 'Lỗi khi cập nhật thông tin');
                inp.value = currentUser[field]; // revert
                return;
            }

            currentUser = data.user; // dữ liệu mới từ server
            setCurrentUser(currentUser)
            capNhat_ThongTin_CurrentUser();
            iTag.innerHTML = '';
        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối server!');
        }
    } else {
        iTag.innerHTML = 'Đồng ý';
        inp.focus();
    }

    inp.readOnly = !inp.readOnly;
}



// ========== QUẢN LÝ ĐỊA CHỈ ==========

// Render danh sách địa chỉ
function renderDiachiList(user) {
    var diachiList = document.getElementById('diachiList');
    if (!diachiList) {
        console.log('diachiList element not found');
        return;
    }
    
    if (!user.diaChi || user.diaChi.length === 0) {
        diachiList.innerHTML = '<span style="color: #999; padding: 10px; display: block;">Chưa có địa chỉ nào</span>';
    } else {
        var html = '';
        for (var i = 0; i < user.diaChi.length; i++) {
            const d=user.diaChi[i];
            html += `<div class="diachi-item">
                    <span>${d.diaChiChiTiet}, ${d.phuongXa}, ${d.quanHuyen}, ${d.tinhThanh}</span>
                    <i class="fa fa-edit" onclick="openEditDiachiModal(${i})" title="Sửa địa chỉ"></i>
                    <i class="fa fa-trash" onclick="deleteDiachi(${i})" title="Xóa địa chỉ"></i>
                </div>`;
        }
        diachiList.innerHTML = html;
    }
}

// Mở modal thêm địa chỉ mới
function openAddDiachiModal() {
    if (!currentUser) {
        console.error('currentUser is not defined');
        addAlertBox('Lỗi: Không tìm thấy thông tin người dùng!', '#ff6b6b', '#fff', 3000);
        return;
    }

    // Tạo modal HTML
    var modal = document.createElement('div');
    modal.id = 'addDiachiModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-box">
            <h3>Thêm địa chỉ mới</h3>
            <select class="form-select" id="city">
                <option value="" selected>Chọn tỉnh thành</option>
            </select>
            <select class="form-select" id="district">
                <option value="" selected>Chọn quận huyện</option>
            </select>
            <select class="form-select" id="ward">
                <option value="" selected>Chọn phường xã</option>
            </select>
            <input type="text" id="diachiChiTiet" placeholder="Địa chỉ chi tiết (số nhà, đường, ...)">
            <div class="btn-group">
                <button class="btn-success" onclick="submitAddDiachi()">Thêm</button>
                <button class="btn-danger" onclick="closeAddDiachiModal()">Hủy</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e){
        if (e.target === modal) closeAddDiachiModal();
    });

    // Load axios nếu chưa có
    if (typeof axios === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js';
        script.onload = function() { loadVietnamData(); };
        document.head.appendChild(script);
    } else {
        loadVietnamData();
    }
}

// Load dữ liệu Việt Nam và render vào select
function loadVietnamData() {
    var citis = document.getElementById("city");
    var districts = document.getElementById("district");
    var wards = document.getElementById("ward");

    var Parameter = {
        url: "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json", 
        method: "GET", 
        responseType: 'json', 
    };

    axios(Parameter).then(function (result) {
        renderCity(result.data);
    }).catch(function (error) {
        console.error('Error loading Vietnam data:', error);
        addAlertBox('Lỗi tải dữ liệu địa chỉ!', '#ff6b6b', '#fff', 3000);
    });

    function renderCity(data) {
        for (const x of data) {
            citis.options[citis.options.length] = new Option(x.Name, x.Id);
        }
        citis.onchange = function () {
            districts.length = 1;
            wards.length = 1;
            if (this.value != "") {
                const result = data.filter(n => n.Id === this.value);
                for (const k of result[0].Districts) {
                    districts.options[districts.options.length] = new Option(k.Name, k.Id);
                }
            }
        };
        districts.onchange = function () {
            wards.length = 1;
            const dataCity = data.filter((n) => n.Id === citis.value);
            if (this.value != "") {
                const dataWards = dataCity[0].Districts.filter(n => n.Id === this.value)[0].Wards;
                for (const w of dataWards) {
                    wards.options[wards.options.length] = new Option(w.Name, w.Id);
                }
            }
        };
    }
}

// Submit thêm địa chỉ
async function submitAddDiachi() {
    var city = document.getElementById('city');
    var district = document.getElementById('district');
    var ward = document.getElementById('ward');
    var diaChiChiTiet = document.getElementById('diachiChiTiet').value.trim();

    if (city.value === '' || district.value === '' || ward.value === '' || diachiChiTiet === '') {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    var xa=ward.options[ward.selectedIndex].text;
    var huyen=district.options[district.selectedIndex].text;
    var tinh=city.options[city.selectedIndex].text;
    var diachi = diaChiChiTiet + ', ' + xa+ ', ' + huyen+ ', ' + tinh;
    data={
        diaChiChiTiet,
        phuongXa: xa,
        quanHuyen: huyen,
        tinhThanh: tinh
    };
    const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/address", {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    credentials: 'include', // gửi cookie session
    body: JSON.stringify(data)
});

    if(!res.ok){
        alert('Lỗi khi thêm địa chỉ');
    }
   currentUser=await res.json();
   
    // Cập nhật dữ liệu trong frontend
    setCurrentUser(currentUser);
    // Cập nhật giao diện
    renderDiachiList(currentUser);

    addAlertBox('Đã thêm địa chỉ thành công!', '#5f5', '#000', 3000);
    closeAddDiachiModal();
}

// Đóng modal thêm địa chỉ
function closeAddDiachiModal() {
    var modal = document.getElementById('addDiachiModal');
    if (modal) {
        modal.remove();
    }
}

function openEditDiachiModal(index) {
    var diachiCu = currentUser.diaChi[index];
    var chiTiet = diachiCu.diaChiChiTiet || '';
    var xa = diachiCu.phuongXa || '';
    var huyen = diachiCu.quanHuyen || '';
    var tinh = diachiCu.tinhThanh || '';

    // Tạo modal edit
    var modal = document.createElement('div');
    modal.id = 'editDiachiModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    modal.style.animation = 'fadeIn 0.3s ease';

    modal.innerHTML = `
        <div style="
            background: #fff; 
            padding: 25px 30px; 
            border-radius: 16px; 
            width: 420px; 
            max-width: 90%; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            font-family: 'Segoe UI', sans-serif;
        ">
            <h3 style="margin-bottom: 20px; color: #333; font-weight: 600; font-size: 20px;">Sửa địa chỉ</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">
                <select class="form-select" id="city" aria-label="Chọn tỉnh thành" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc;">
                    <option value="" selected>Chọn tỉnh thành</option>           
                </select>
                <select class="form-select" id="district" aria-label="Chọn quận huyện" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc;">
                    <option value="" selected>Chọn quận huyện</option>
                </select>
                <select class="form-select" id="ward" aria-label="Chọn phường xã" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc;">
                    <option value="" selected>Chọn phường xã</option>
                </select>
            </div>
            <input type="text" id="diachiChiTiet" placeholder="Địa chỉ chi tiết (số nhà, đường, ...)" 
                value="${chiTiet}" 
                style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px; font-size: 15px;">
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="submitEditDiachi(${index})" 
                    style="background: linear-gradient(135deg, #4CAF50, #45a049); color: #fff; padding: 10px 18px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                    Cập nhật
                </button>
                <button onclick="closeEditDiachiModal()" 
                    style="background: linear-gradient(135deg, #f44336, #d32f2f); color: #fff; padding: 10px 18px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                    Hủy
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Load dữ liệu Việt Nam nếu cần
    if (typeof axios === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js';
        script.onload = function() {
            loadVietnamDataForEdit(tinh, huyen, xa);
        };
        document.head.appendChild(script);
    } else {
        loadVietnamDataForEdit(tinh, huyen, xa);
    }
}

// Load data for edit modal and preselect
function loadVietnamDataForEdit(tinhName, huyenName, xaName) {
    var citis = document.getElementById("city");
    var districts = document.getElementById("district");
    var wards = document.getElementById("ward");

    var Parameter = {
        url: "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json", 
        method: "GET", 
        responseType: "json", 
    };

    axios(Parameter).then(function (result) {
        var data = result.data;
        for (const x of data) {
            citis.options[citis.options.length] = new Option(x.Name, x.Id);
            if (x.Name === tinhName) {
                citis.value = x.Id;
            }
        }

        if (citis.value != "") {
            const result = data.filter(n => n.Id === citis.value);
            for (const k of result[0].Districts) {
                districts.options[districts.options.length] = new Option(k.Name, k.Id);
                if (k.Name === huyenName) {
                    districts.value = k.Id;
                }
            }
        }

        if (districts.value != "") {
            const dataCity = data.filter((n) => n.Id === citis.value);
            const dataWards = dataCity[0].Districts.filter(n => n.Id === districts.value)[0].Wards;
            for (const w of dataWards) {
                wards.options[wards.options.length] = new Option(w.Name, w.Id);
                if (w.Name === xaName) {
                    wards.value = w.Id;
                }
            }
        }

        // Attach onchange for edit
        citis.onchange = function () {
            districts.length = 1;
            wards.length = 1;
            if (this.value != "") {
                const result = data.filter(n => n.Id === this.value);
                for (const k of result[0].Districts) {
                    districts.options[districts.options.length] = new Option(k.Name, k.Id);
                }
            }
        };
        districts.onchange = function () {
            wards.length = 1;
            const dataCity = data.filter((n) => n.Id === citis.value);
            if (this.value != "") {
                const dataWards = dataCity[0].Districts.filter(n => n.Id === this.value)[0].Wards;
                for (const w of dataWards) {
                    wards.options[wards.options.length] = new Option(w.Name, w.Id);
                }
            }
        };
    }).catch(function (error) {
        console.error('Error loading Vietnam data:', error);
        addAlertBox('Lỗi tải dữ liệu địa chỉ!', '#ff6b6b', '#fff', 3000);
    });
}

// Submit sửa địa chỉ
async function submitEditDiachi(index) {
    var city = document.getElementById('city');
    var district = document.getElementById('district');
    var ward = document.getElementById('ward');
    var diaChiChiTiet = document.getElementById('diachiChiTiet').value.trim();

    if (city.value === '' || district.value === '' || ward.value === '' || diachiChiTiet === '') {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    var data={
        diaChiChiTiet,
        phuongXa: ward.options[ward.selectedIndex].text,
        quanHuyen: district.options[district.selectedIndex].text,
        tinhThanh: city.options[city.selectedIndex].text
    }
    diaChi=currentUser.diaChi[index];
   const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/address/${diaChi._id}", {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
});


  if (!res.ok) {
    const err = await res.json();
    alert('Lỗi: ' + err.error);
  } 
    currentUser=await res.json();
    setCurrentUser(currentUser);
    renderDiachiList(currentUser);

    addAlertBox('Đã cập nhật địa chỉ thành công!', '#5f5', '#000', 3000);
    closeEditDiachiModal();
}

// Đóng modal sửa địa chỉ
function closeEditDiachiModal() {
    var modal = document.getElementById('editDiachiModal');
    if (modal) {
        modal.remove();
    }
}

// Xóa địa chỉ
async function deleteDiachi(index) {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
         diaChi=currentUser.diaChi[index];
         const res = await fetch("https://miniproject-n8x9.onrender.com/api/users/address/${diaChi._id}", {
         method: 'DELETE',
         credentials: 'include'
});


  if (!res.ok) {
    const err = await res.json();
    alert('Lỗi: ' + err.error);
  } 
        data=await res.json();
        currentUser=data.user
        setCurrentUser(currentUser);
        renderDiachiList(currentUser);
        
        addAlertBox('Đã xóa địa chỉ thành công!', '#5f5', '#000', 3000);
    }
}
// ============ POPUP CHỌN ĐỊA CHỈ TRONG GIỎ HÀNG ============

// Giả sử hàm này được gọi khi click "Thanh Toán" ở trang giỏ hàng để mở popup chọn địa chỉ
function openChonDiachiPopup() {
    if (!currentUser) {
        alert('Bạn cần đăng nhập để thanh toán!');
        return;
    }

    if (!currentUser.diaChi || currentUser.diaChi.length === 0) {
        alert('Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ!');
        openAddDiachiModal();
        return;
    }

    // Reset selectedDiachi mỗi lần mở popup
    selectedDiachi = currentUser.diaChi[0] || null;

    var modal = document.createElement('div');
    modal.id = 'chonDiachiPopup';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    var html = `
        <div style="background: white; padding: 20px; border-radius: 10px; width: 500px; max-width: 90%;">
            <h3 style="background: #2196F3; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0;">Chọn địa chỉ nhận hàng</h3>
            <div id="diachiDropdown" style="max-height: 200px; overflow-y: auto;">
    `;
    
    for (var i = 0; i < currentUser.diaChi.length; i++) {
        const dia = `${currentUser.diaChi[i].diaChiChiTiet}, ${currentUser.diaChi[i].phuongXa}, ${currentUser.diaChi[i].quanHuyen}, ${currentUser.diaChi[i].tinhThanh}`;
        html += `
            <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="selectDiachi(this, '${dia.replace(/'/g, "\\'")}')">
                <input type="checkbox" style="margin-right: 10px;" ${i === 0 ? 'checked' : ''}>
                <i class="fa fa-map-marker" style="margin-right: 10px; color: #666;"></i>
                <span>${dia}</span>
            </div>
        `;
    }

    html += `
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <button onclick="openAddDiachiModalFromPopup()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    + Thêm địa chỉ mới
                </button>
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button id="btnHuy" onclick="closeChonDiachiPopup()" style="background: #9E9E9E; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Hủy</button>
                <button id="btnThanhToan" onclick="confirmThanhToan()" style="background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Thanh Toán</button>
            </div>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeChonDiachiPopup();
        }
    });
}

// Hàm chọn địa chỉ (không đóng popup)
function selectDiachi(element, diachi) {
    // Deselect all checkboxes
    var checkboxes = document.querySelectorAll('#diachiDropdown input[type="checkbox"]');
    checkboxes.forEach(function(cb) {
        cb.checked = false;
    });

    // Select the clicked one
    element.querySelector('input[type="checkbox"]').checked = true;

    // Lưu địa chỉ đã chọn vào biến toàn cục
    selectedDiachi = diachi;
    // console.log('Địa chỉ đã chọn:', selectedDiachi);
}

// Mở modal thêm địa chỉ từ popup
function openAddDiachiModalFromPopup() {
    openAddDiachiModal();
    // Sau khi thêm, có thể reload popup nếu cần, nhưng để đơn giản, giả định user đóng và mở lại
}

// Confirm và thanh toán
function confirmThanhToan() {
    if (!selectedDiachi) {
        alert('Vui lòng chọn địa chỉ nhận hàng!');
        return;
    }

    if (window.confirm('Bạn có chắc chắn muốn thanh toán đơn hàng với địa chỉ: ' + selectedDiachi + '?')) {
        // Logic xử lý thanh toán: Thêm đơn hàng vào currentUser.donhang, cập nhật status, v.v.
        // Giả sử hàm xuLyThanhToan(diachi) ở đây (bạn cần implement dựa trên code gốc)
        //xuLyThanhToan(selectedDiachi);
        closeChonDiachiPopup();
        addAlertBox('Đơn hàng đã được đặt thành công!', '#5f5', '#000', 5000);
        // Chuyển hướng đến trang xác nhận hoặc reload giỏ hàng
    } else {
        console.log('Hủy thanh toán');
    }
}

// Đóng popup chọn địa chỉ
function closeChonDiachiPopup() {
    var modal = document.getElementById('chonDiachiPopup');
    if (modal) {
        modal.remove();
    }
}

// Giả sử hàm xuLyThanhToan (thay bằng code thực tế của bạn)
function xuLyThanhToan(diachi) {
    // Lấy giỏ hàng từ localStorage hoặc currentUser.giohang
    var gioHang = getGioHang(); // Giả định hàm này tồn tại
    if (!gioHang || gioHang.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    var donHangMoi = {
        ngaymua: new Date(),
        diachiNhanHang: diachi,
        sp: gioHang,
        tinhTrang: 'Đang chờ xử lý',
        phuongThucThanhToan: 'Thanh toán khi nhận hàng', // Hoặc từ form chọn
        trangThaiThanhToan: 'Chưa thanh toán'
    };

    if (!currentUser.donhang) {
        currentUser.donhang = [];
    }
    currentUser.donhang.push(donHangMoi);

    // Xóa giỏ hàng sau thanh toán
    clearGioHang(); // Giả định hàm này

    setCurrentUser(currentUser);
    updateListUser(currentUser);

    // Cập nhật UI nếu cần
}

// Đảm bảo các hàm có thể được gọi từ HTML
window.openAddDiachiModal = openAddDiachiModal;
window.openEditDiachiModal = openEditDiachiModal;
window.deleteDiachi = deleteDiachi;
window.submitAddDiachi = submitAddDiachi;
window.closeAddDiachiModal = closeAddDiachiModal;
window.submitEditDiachi = submitEditDiachi;
window.closeEditDiachiModal = closeEditDiachiModal;
window.openChonDiachiPopup = openChonDiachiPopup; // Gọi hàm này khi click "Thanh Toán" ở giỏ hàng