// ================= GLOBAL VARIABLES =================
var products = []; // Danh sách sản phẩm trong giỏ hàng
var cart = null;   // Giỏ hàng từ server
var currentUser = null; // User hiện tại
var API_BASE = window.location.origin.includes('localhost')
    ? "http://localhost:5000"
    : "https://miniproject-n8x9.onrender.com";
window.onload = async function () {
    khoiTao()
   try {
    const res = await fetch(`${API_BASE}/api/products`);
    var list_products = await res.json();
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
  }
   const currentUser = await getCurrentUser(); 
   if (!currentUser) {
    addAlertBox('Vui lòng đăng nhập trước khi xem giỏ hàng', '#e74c3c', '#fff', 4000);
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
   }

      // Lấy user hiện tại
    //Đảm bảo rằng ta chờ loadCart() chạy xong trước khi vẽ bảng.
    await loadCart(); // tải giỏ hàng từ server trước
    addProductToTable(currentUser);// giờ products đã có dữ liệu->products đã được load sẵn, không còn bị undefined.
    
    // Thêm event listener để đóng modal khi click bên ngoài (chỉ background)
    window.addEventListener('click', function(event) {
        var paymentModal = document.getElementById('paymentModal');
        var addressModal = document.getElementById('addressModal');
        
        if (paymentModal && event.target === paymentModal) {
            closePaymentModal();
        }
        if (addressModal && event.target === addressModal) {
            closeAddressModal();
        }
    });
}
// lấy giỏ hàng của user
async function loadCart() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/api/cart`,{
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            cart=data.cart;
            products =cart.products || [];
        } else {
            products = [];
        }
    } catch (err) {
        console.error("Lỗi tải giỏ hàng:", err);
        products = [];
    }
}

//render bảng giỏ hàng
 function addProductToTable(user) {
    var table = document.getElementsByClassName('listSanPham')[0];
    var s = `
        <tbody>
            <tr>
                <th><input type="checkbox" onclick="chonTatCa(this)"></th>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th>Thời gian</th>
                <th>Xóa</th>
            </tr>`;
    if (!user) {
        s += `
            <tr>
                <td colspan="8"> 
                    <h1 style="color:red; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Bạn chưa đăng nhập !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    }
     if (!Array.isArray(products) || products.length === 0) {
        s += `
            <tr>
                <td colspan="8"> 
                    <h1 style="color:green; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Giỏ hàng trống !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    }

    var totalPrice = 0;
    for (var i = 0; i < products.length; i++) {
        var soluongSp = products[i].soLuong;
        const cartItem = products[i];
        const p = cartItem.product; // document Product sau populate
        var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
        var thoigian = new Date(cart.updatedAt).toLocaleString();
        var thanhtien = price * soluongSp;
        // Thêm thuộc tính selected nếu chưa có (mặc định false)
        if (typeof products[i].selected === 'undefined') {
            products[i].selected = false;
        }

        // chỉ cộng tổng tiền nếu sản phẩm được tick
        if (products[i].selected) {
            totalPrice += thanhtien;
        }

        s += `
            <tr>
                <td><input type="checkbox" onchange="chonSanPham(${i}, this)" ${products[i].selected ? 'checked' : ''}></td>
                <td>${i + 1}</td>
                <td class="noPadding imgHide">
                    <a target="_blank" href="chitietsanpham.html?${p.name.split(' ').join('-')}" title="Xem chi tiết">
                        ${p.name}
                        <img src="${p.img}">
                    </a>
                </td>
                <td class="alignRight">${numToString(price)} ₫</td>
                <td class="soluong">
                    <button onclick="giamSoLuong('${i}')"><i class="fa fa-minus"></i></button>
                    <input size="1" onchange="capNhatSoLuongFromInput(this,${i})" value=${soluongSp}>
                    <button onclick="tangSoLuong('${i}')"><i class="fa fa-plus"></i></button>
                </td>
                <td class="alignRight">${numToString(thanhtien)} ₫</td>
                <td style="text-align: center">${thoigian}</td>
                <td class="noPadding"> <i class="fa fa-trash" onclick="xoaSanPhamTrongGioHang(${i})"></i> </td>
            </tr>
        `;
    }

    s += `
            <tr style="font-weight:bold; text-align:center">
                <td colspan="5">TỔNG TIỀN CÁC SẢN PHẨM ĐÃ CHỌN: </td>
                <td class="alignRight">${numToString(totalPrice)} ₫</td>
                <td class="thanhtoan" onclick="thanhToan()"> Thanh Toán </td>
                <td class="xoaHet" onclick="xoaHet()"> Xóa hết </td>
            </tr>
        </tbody>
    `;

    table.innerHTML = s;
}

// Chọn sản phẩm
function chonSanPham(index, checkbox) {
    products[index].selected = checkbox.checked;
    setCurrentUser(currentUser);
    addProductToTable(currentUser);
}

// Chọn tất cả
function chonTatCa(cb) {
    for (var p of products) {
        p.selected = cb.checked;
    }
    setCurrentUser(currentUser);
    addProductToTable(currentUser);
}

// Xóa 1 sản phẩm trong giỏ
async function xoaSanPhamTrongGioHang(i) {
    const productId = products[i].product._id;

    if (window.confirm('Xác nhận xóa sản phẩm này khỏi giỏ hàng?')) {
        try {
            const res = await fetch(`${API_BASE}/api/cart?productId=${productId}`, {
                method: 'DELETE',
                credentials: 'include' // ✅ quan trọng: gửi cookie session
            });

            const data = await res.json();

            if (data.success) {
                // Xóa khỏi mảng local
                products.splice(i, 1);
                capNhatMoiThu();
            } else {
                alert(data.message || 'Không thể xóa sản phẩm.');
            }
        } catch (err) {
            console.error('Lỗi khi xóa sản phẩm:', err);
        }
    }
}
// Xóa tất cả sản phẩm
async function xoaHet() {
    if (products.length) {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
            try {
                const res = await fetch(`${API_BASE}/api/cart`, {
                    method: 'DELETE',
                    credentials: 'include' // ✅ gửi session
                });

                const data = await res.json();

                if (data.success) {
                    // Làm trống giỏ hàng local
                    products = [];
                    capNhatMoiThu();
                } else {
                    alert(data.message || 'Không thể xóa giỏ hàng.');
                }
            } catch (err) {
                console.error('Lỗi khi xóa toàn bộ sản phẩm:', err);
            }
        }
    }
}
// Cập nhật số lượng lúc nhập số lượng vào input
async function capNhatSoLuongFromInput(inp, index) {
    var soLuongMoi = Number(inp.value);
    if (!soLuongMoi || soLuongMoi <= 0) soLuongMoi = 1;
    products[index].soLuong = soLuongMoi; 
    await updateCartOnServer();   
    capNhatMoiThu();
    
}

async function giamSoLuong(index) {
    if (products[index].soLuong > 1) products[index].soLuong--;
     await updateCartOnServer();
     capNhatMoiThu();
}
//  Cập nhật giỏ hàng lên server 
async function updateCartOnServer() {
    try {
        const res = await fetch(`${API_BASE}/api/cart`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // ✅ gửi cookie session lên server
            body: JSON.stringify({
                products: products.map(p => ({
                    product: p.product._id,
                    soLuong: p.soLuong
                }))
            })
        });

        const data = await res.json();

        if (!data.success) {
            console.warn('⚠️ Không thể cập nhật giỏ hàng:', data.message || 'Lỗi không xác định');
        } else {
            console.log('✅ Giỏ hàng đã được cập nhật trên server');
        }

    } catch (err) {
        console.error('❌ Lỗi cập nhật giỏ hàng:', err);
    }
}

async function tangSoLuong(index) {
     products[index].soLuong++;
      await updateCartOnServer();  
     capNhatMoiThu();
 
}

// Thanh toán chỉ các sản phẩm được tick
async function thanhToan() {
    var c_user =await getCurrentUser();
    if (c_user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }

    var spDaChon = products.filter(p => p.selected);
    if (spDaChon.length == 0) {
        addAlertBox('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán !!', '#ffb400', '#fff', 2000);
        return;
    }

    // Kiểm tra địa chỉ nhận hàng
    if (!c_user.diaChi || c_user.diaChi.length === 0) {
        addAlertBox('Bạn chưa điền địa chỉ nhận hàng! Vui lòng thêm địa chỉ trước khi thanh toán.', '#ff6b6b', '#fff', 5000);
        setTimeout(function() {
            window.location.href = 'nguoidung.html';
        }, 2000);
        return;
    }

    // Nếu có nhiều địa chỉ, hiển thị modal chọn địa chỉ
    if (c_user.diaChi.length > 1) {
        showAddressSelectionModal(spDaChon, c_user.diaChi);
    } else {
        // Chỉ có 1 địa chỉ, sử dụng luôn
        window.selectedAddress = c_user.diaChi[0];
        showPaymentModal(spDaChon);
    }
}

// Hiển thị modal chọn phương thức thanh toán
function showPaymentModal(selectedProducts) {
    console.log('Opening payment modal with products:', selectedProducts);
    if (!selectedProducts || selectedProducts.length === 0) {
        console.error('No products selected for payment!');
        addAlertBox('Không có sản phẩm nào được chọn để thanh toán!', '#ff6b6b', '#fff', 3000);
        return;
    }
    var modal = document.getElementById('paymentModal');
    if (!modal) {
        console.error('Payment modal not found in HTML! Please check if <div id="paymentModal"> exists in giohang.html');
        alert('Lỗi: Modal thanh toán không tồn tại. Vui lòng kiểm tra HTML.');
        return;
    }
    var totalAmount = 0;
    
    // Tính tổng tiền các sản phẩm đã chọn
    for (var sp of selectedProducts) {
        const p=sp.product;
        var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
        totalAmount += price * sp.soLuong;
    }
    
    // Cập nhật thông tin tổng tiền (kiểm tra nếu element tồn tại)
    var totalElem = document.getElementById('totalAmount');
    if (totalElem) totalElem.textContent = numToString(totalAmount) + ' ₫';
    var finalElem = document.getElementById('finalTotal');
    if (finalElem) finalElem.textContent = numToString(totalAmount + 30000) + ' ₫';
    
    // Reset lựa chọn phương thức thanh toán
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Lưu danh sách sản phẩm đã chọn để sử dụng sau
    window.selectedProductsForPayment = selectedProducts;
    
    modal.style.display = 'block';
}

// Hiển thị modal chọn địa chỉ
function showAddressSelectionModal(selectedProducts, addresses) {
    console.log('Opening address modal with addresses:', addresses);
    var modal = document.getElementById('addressModal');
    if (!modal) {
        console.error('Address modal not found in HTML! Please check if <div id="addressModal"> exists in giohang.html');
        alert('Lỗi: Modal chọn địa chỉ không tồn tại. Vui lòng kiểm tra HTML.');
        return;
    }
    var addressList = document.getElementById('addressList');
    if (!addressList) {
        console.error('addressList element not found in modal!');
        alert('Lỗi: Element addressList không tồn tại trong modal.');
        return;
    }
    
    // Tạo danh sách địa chỉ với checkbox
    var html = '';
    addresses.forEach(function(address, index) {
        // Gộp địa chỉ thành 1 chuỗi hiển thị
    const displayAddress = `${address.diaChiChiTiet}, ${address.phuongXa}, ${address.quanHuyen}, ${address.tinhThanh}`;
        var checked = (index === 0) ? 'checked' : ''; // Chọn mặc định địa chỉ đầu tiên
        html += `
            <div class="address-item" onclick="event.stopPropagation();">
                <input type="checkbox" id="addr_${index}" onclick="selectAddress(${index}, '${displayAddress.replace(/'/g, "\\'")}', this); event.stopPropagation();" ${checked}>
                <label for="addr_${index}" onclick="event.stopPropagation();">
                    <i class="fa fa-map-marker" style="color: #2196F3; margin-right: 10px;"></i>
                    ${displayAddress}
                </label>
            </div>
        `;
    });
    
    // Thêm nút dưới list
    html += `
        <div style="margin-top: 20px; text-align: right;" onclick="event.stopPropagation();">
            <button onclick="closeAddressModal()" style="background: #9E9E9E; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Hủy</button>
            <button onclick="goToAddAddress()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">+ Thêm địa chỉ mới</button>
            <button onclick="confirmAddressSelection()" style="background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Xác nhận</button>
        </div>
    `;
    
    addressList.innerHTML = html;
    
    // Set địa chỉ mặc định nếu có
    if (addresses.length > 0) {
        window.selectedAddress = addresses[0];
        document.querySelector('.address-item').classList.add('selected');
    }
    
    // Lưu danh sách sản phẩm để sử dụng sau
    window.selectedProductsForPayment = selectedProducts;
    window.availableAddresses = addresses;
    modal.style.display = 'block';
}

// Chọn địa chỉ (không tự đóng modal)
function selectAddress(index, address, checkbox) {
    // Bỏ chọn tất cả checkbox khác
    document.querySelectorAll('.address-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.parentElement.classList.remove('selected');
    });
    
    // Chọn checkbox hiện tại
    checkbox.checked = true;
    checkbox.parentElement.classList.add('selected');
    
    // Lưu địa chỉ đã chọn
    window.selectedAddress = window.availableAddresses[index];
}

// Xác nhận chọn địa chỉ và chuyển sang thanh toán
function confirmAddressSelection() {
    console.log('Confirming address:', window.selectedAddress);
    console.log('Products for payment:', window.selectedProductsForPayment);
    if (!window.selectedAddress) {
        addAlertBox('Vui lòng chọn một địa chỉ!', '#ffb400', '#fff', 2000);
        return;
    }
    
    let products = window.selectedProductsForPayment; // Lưu trước khi close
    closeAddressModal();
    showPaymentModal(products);
}

// Đóng modal chọn địa chỉ
function closeAddressModal() {
    var modal = document.getElementById('addressModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.selectedProductsForPayment = null;
    window.availableAddresses = null;
}

// Chuyển đến trang thêm địa chỉ
function goToAddAddress() {
    closeAddressModal();
    window.location.href = 'nguoidung.html';
}

// Đóng modal thanh toán
function closePaymentModal() {
    var modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.selectedProductsForPayment = null;
}

// Chọn phương thức thanh toán
function selectPaymentMethod(method,event) {
    // Bỏ chọn tất cả
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Chọn phương thức được click
    var selectedOption = event.currentTarget;
    selectedOption.classList.add('selected');
    
    // Check radio button
    var radio = selectedOption.querySelector('input[type="radio"]');
    radio.checked = true;
    
    // Cập nhật trạng thái nút xác nhận
    updateConfirmButton();
}

// Cập nhật trạng thái nút xác nhận
function updateConfirmButton() {
    var selectedMethod = document.querySelector('input[name="payment"]:checked');
    var confirmBtn = document.querySelector('.btn-confirm');
    
    if (selectedMethod) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Xác nhận thanh toán';
    } else {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Vui lòng chọn phương thức thanh toán';
    }
}

// Xác nhận thanh toán
function confirmPayment() {
    var selectedMethod = document.querySelector('input[name="payment"]:checked');
    if (!selectedMethod) {
        addAlertBox('Vui lòng chọn phương thức thanh toán!', '#ffb400', '#fff', 2000);
        return;
    }
    
    var method = selectedMethod.value;
    var selectedProducts = window.selectedProductsForPayment;
    
    if (method === 'cod') {
        processCOD(selectedProducts);
    } else if (method === 'vietqr') {
        processVietQR(selectedProducts);
    }
}

// Xử lý thanh toán COD
async function processCOD(selectedProducts) {
    if (window.confirm('Xác nhận thanh toán khi nhận hàng (COD) cho các sản phẩm đã chọn?')) {
        // Tạo đơn hàng với phương thức COD
       const data={
            "products": selectedProducts,
            "ngayDat": new Date(),
            "orderStatus":'Đang xử lý',
            "paymentMethod": 'COD',
            "paymentStatus":'Chưa thanh toán',
            "diaChiNhanHang": window.selectedAddress || 'Chưa xác định'
        };
        
        const res= await fetch(`${API_BASE}/api/orders`,{
             method:'POST',
             headers:{
             "Content-Type":"application/json",
             },
             credentials: 'include', // ✅ gửi cookie session lên server
            body:JSON.stringify(data)
        });
        const result=await res.json();
       if(!res.ok){
        console.error('Tạo đơn hàng thất bại:',result );
        addAlertBox('Tạo đơn hàng thất bại, vui lòng thử lại.', '#e74c3c', '#fff', 4000);
        return;
       }  
        await loadCart();  // tải lại giỏ hàng từ server
        capNhatMoiThu();
        closePaymentModal();
        addAlertBox('Đơn hàng COD đã được tạo thành công! Bạn sẽ thanh toán khi nhận hàng.', '#17c671', '#fff', 5000);
    }
}

// Xử lý thanh toán VietQR
 function processVietQR(selectedProducts) {
    if (window.confirm('Xác nhận thanh toán qua VietQR cho các sản phẩm đã chọn?')) {
        var totalAmount = 0;
        for (var sp of selectedProducts) {
           const p=sp.product;
            var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
            totalAmount += price * sp.soLuong;
        }

        // Sử dụng VietQR API với định dạng .jpg
        var qrUrl = `https://img.vietqr.io/image/mbbank-7922620599999-compact.jpg?amount=${totalAmount}&addInfo=Thanh%20toan%20don%20hang`;

        // Tạo đơn hàng với phương thức VietQR
         const data={
            "products": selectedProducts,
            "ngayDat": new Date(),
            "orderStatus":'Đang chờ thanh toán',
            "paymentMethod": 'VietQr',
            "paymentStatus":'Chưa thanh toán',
            "diaChiNhanHang": window.selectedAddress || 'Chưa xác định'
        };
          
            closePaymentModal();
        
        // Hiển thị modal QR
        var modal = document.createElement('div');
        modal.id = 'qrModal';
        modal.style.position = 'fixed';
        modal.style.zIndex = '1000';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.overflow = 'auto';
        modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

        var modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fefefe';
        modalContent.style.margin = '15% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid #888';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '400px';
        modalContent.style.textAlign = 'center';

        var title = document.createElement('h2');
        title.textContent = 'Thanh toán qua VietQR';
        modalContent.appendChild(title);

        var img = document.createElement('img');
        img.src = qrUrl;
        img.style.width = '100%';
        img.style.maxWidth = '300px';
        modalContent.appendChild(img);

        var info = document.createElement('p');
        info.textContent = `Tổng tiền: ${numToString(totalAmount)} ₫`;
        modalContent.appendChild(info);

        var instruct = document.createElement('p');
        instruct.textContent = 'Vui lòng quét mã QR bằng ứng dụng ngân hàng để thanh toán.';
        modalContent.appendChild(instruct);

        var confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Xác nhận đã thanh toán';
        confirmBtn.style.background = '#4CAF50';
        confirmBtn.style.color = 'white';
        confirmBtn.style.padding = '10px 20px';
        confirmBtn.style.margin = '10px';
        confirmBtn.style.border = 'none';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.onclick = async function() {
            data.paymentStatus = 'Chờ xác nhận chuyển khoản';
            data.orderStatus = 'Đang chờ thanh toán';
             // Tạo đơn hàng với phương thức COD
            const res= await fetch(`${API_BASE}/api/orders`,{
             method:'POST',
             headers:{
             "Content-Type":"application/json",
             },
             credentials: 'include', // ✅ gửi cookie session lên server
            body:JSON.stringify(data)
        });
        const result=await res.json();
       if(!res.ok){
        console.error('Tạo đơn hàng thất bại:',result );
        addAlertBox('Tạo đơn hàng thất bại, vui lòng thử lại.', '#e74c3c', '#fff', 4000);
        return;
       }
            
            await loadCart();  // tải lại giỏ hàng từ server
            capNhatMoiThu();
            addAlertBox('Shop sẽ kiểm tra giao dịch chuyển khoản của bạn và xác nhận đơn hàng sau!', '#17c671', '#fff', 5000);
            document.body.removeChild(modal);
        };
        modalContent.appendChild(confirmBtn);

        var closeBtn = document.createElement('button');
        closeBtn.textContent = 'Đóng';
        closeBtn.style.background = '#f44336';
        closeBtn.style.color = 'white';
        closeBtn.style.padding = '10px 20px';
        closeBtn.style.margin = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function() {
            document.body.removeChild(modal);
        };
        modalContent.appendChild(closeBtn);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
}


function capNhatMoiThu() { // Mọi thứ
    animateCartNumber();
    setCurrentUser(currentUser);
    capNhat_ThongTin_CurrentUser();
    addProductToTable(currentUser);
}