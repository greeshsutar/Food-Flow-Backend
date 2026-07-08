const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library"); // npm install google-auth-library

const loginModel = require("../model/User.model");
const transporter = require("../utilis/mail");
const client = require("../utilis/sms");
const razorpay = require("../utilis/razorpay");

// Google OAuth client — uses the SAME client ID your frontend uses
// Add GOOGLE_CLIENT_ID to your backend's .env (Render dashboard too)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// OTP generator
function generateotp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//
//  SIGNUP
//
async function signup(req, res) {
  try {
    const { firstname, lastname, gmail, mobileno, password } = req.body;

    console.log("BODY:", req.body); // 🔍 DEBUG

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

    const existingUser = await loginModel.findOne({
      $or: [{ gmail }, { mobileno }],
    });

    // HANDLE EXISTING USER
    if (existingUser) {
      if (!existingUser.isVerified) {
        const otp = generateotp();

        existingUser.otp = await bcrypt.hash(otp, 10);
        existingUser.otpExpires = Date.now() + 5 * 60 * 1000;

        await existingUser.save();

        //  SEND OTP BASED ON DATA (NOT METHOD)
        if (existingUser.gmail && existingUser.gmail.trim() !== "") {
          await transporter.sendMail({
            to: existingUser.gmail,
            subject: "OTP Verification",
            text: `Your OTP is ${otp}`,
          });
        } else if (existingUser.mobileno && existingUser.mobileno.trim() !== "") {
          await client.messages.create({
            body: `Your OTP is ${otp}`,
            from: process.env.TWILIO_PHONE,
            to: "+91" + existingUser.mobileno,
          });
        }

        return res.send({
          message: "User exists but not verified. OTP resent.",
          requireOtp: true,
        });
      }

      return res.status(400).send({ message: "User already exists" });
    }

    //  NEW USER
    const otp = generateotp();

    await loginModel.create({
      firstname,
      lastname,
      gmail: gmail || undefined,        // ✅ FIX
      mobileno: mobileno || undefined,  // ✅ FIX
      password: await bcrypt.hash(password, 10),
      otp: await bcrypt.hash(otp, 10),
      otpExpires: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    // ✅ SEND OTP (STRICT CHECK)
    if (gmail && gmail.trim() !== "") {
      await transporter.sendMail({
        to: gmail,
        subject: "OTP Verification",
        text: `Your OTP is ${otp}`,
      });
    } else if (mobileno && mobileno.trim() !== "") {
      await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: "+91" + mobileno,
      });
    } else {
      return res.status(400).send({ message: "No valid contact provided" });
    }

    return res.send({
      message: `OTP sent to ${gmail ? "email" : "mobile"}`, // ✅ FIXED MESSAGE
      requireOtp: true,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Signup error" });
  }
}

//
// 🔥 OTP VERIFY
//
async function signupotp(req, res) {
  try {
    const { gmail, mobileno, otp } = req.body;

    if (!otp) {
      return res.status(400).send({ message: "OTP REQUIRED" });
    }

    const user = gmail
      ? await loginModel.findOne({ gmail })
      : await loginModel.findOne({ mobileno });

    if (!user) return res.status(400).send({ message: "User not found" });

    if (!user.otp) return res.status(400).send({ message: "No OTP found" });

    if (user.otpExpires < Date.now()) {
      return res.status(400).send({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) {
      return res.status(400).send({ message: "Wrong OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.send({ message: "OTP Verified Successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Server Error" });
  }
}


//
//  LOGIN (FIXED FLOW)
//
async function login(req, res) {
  try {
    const { gmail, mobileno, password } = req.body;

    if ((!gmail && !mobileno) || !password) {
      return res.status(400).send({ message: "Missing credentials" });
    }

    const user = await loginModel.findOne({
      $or: [{ gmail }, { mobileno }],
    });

    if (!user) return res.status(400).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send({ message: "Invalid password" });

    // 🔥 NOT VERIFIED → SEND OTP
    if (!user.isVerified) {
      const otp = generateotp();

      user.otp = await bcrypt.hash(otp, 10);
      user.otpExpires = Date.now() + 5 * 60 * 1000;

      await user.save();

      if (user.gmail && user.gmail.trim() !== "") {
        await transporter.sendMail({
          to: user.gmail,
          subject: "OTP Verification",
          text: `Your OTP is ${otp}`,
        });
      } else if (user.mobileno && user.mobileno.trim() !== "") {
        await client.messages.create({
          body: `Your OTP is ${otp}`,
          from: process.env.TWILIO_PHONE,
          to: "+91" + user.mobileno,
        });
      }

      return res.status(403).send({
        message: "Account not verified. OTP sent.",
        requireOtp: true,
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.firstname },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.send({ message: "Login successful", token });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Login error" });
  }
}

//
// 🔥 GOOGLE LOGIN
//
async function googleLogin(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send({ message: "Google token required" });
    }
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    // Verify the token with Google — throws if invalid/expired/wrong audience
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).send({ message: "Google account has no email" });
    }

    // Find existing user by email, or create a new one
    let user = await loginModel.findOne({ gmail: email });

    if (!user) {
      user = await loginModel.create({
        firstname: given_name || "Google",
        lastname: family_name || "User",
        gmail: email,
        googleId,
        isVerified: true, // Google already verified this email
      });
    } else if (!user.isVerified) {
      // Existing account signed up via email/OTP but never verified —
      // Google sign-in confirms ownership of the email, so mark verified
      user.isVerified = true;
      if (!user.googleId) user.googleId = googleId;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, name: user.firstname },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.send({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        gmail: user.gmail,
      },
    });

  }catch(err){
  console.log("Google Login Error:", err);

  return res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
}

//
//  FORGOT PASSWORD
//
async function forgotPassword(req, res) {
  try {
    const { gmail, mobileno } = req.body;

    const user = gmail
      ? await loginModel.findOne({ gmail })
      : await loginModel.findOne({ mobileno });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const otp = generateotp();
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpires = Date.now() + 5 * 60 * 1000;

    await user.save();

    if (gmail) {
      await transporter.sendMail({
        to: gmail,
        subject: "Reset OTP",
        text: `Your OTP is ${otp}`,
      });
    } else {
      await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: "+91" + mobileno,
      });
    }

    return res.send({ message: "OTP sent" });

  } catch {
    return res.status(500).send({ message: "Error" });
  }
}

//
// 🔥 RESET PASSWORD
//
async function resetPassword(req, res) {
  try {
    const { gmail, mobileno, otp, newPassword } = req.body;

    const user = gmail
      ? await loginModel.findOne({ gmail })
      : await loginModel.findOne({ mobileno });

    if (!user) return res.status(404).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(otp, user.otp);

    if (!isMatch) return res.status(400).send({ message: "Invalid OTP" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.send({ message: "Password reset successful" });

  } catch {
    return res.status(500).send({ message: "Error" });
  }
}

//
// 🔥 PAYMENT
//
async function payment(req, res) {
  try {
    const { totalamount, paymentMethod } = req.body;

    if (paymentMethod === "cod") {
      return res.send({ message: "Order placed (COD)" });
    }

    const order = await razorpay.orders.create({
      amount: totalamount * 100,
      currency: "INR",
    });

    return res.send({ order });

  } catch {
    return res.status(500).send({ message: "Payment error" });
  }
}

//
//  PROFILE
//
async function getProfile(req, res) {
  try {
    const user = await loginModel
      .findById(req.user.id)
      .select("-password -otp");

    return res.send(user);

  } catch {
    return res.status(500).send({ message: "Profile error" });
  }
}
async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.send({ success: true, message: "Payment verified" });
    } else {
      return res.status(400).send({ success: false, message: "Invalid signature" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Verification error" });
  }
}
//
// EXPORT
//
module.exports = {
  signup,
  signupotp,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  payment,
  verifyPayment
};