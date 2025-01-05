const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const validator = require("validator");
const rateLimit = require("express-rate-limit");

require('dotenv').config(); 
const AWS = require('aws-sdk');



const app = express();
const PORT = 3000;



const urlStore = {};

const bucketName = process.env.BUCKET_NAME;


app.use(express.static(path.join(__dirname, "public")));

// Serve the main HTML file at the root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again after 15 minutes.",
  });
  
  app.use(limiter);

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS secret key
    region: process.env.AWS_REGION, // Your AWS region
  });

  const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // Limit file size to 500MB
});


  const uploadToS3 = async (file, bucketName) => {
    try {
      const params = {
        Bucket: bucketName,
        Key: `${Date.now()}_${file.originalname}`, // Unique file name with timestamp
        Body: file.buffer, // File content in memory
      };
  
      const result = await s3.upload(params).promise();
      return result.Location; // Return the S3 URL of the uploaded file
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }
  
      // Upload the file to S3
      const s3Url = await uploadToS3(req.file, bucketName);
  
      const shortCode = crypto.randomBytes(3).toString("hex"); // 6-character short code
      urlStore[shortCode] = s3Url;
      // Return the S3 URL to the client
      res.json({ link: `https://tranxferit.onrender.com/s/${shortCode}` });
    
    } catch (error) {
      console.error("Error handling upload:", error);
      res.status(500).json({ error: "Failed to upload file." });
    }
  });

  app.post("/download", (req, res) => {
    const fileLink = req.body.fileLink;
    if (validator.isURL(fileLink)) {
      // Proceed to validate and download the file
      res.status(200).send("Valid link.");
    } else {
      res.status(400).send("Invalid link.");
    }
  });

  app.get("/s/:shortCode", (req, res) => {
    const shortCode = req.params.shortCode;
    const fullUrl = urlStore[shortCode];
  
    if (fullUrl) {
      res.redirect(fullUrl); // Redirect to the original S3 URL
    } else {
      res.status(404).send("Short link not found.");
    }
  });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});





