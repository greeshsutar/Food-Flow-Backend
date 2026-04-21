const mongoose = require("mongoose");

async function mongoDbConnect() {
  try {
    await mongoose.connect(
      "mongodb+srv://girishsutar32_db_user:girish123@cluster0.nuf8iiw.mongodb.net/Swiggy"
    );
    console.log("DB connected Success");
  } catch (err) {
    console.log("DB Error:", err);
  }
}

module.exports = mongoDbConnect;