const express=require('express');
const app=express();

const cors = require('cors')
app.use(cors())

const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());

const mongoose = require("mongoose");
const PORT=process.env.PORT || 50000;
const authRoute=require("./routes/auth");
const userRoute=require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute=require("./routes/categories");

const multer=require("multer")
const cloudinary = require("cloudinary").v2;
const fs = require('fs-extra')

// Creating uploads folder if not already present
// In "uploads" folder we will temporarily upload
// image before uploading to cloudinary
if (!fs.existsSync("./images")) {
  fs.mkdirSync("./images");
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:  process.env.API_KEY,
  api_secret:  process.env.API_SECRET,
});

async function uploadToCloudinary(locaFilePath ,height) {
  
  // locaFilePath: path of image which was just
  // uploaded to "uploads" folder

  var mainFolderName = "blog";
  // filePathOnCloudinary: path of image we want
  // to set when it is uploaded to cloudinary
  var filePathOnCloudinary = 
      mainFolderName + "/" + locaFilePath;
      filePathOnCloudinary=filePathOnCloudinary.replace("\\", "/")

  console.log(filePathOnCloudinary)

  return cloudinary.uploader
      .upload(locaFilePath, { public_id: filePathOnCloudinary , height:height , crop:"scale" })
      .then((result) => {
          console.log(result)
          // Image has been successfully uploaded on
          // cloudinary So we dont need local image 
          // file anymore
          // Remove file from local uploads folder
          fs.unlinkSync(locaFilePath);

          return {
              status: 200,
              url: result.secure_url,
          };
      })
      .catch((error) => {

          // Remove file from local uploads folder
          console.log(error)
          fs.unlinkSync(locaFilePath);
          return { status: 400 };
      });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });

app.post("/api/upload", upload.single("file"),async (req, res) => {
  try{
    var locaFilePath = req.file.path;
    var height = req.body.height;
    var result = await uploadToCloudinary(locaFilePath , height);
    console.log(result)
    if(result?.status==200){
      res.status(200).json(result)
    }
    else{
      res.status(400).json("File Not Uploaded")
    }
  }
  catch(error){
    res.status(400).json(error)
  }
});

app.delete("/api/file-delete",async(req,res)=>{
  try{
    console.log(req.body)
    const link=req.body.link
    if (link != "") {
      try {
          let pos=link.search("blog");
          let public_id=link.slice(pos,-4);
          console.log(public_id)
          cloudinary.uploader.destroy(public_id)
          .then(result=>{
            res.status(200).json(result);
          })
          .catch(error=>{
            res.status(400).json(error);
          })
      } 
      catch (err) {
        res.status(501).json(err);
      }
    } 
    else {
      res.status(401).json("No link sent");
    }
  }
  catch(err){
    res.status(503).json(err);
  }
})

app.use(express.json())

const url=process.env.MONGODB_URI || 'mongodb://localhost:27017/blog'

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));


app.use("/api/auth",authRoute);
app.use("/api/users",userRoute);
app.use("/api/posts", postRoute);
app.use("/api/categories",categoryRoute);

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})

//adding comment
app.get('/test', (req, res) => {
  res.send('Hello World!')
})
