const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3012;


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET: Render Weather form
app.get("/weather", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "weather.html"));
});

// POST: Fetch Weather Data
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


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/weather`));
