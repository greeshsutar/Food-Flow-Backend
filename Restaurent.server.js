require('dotenv').config();
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const app = express();

const mongoDbConnect = require("./configure/Restaurent.configure");
const restaurentRoute = require("./route/Restaurent.route");

// Middleware
app.use(compression()); // Gzip compression for perf
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Request logging
app.use(express.json());
app.use(require('cors')());

// Routes
restaurentRoute(app);

// DB connect
mongoDbConnect();

// Test route
app.get("/", (req, res) => {
  res.send("WORKING");
});

// Server start
const PORT = process.env.PORT || 3060;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
