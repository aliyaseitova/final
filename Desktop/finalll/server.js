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
const PORT = 3011;
const bmiRoutes = require("./bmiServer");


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // ✅ Keep this only ONCE
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/bmi", bmiRoutes);


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

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // Email Route
  app.get("/send-email", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "email.html"));
  });  
  app.post("/send-email", async (req, res) => {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: message,
        });
        console.log("✅ Email sent:", info);
        res.json({ success: "✅ Email sent successfully!" });
    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).json({ error: "Failed to send email", details: error.message });
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
        <html>
        <head>
            <title>QR Code Generator</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, #6e8efb, #a777e3);
                    color: #fff;
                    padding: 50px;
                }
                .container {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 25px;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
                    display: inline-block;
                    text-align: center;
                    transition: transform 0.3s ease-in-out;
                }
                .container:hover {
                    transform: translateY(-5px);
                }
                img {
                    display: block;
                    margin: 20px auto;
                    border-radius: 8px;
                    background: white;
                    padding: 10px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 18px;
                    margin-top: 10px;
                    background: #ff7eb3;
                    color: white;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;
                    font-size: 16px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    box-shadow: 0px 4px 8px rgba(255, 126, 179, 0.4);
                }
                .btn:hover {
                    background: #ff5a95;
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Generated QR Code</h2>
                <img src="${qrCode}" alt="QR Code">
                <br>
                <a href='/qr-code' class="btn">Generate Another QR Code</a>
                <a href='/mywebsite' class="btn">Go to Dashboard</a>
            </div>
        </body>
        </html>
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
        <html>
        <head>
            <title>Weather Report</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, #6e8efb, #a777e3);
                    color: #fff;
                    padding: 50px;
                }
                .container {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 25px;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
                    display: inline-block;
                    text-align: center;
                    transition: transform 0.3s ease-in-out;
                }
                .container:hover {
                    transform: translateY(-5px);
                }
                h2 {
                    margin-bottom: 10px;
                }
                p {
                    font-size: 18px;
                    margin: 8px 0;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 18px;
                    margin-top: 10px;
                    background: #ff7eb3;
                    color: white;
                    border: none;
                    cursor: pointer;
                    border-radius: 8px;
                    font-size: 16px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    box-shadow: 0px 4px 8px rgba(255, 126, 179, 0.4);
                }
                .btn:hover {
                    background: #ff5a95;
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Weather in ${weatherData.name}, ${weatherData.sys.country}</h2>
                <p>🌡️ Temperature: <strong>${weatherData.main.temp}°C</strong></p>
                <p>🌤️ Weather: <strong>${weatherData.weather[0].description}</strong></p>
                <p>💧 Humidity: <strong>${weatherData.main.humidity}%</strong></p>
                <p>🌬️ Wind Speed: <strong>${weatherData.wind.speed} m/s</strong></p>
                <br>
                <a href='/weather' class="btn">Check Another City</a>
                <a href='/mywebsite' class = btn>Go back</a>
            </div>
        </body>
        </html>
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