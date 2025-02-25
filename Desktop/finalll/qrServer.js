const express = require("express");
const qr = require("qrcode");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3012;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET: Render QR code generator form
app.get("/qr-code", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "qr.html"));
});

// POST: Generate QR code
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


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/qr-code`));
