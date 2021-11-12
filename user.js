var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//const { validationResult } = require("express-validator");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
let moment = require("moment");
// var dt = new Date();
// var linkExpiredTime = dt.setHours(dt.getHours() + 2);

//ObjectId = Schema.ObjectId;
var userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },
  userType: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },

  address: {
    type: String,
  },
  phone: {
    type: Number,
    required:true,
    // index: {
    //   unique: true,
    // }
  },
  password: {
    type: String,
    required: true,
  },
  isForgotPasswordChanged: {
    type: Boolean,
    default: false,
  },
  isForgotPasswordChangedTime: {
    type: Date,
    default: moment(),
  },
  isActiveUser: {
    type: Boolean,
    default: false,
  },
  token:{
type:String,
default:""
  },
  ipAddress: {
    type: String,
  },
  dateCreated: {
    type: Date,
    default: moment(),
  },
  dateUpdated: {
    type: Date,
    default: null,
  },

});



// Custom validation for email
userSchema.path("email").validate((val) => {
  emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(val);
}, "Invalid e-mail address.");

userSchema.pre("save", function (next) {
  const hash = bcrypt.hashSync(this.password, salt);
  this.password = hash;
  this.saltSecret = salt;
  next();
});

// Verify Password
userSchema.methods.verifyPassword = function (password) {
  //console.log(password,this.password);
  return bcrypt.compareSync(password, this.password);
};

// Generate JWT token
userSchema.methods.generateJwt = function (data) {
  let token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP,
  });
  return token;
};

const User = mongoose.model("user", userSchema);
module.exports = User;
