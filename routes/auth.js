const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const common_functions = require('../common_functions');


//REGISTER


router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    if(common_functions.validateEmail(req.body.email) == null){
      const err={
        "index": 0,
        "code": 11000,
        "keyPattern": {
          "emailPattern": 1
        }
      }
      res.status(500).json(err);
    }
    
    const newUser = new User(
      req.body
    );

    const user = await newUser.save();
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } 
  catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    let user;
    if(common_functions.validateEmail(req.body.username) == null){
      user = await User.findOne({ username: req.body.username });
    }
    else{
      user = await User.findOne({ email: req.body.username });
    }
    if(!user)
      res.status(400).json("Wrong credentials!");

    const validated = await bcrypt.compare(req.body.password, user.password);
    if(!validated)
      res.status(400).json("Wrong credentials!");

    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } 
  catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;