const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session"); //dùng để mã hóa cookie session
const MongoStore = require("connect-mongo"); //
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const path = require("path");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public", "client")));

// ⚠️ session middleware
app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // dùng Atlas thay vì localhost
       }),
        cookie: {
            httpOnly: true,
            secure:true, // nếu chạy localhost, để false
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24
            
        },
    })
);
const { authMiddleware, adminMiddleware } = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoute = require("./routes/addressRoutes");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users/address", addressRoute);
app.use("/api/dashboard", dashboardRoutes);

app.use("/admin", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});


app.use('/img', express.static(path.join(__dirname, 'public/img')));
// ảnh upload runtime (avatar, sản phẩm)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/admin/pages/img', express.static(path.join(__dirname, 'public/img')));
// route cho trang chủ
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "client", "index.html"));
});
// Trang admin
app.use(
    "/admin",
    adminMiddleware,
    express.static(path.join(__dirname, "public", "admin"))
);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
