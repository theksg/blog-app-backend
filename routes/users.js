const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const axios = require('axios').default;
const common_functions = require('../common_functions');

//UPDATE
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id) {
    
    try {
      const { userID, ...newBody }=req.body;
      req.body=newBody;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }
  
      if(req.body.facebook!="" && !common_functions.validURL(req.body.facebook)){
        const err={
          "index": 0,
          "code": 11000,
          "keyPattern": {
            "facebook": 1
          }
        }
        throw err;
      }

      if(req.body.linkedin!="" && !common_functions.validURL(req.body.linkedin)){
        const err={
          "index": 0,
          "code": 11000,
          "keyPattern": {
            "linkedin": 1
          }
        }
        throw err;
      }
  
      if(common_functions.validateEmail(req.body.email)==null){
        const err={
          "index": 0,
          "code": 11000,
          "keyPattern": {
            "emailPattern": 1
          }
        }
        throw err;
      }
      const user = await User.findById(req.params.id);
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      if(updatedUser._doc.profilePic != user.profilePic && user.profilePic!=""){
        try{
          await axios.delete(`http://localhost:${process.env.PORT}/api/file-delete`, {
            data: { link: user.profilePic },
          });
          console.log("Old Photo Delelted Successfully")
        }
        catch(error){
          console.log(error);
        }
      }
      const { password, ...others }=updatedUser._doc;
      res.status(200).json(others);
    } 
    catch (err) {
      console.log(err)
      res.status(500).json(err);
    }
  } 
  else {
    res.status(401).json("You can update only your account!");
  }
});

//DELETE
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      try {
        if(user.profilePic!=""){
          try{
            await axios.delete(`http://localhost:${process.env.PORT}/api/file-delete`, {
              data: { link: user.profilePic },
            });
            console.log("Old Photo Delelted Successfully")
          }
          catch(error){
            console.log(error);
          }
        }
        const username=user.username;
        const posts= await Post.find({ username });
        
        posts.forEach(async post => {
          post=post._doc
          if(post.photo!=""){
            try{
              await axios.delete(`http://localhost:${process.env.PORT}/api/file-delete`, {
                data: { link: post.photo },
              });
              console.log("Old Photo Delelted Successfully")
            }
            catch(error){
              console.log(error);
            }
          }
        });
        await Post.deleteMany({ username: user.username });
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User has been deleted...");
      } 
      catch (err) {
        console.log(err)
        res.status(500).json(err);
      }
    } 
    catch (err) {
      console.log(err)
      res.status(404).json("User not found!");
    }
  } 
  else {
    res.status(401).json("You can delete only your account!");
  }
});

//GET USER
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } 
  catch (err) {
    res.status(500).json(err);
  }
});

router.get("/",async (req,res) =>{
  try{
    const username = req.query.username;
    const user = await User.find({ username });
    const { password, ...others } = user[0]._doc;
    res.status(200).json(others);
  }
  catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;