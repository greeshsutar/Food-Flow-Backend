const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const loginModel = require("../model/User.model");
const transporter = require("../utilis/mail");
const client = require("../utilis/sms");
const razorpay = require("../utilis/razorpay");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateotp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function signup(req, res) {
  try {
    const { firstname, lastname, gmail, mobileno, password } = req.body;

    console.log("BODY:", req.body);

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

    const orConditions = [];
    if (gmail) orConditions.push({ gmail });
    if (mobileno) orConditions.push({ mobileno });

    const existingUser = await loginModel.findOne({ $or: orConditions });

    if (existingUser) {
      if (!existingUser.isVerified) {
        const otp = generateotp();

        existingUser.otp = await bcrypt.hash(otp, 10);
        existingUser.otpExpires = Date.now() + 5 * 60 * 1000;

        await existingUser.save();

        console.log(`OTP for ${existingUser.gmail || existingUser.mobileno}: ${otp}`);
        if (existingUser.gmail && existingUser.gmail.trim() !== "") {
          try {
            const info = await transporter.sendMail({
              to: existingUser.gmail,
              subject: "OTP Verification",
              text: `Your OTP is ${otp}`,
            });
            console.log("OTP email sent:", info.messageId);
          } catch (err) {
            console.error("OTP email failed:", err.message);
            return res.status(500).send({ message: "Failed to send OTP email" });
          }
        } else if (existingUser.mobileno && existingUser.mobileno.trim() !== "") {
          client.messages.create({
            body: `Your OTP is ${otp}`,
            from: process.env.TWILIO_PHONE,
            to: "+91" + existingUser.mobileno,
          }).catch((err) => console.error("OTP SMS failed:", err.message));
        }

        return res.send({
          message: "User exists but not verified. OTP resent.",
          requireOtp: true,
        });
      }

      return res.status(400).send({ message: "User already exists" });
    }

    const otp = generateotp();

    await loginModel.create({
      firstname,
      lastname,
      gmail: gmail || undefined,
      mobileno: mobileno || undefined,
      password: await bcrypt.hash(password, 10),
      otp: await bcrypt.hash(otp, 10),
      otpExpires: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    console.log(`OTP for ${gmail || mobileno}: ${otp}`);

    if (gmail && gmail.trim() !== "") {
      try {
        const info = await transporter.sendMail({
          to: gmail,
          subject: "OTP Verification",
          text: `Your OTP is ${otp}`,
        });
        console.log("OTP email sent:", info.messageId);
      } catch (err) {
        console.error("OTP email failed:", err.message);
        return res.status(500).send({ message: "Failed to send OTP email" });
      }
    } else if (mobileno && mobileno.trim() !== "") {
      client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: "+91" + mobileno,
      }).catch((err) => console.error("OTP SMS failed:", err.message));
    } else {
      return res.status(400).send({ message: "No valid contact provided" });
    }

    return res.send({
      message: `OTP sent to ${gmail ? "email" : "mobile"}`,
      requireOtp: true,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Signup error" });
  }
}

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

async function login(req, res) {
  try {
    const { gmail, mobileno, password } = req.body;

    if ((!gmail && !mobileno) || !password) {
      return res.status(400).send({ message: "Missing credentials" });
    }

    const orConditions = [];
    if (gmail) orConditions.push({ gmail });
    if (mobileno) orConditions.push({ mobileno });

    const user = await loginModel.findOne({ $or: orConditions });

    if (!user) return res.status(400).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send({ message: "Invalid password" });

    if (!user.isVerified) {
      const otp = generateotp();

      user.otp = await bcrypt.hash(otp, 10);
      user.otpExpires = Date.now() + 5 * 60 * 1000;

      await user.save();

      console.log(`OTP for ${user.gmail || user.mobileno}: ${otp}`);
      if (user.gmail && user.gmail.trim() !== "") {
        transporter.sendMail({
          to: user.gmail,
          subject: "OTP Verification",
          text: `Your OTP is ${otp}`,
        }).catch((err) => console.error("OTP email failed:", err.message));
      } else if (user.mobileno && user.mobileno.trim() !== "") {
        client.messages.create({
          body: `Your OTP is ${otp}`,
          from: process.env.TWILIO_PHONE,
          to: "+91" + user.mobileno,
        }).catch((err) => console.error("OTP SMS failed:", err.message));
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

async function googleLogin(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send({ message: "Google token required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).send({ message: "Google account has no email" });
    }

    let user = await loginModel.findOne({ gmail: email });

    if (!user) {
      user = await loginModel.create({
        firstname: given_name || "Google",
        lastname: family_name || "User",
        gmail: email,
        googleId,
        isVerified: true,
      });
    } else if (!user.isVerified) {
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

  } catch (err) {
    return res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  }
}

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

    console.log(`Reset OTP for ${gmail || mobileno}: ${otp}`);
    if (gmail) {
      transporter.sendMail({
        to: gmail,
        subject: "Reset OTP",
        text: `Your OTP is ${otp}`,
      }).catch((err) => console.error("Reset OTP email failed:", err.message));
    } else {
      client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: "+91" + mobileno,
      }).catch((err) => console.error("Reset OTP SMS failed:", err.message));
    }

    return res.send({ message: "OTP sent" });

  } catch {
    return res.status(500).send({ message: "Error" });
  }
}

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