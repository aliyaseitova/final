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
                </div>
            </body>
            </html>
        `);
        
    } catch (err) {
        console.error("QR Code Generation Error:", err);
        res.send("<h3>Error generating QR code. Please check your input and try again.</h3><a href='/qr-code'>Try Again</a>");
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/qr-code`));
