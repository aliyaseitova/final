const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3012;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET: Render the BMI form
app.get("/bmi", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "bmi.html"));
});

// POST: Calculate BMI
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/bmi`));
