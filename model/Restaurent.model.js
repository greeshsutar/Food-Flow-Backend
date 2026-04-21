const mongoose = require("mongoose");

const { Schema } = mongoose;

const RestaurentSchema = new Schema({
  name: String,
  imageurl: String,
  avgRating: Number,
  deliveryTime: String,
  cuisines: String,
});

RestaurentSchema.index({ name: 1 });
RestaurentSchema.index({ cuisines: "text" });

const Restaurentdetail = mongoose.model(
  "Restaurentdetail",
  RestaurentSchema
);

module.exports = {Restaurentdetail};
