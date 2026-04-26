const axios = require("axios");

async function getRestaurants(req, res) {
  try {
    const response = await axios.get(
      "https://www.swiggy.com/dapi/restaurants/list/v5?lat=15.796320490637022&lng=74.47427418082952&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING",
      { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.swiggy.com/" } }
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}

async function getMenu(req, res) {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://www.swiggy.com/mapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=15.796320490637022&lng=74.47427418082952&restaurantId=${id}&submitAction=ENTER`,
      { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.swiggy.com/" } }
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: "Failed to fetch menu" });
  }
}

module.exports = { getRestaurants, getMenu };