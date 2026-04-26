const { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword, 
  getProfile,
  payment,
  signupotp,
  verifyPayment
} = require("../controller/login.controller");

const {
  creatingRestaurent,
  fetchingRestaurent,
  updateRestaurent,
  deleteRestaurent,
} = require("../controller/Restaurent.controller");

const {
  addToCart,
  getCart,
  removeFromCart
} = require("../controller/Cart.controller");

const authMiddleware = require("../auth/Middlwareauth.js");

function restaurentRoute(app) {

  // AUTH
  app.post("/user/signup", signup);
  app.post("/user/signup-otp", signupotp);
  app.post("/user/login", login);
  app.post("/user/forgot-password", forgotPassword);
  app.post("/user/reset-password", resetPassword);

  // PROFILE
  app.get("/user/profile", authMiddleware, getProfile);

  // PAYMENT
  app.post("/user/checkout", authMiddleware, payment);
  app.post("/user/verify-payment", verifyPayment);

  // RESTAURANT
  app.get("/api/restaurent", fetchingRestaurent);
  app.post("/api/restaurent", authMiddleware, creatingRestaurent);
  app.patch("/api/restaurent/:id", authMiddleware, updateRestaurent);
  app.delete("/api/restaurent/:id", authMiddleware, deleteRestaurent);

  // CART
  app.post("/api/cart/add", authMiddleware, addToCart);
  app.get("/api/cart", authMiddleware, getCart);
  app.delete("/api/cart/:itemId", authMiddleware, removeFromCart);
}

module.exports = restaurentRoute;