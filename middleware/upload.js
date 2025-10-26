const multer = require('multer');
const path = require('path');

// Nơi lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatars'); // folder lưu avatar
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, req.session.userId + '_' + Date.now() + ext);
    }
});

// Chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ cho phép upload ảnh!'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // max 2MB
module.exports = upload;
