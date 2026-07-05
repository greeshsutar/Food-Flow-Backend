const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Who placed the order
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // What was ordered
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        imageId: { type: String },
        avgRating: { type: Number, default: 0 }
      }
    ],

    // Bill
    totalAmount: {
      type: Number,
      required: true
    },

    // COD or ONLINE
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true
    },

    // pending = not paid yet, paid = payment done
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    // Only for online payment — Razorpay order ID
    razorpayOrderId: {
      type: String,
      default: null
    }
  },
  
  // ✅ This automatically adds createdAt and updatedAt
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);