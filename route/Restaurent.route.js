const { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword, 
  getProfile,
  payment,
  signupotp,
  verifyPayment,
  googleLogin
} = require("../controller/login.controller");

const { getRestaurants, getMenu } = require("../controller/Swiggy.controller.js")
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
 app.post("/user/auth-login",googleLogin);
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



  
// getting restaturent detail from backend so that restaturent data will be visible to everyone not  only for cors exteension instaler
// SWIGGY PROXY
app.get("/api/restaurants", getRestaurants);
app.get("/api/menu/:id", getMenu);
}



module.exports = restaurentRoute;