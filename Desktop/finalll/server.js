const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");
const qr = require("qrcode");
const axios = require("axios");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser"); // ✅ Keep this only ONCE
require("dotenv").config();

const app = express();
const PORT = 3012;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // ✅ Keep this only ONCE
app.set("view engine", "ejs");
app.use(express.static("public"));

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/final_web")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Import blog routes
const blogRoutes = require("./blogServer");
app.use(blogRoutes);

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// Authentication Middleware
const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.redirect("/login");

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) return res.redirect("/login");
    req.user = decoded;
    next();
  });
};

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email Route
app.post("/send-email", async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
    });
    res.json({ success: "✅ Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Routes
app.get("/", (req, res) => res.redirect("/register"));
app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashedPassword });
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Incorrect password");

  const token = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "1h" });
  res.cookie("jwt", token, { httpOnly: true, maxAge: 3600000 });
  res.redirect("/mywebsite");
});

app.get("/mywebsite", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mywebsite.html"));
});

app.get("/bmi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bmi.html"));
});

app.post("/calculate-bmi", (req, res) => {
  const weight = parseFloat(req.body.weight);
  const height = parseFloat(req.body.height);

  if (!weight || !height || weight <= 0 || height <= 0) {
    return res.send("<h3>Please enter valid positive numbers for weight and height.</h3><a href='/bmi'>Go Back</a>");
  }

  const bmi = (weight / (height * height)).toFixed(2);
  let category;

  if (bmi < 18.5) category = "Underweight";
  else if (bmi >= 18.5 && bmi < 24.9) category = "Normal weight";
  else if (bmi >= 25 && bmi < 29.9) category = "Overweight";
  else category = "Obese";

  res.send(`
      <h2>Your BMI is: ${bmi}</h2>
      <h3>Category: <span style="color:${category === 'Normal weight' ? 'green' : category === 'Overweight' ? 'yellow' : 'red'}">${category}</span></h3>
      <a href='/bmi'>Go Back</a>
  `);
});

app.get("/qr-code", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "qr.html"));
});

app.post("/generate-qr", async (req, res) => {
  try {
    const text = req.body.text;
    if (!text || text.trim() === "") {
      return res.send("<h3>Please enter valid text to generate a QR code.</h3><a href='/qr-code'>Go Back</a>");
    }

    const qrCode = await qr.toDataURL(text);
    res.send(`
        <h2>Generated QR Code</h2>
        <img src="${qrCode}" alt="QR Code">
        <br><a href='/qr-code'>Generate Another QR Code</a>
    `);
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    res.send("<h3>Error generating QR code. Please check your input and try again.</h3><a href='/qr-code'>Try Again</a>");
  }
});

app.get("/weather", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "weather.html"));
});

app.post("/get-weather", async (req, res) => {
  const city = req.body.city;
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    console.log("API Response:", response.data); // Debugging output

    const weatherData = response.data;
    res.send(`
        <h2>Weather in ${weatherData.name}, ${weatherData.sys.country}</h2>
        <p>Temperature: ${weatherData.main.temp}°C</p>
        <p>Weather: ${weatherData.weather[0].description}</p>
        <p>Humidity: ${weatherData.main.humidity}%</p>
        <p>Wind Speed: ${weatherData.wind.speed} m/s</p>
        <a href='/weather'>Check Another City</a>
    `);
  } catch (err) {
    console.error("Error fetching weather:", err.response?.data || err.message);
    res.send("<h3>City not found or API error. Please try again.</h3><a href='/weather'>Go Back</a>");
  }
});

// Blog Page Route
app.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "blog.html"));
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));