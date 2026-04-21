const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginModel = require("../model/User.model");
const transporter = require("../utilis/mail");
const client = require("../utilis/sms");
const razorpay = require("../utilis/razopay")
// 🔢 OTP generator fnc
function generateotp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//signup
 async function signup(req, res) {
  try {
    let { firstname, lastname, gmail, mobileno, password } = req.body;

    if (!firstname || !lastname || !password) {
      return res.status(400).send({ message: "Required fields missing" });
    }

    if (!gmail && !mobileno) {
      return res.status(400).send({ message: "Email or Mobile required" });
    }

    if (gmail && mobileno) {
      return res.status(400).send({ message: "Only one allowed" });
    }

    if (password.length < 6) {
      return res.status(400).send({ message: "Weak password" });
    }

    let query = [];
    if (gmail) query.push({ gmail });
    if (mobileno) query.push({ mobileno });

    let existingUser = await loginModel.findOne({ $or: query });

    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    let userData = {
      firstname,
      lastname,
      password: hashedPassword
    };

    if (gmail) userData.gmail = gmail;
    if (mobileno) userData.mobileno = mobileno;

    await loginModel.create(userData);

    res.status(201).send({ message: "Signup successful" }); //  no user return

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Signup error" });
  }
}
//login
async function login(req, res) {
  try {
    let { gmail, mobileno, password } = req.body;

    if ((!gmail && !mobileno) || !password) {
      return res.status(400).send({ message: "Missing credentials" });
    }

    let query = [];
    if (gmail) query.push({ gmail });
    if (mobileno) query.push({ mobileno });

    let user = await loginModel.findOne({ $or: query });

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    let isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({ message: "Invalid password" });
    }

    let token = jwt.sign(
      { id: user._id , name: user.firstname}, // only id
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.send({ message: "Login successful", token });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Login error" });
  }
}
//forgot password
async function forgotPassword(req, res) {
  try {
    let { gmail, mobileno } = req.body;

    if (!gmail && !mobileno) {
      return res.status(400).send({ message: "Email or Mobile required" });
    }

    let query = [];
    if (gmail) query.push({ gmail });
    if (mobileno) query.push({ mobileno });

    let user = await loginModel.findOne({ $or: query });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Prevent OTP spam
    if (user.otpExpires && user.otpExpires > Date.now()) {
      return res.status(429).send({ message: "OTP already sent. Try later." });
    }

    let otp = generateotp();
    let hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;

    await user.save();

    if (gmail) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: gmail,
        subject: "OTP",
        text: `Your OTP is ${otp}`
      });
    }

    if (mobileno) {
      await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to:  "+91" + mobileno 
      });
    }

    res.send({ message: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "OTP error" });
  }
}
// verify otp 
async function resetPassword(req, res) {
  try {
    let { gmail, mobileno, otp, newPassword } = req.body;

    if ((!gmail && !mobileno) || !otp || !newPassword) {
      return res.status(400).send({ message: "Incomplete data" });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({ message: "Weak password" });
    }

    let query = [];
    if (gmail) query.push({ gmail });
    if (mobileno) query.push({ mobileno });

    let user = await loginModel.findOne({ $or: query });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (!user.otp) {
      return res.status(400).send({ message: "No OTP requested" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).send({ message: "OTP expired" });
    }

    let isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    let hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.send({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Reset error" });
  }
}
async function getProfile(req, res) {
  try {
    const user = await loginModel.findById(req.user.id).select("-password -otp");

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user);

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Profile error" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await loginModel.findById(req.user.id).select("-password -otp");

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user);

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Profile error" });
  }
}

//Payment Razorpay 

async function payment(req, res) {
  try {
    const { total, items, paymentMethod } = req.body;

    // validation
    if (!total || !items) {
      return res.status(400).send({ message: "Enter the details" });
    }

    if (!paymentMethod) {
      return res.status(400).send({ message: "Select payment method" });
    }

    // COD
    if (paymentMethod === "cod") {
      return res.status(200).send({
        message: "Cash on Delivery order placed"
      });
    }

    // ONLINE (Razorpay)
    if (paymentMethod === "online") {
      const options = {
        amount: total*100, // paise
        currency: "INR",
      };

      const order = await razorpay.orders.create(options);

      return res.json({
        message: "Order created",
        order
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Payment error" });
  }
}


/// User Contact Information 
async function contact(req, res) {
  let { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send({ message: "All fields are required" });
  }

  try {
    await contactModel.create({ name, email, message }); //  use correct model
    res.status(200).send({ message: "Successfully Submitted" });
  } catch (err) {
    res.status(500).send({ message: "Server error. Try again." });
  }
}
module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  payment
};

