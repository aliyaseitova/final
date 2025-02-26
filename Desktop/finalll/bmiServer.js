const express = require("express");
const path = require("path");

const router = express.Router();

// GET: Render the BMI form
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "bmi.html"));
});

// POST: Calculate BMI
router.post("/calculate-bmi", (req, res) => {
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);

    if (!weight || !height || weight <= 0 || height <= 0) {
        return res.send("<h3>Please enter valid positive numbers for weight and height.</h3><a href='/bmi'>Go Back</a>");
    }

    const bmi = (weight / (height * height)).toFixed(2);
    let category;
    let bgColor;


    if (bmi < 18.5) {
        category = "Underweight";
        bgColor = "#f0ad4e"; // Orange
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = "Normal weight";
        bgColor = "#5cb85c"; // Green
    } else if (bmi >= 25 && bmi < 29.9) {
        category = "Overweight";
        bgColor = "#f0ad4e"; // Orange
    } else {
        category = "Obese";
        bgColor = "#d9534f"; // Red
    }

    res.send(`
        <html>
        <head>
            <title>BMI Result</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #6e8efb, #a777e3);
                    margin: 0;
                    color: white;
                    text-align: center;
                }
                .container {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 25px;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
                    transition: transform 0.3s ease-in-out;
                }
                .container:hover {
                    transform: translateY(-5px);
                }
                h2, h3 {
                    margin: 10px 0;
                }
                h2 {
                    font-size: 26px;
                    font-weight: bold;
                }
                h3 {
                    font-size: 20px;
                    font-weight: bold;
                }
                .button {
                    background: #ff7eb3;
                    color: white;
                    padding: 12px 18px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin: 10px 5px;
                    transition: all 0.3s ease;
                    box-shadow: 0px 4px 8px rgba(255, 126, 179, 0.4);
                }
                .button:hover {
                    background: #ff5a95;
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Your BMI is <strong>${bmi}</strong></h2>
                <h3>You are in the <strong>${category}</strong> category.</h3>
                <a href='/bmi' class="button">Check Again</a>
                <a href='/mywebsite' class="button">Go to Dashboard</a>
            </div>
        </body>
        </html>
    `);
    
});

module.exports = router;
