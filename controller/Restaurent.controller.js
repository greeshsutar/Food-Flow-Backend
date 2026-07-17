const { Restaurentdetail } = require("../model/Restaurent.model");

async function fetchingRestaurent(req, res) {
  console.log("GET HIT");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allrestaurent = await Restaurentdetail.find()
      .lean()
      .select('name imageurl avgRating deliveryTime cuisines')
      .skip(skip)
      .limit(limit);

    res.json(allrestaurent);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: "Error fetching restaurants" });
  }
}


async function googleouth(req,res){
let {token} =req.body;

if(!token){
  return res.status(404).json({message:"token does not exist"});
}




}





















async function creatingRestaurent(req, res) {
  console.log("POST HIT", req.body);

  try {
    const { name, imageurl, avgRating, deliveryTime, cuisines } = req.body;

    const createrestaurent = await Restaurentdetail.create({
      name,
      imageurl,
      avgRating,
      deliveryTime,
      cuisines,
    });

    res.status(201).json(createrestaurent);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: "Error creating restaurant" });
  }
}

async function updateRestaurent(req, res) {
  try {
    const {id} = req.params;
    const updated = await Restaurentdetail.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.status(200).json("Restaurant updated successfully");
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: "Error updating restaurant" });
  }
}

async function deleteRestaurent(req, res) {
  try {
    const {id} = req.params;
    const deleted = await Restaurentdetail.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.status(200).json("Restaurant deleted successfully");
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: "Error deleting restaurant" });
  }
}

module.exports = {
  fetchingRestaurent,
  creatingRestaurent,
  updateRestaurent,
  deleteRestaurent
};
