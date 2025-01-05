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


const bucketName = process.env.BUCKET_NAME;

app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, 
    message: "Too many requests from this IP, please try again after 15 minutes.",
  });
  
  app.use(limiter);

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
    region: process.env.AWS_REGION, 
  });

  const storage = multer.memoryStorage(); 
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, 
});


  const uploadToS3 = async (file, bucketName) => {
    try {
      const params = {
        Bucket: bucketName,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer, 
      };
  
      const result = await s3.upload(params).promise();
      return result.Location; 
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
  
      const s3Url = await uploadToS3(req.file, bucketName);
  
      // const shortCode = crypto.randomBytes(3).toString("hex"); 
      // urlStore[shortCode] = s3Url;
     
      res.json({ link: `https://tranxferit.onrender.com/${s3Url}` });
    
    } catch (error) {
      console.error("Error handling upload:", error);
      res.status(500).json({ error: "Failed to upload file." });
    }
  });

  app.post("/download", (req, res) => {
    const fileLink = req.body.fileLink;
    if (validator.isURL(fileLink)) {
    
      res.status(200).send("Valid link.");
    } else {
      res.status(400).send("Invalid link.");
    }
  });

  app.get("/s/:shortCode", (req, res) => {
    const shortCode = req.params.shortCode;
    const fullUrl = urlStore[shortCode];
  
    if (fullUrl) {
      res.redirect(fullUrl); 
    } else {
      res.status(404).send("Short link not found.");
    }
  });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});





