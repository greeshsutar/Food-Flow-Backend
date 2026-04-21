const Cart = require('../model/Cart.model');
const Restaurentdetail = require('../model/Restaurent.model').Restaurentdetail;

// Add item to cart
async function addToCart(req, res) {
  try {
    const { dishId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!dishId) {
      return res.status(400).json({ message: 'Dish ID required' });
    }

    // Optimized fetch restaurant/dish price
    const restaurant = await Restaurentdetail.findById(dishId).lean().select('name'); // Assume price from elsewhere or fixed
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant/Dish not found' });
    }

    const price = 100; // Placeholder: fetch from dish or restaurant.dishes[0].price in full schema

    let cart = await Cart.findOne({ userId }).select('items totalAmount');

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ dishId, quantity, price }],
        totalAmount: quantity * price
      });
    } else {
      const existingItemIndex = cart.items.findIndex(item => item.dishId.toString() === dishId);
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ dishId, quantity, price });
      }
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    await cart.save();
    res.status(201).json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get user's cart
async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId }).select('items totalAmount').lean();
    res.json(cart || { items: [], totalAmount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Remove item from cart
async function removeFromCart(req, res) {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).select('items totalAmount');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    await cart.save();
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  addToCart,
  getCart,
  removeFromCart
};
