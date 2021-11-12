const passport = require("passport");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const User = require("./../models/user");
const UserAuditLog = require("./../models/userauditlog");
const { sendMail, emailValidation } = require("../util/mail");
const { exceptionlogs, diff } = require("../util/utilCommon");
let moment = require("moment");
const jwt = require("jsonwebtoken");
let url = require("url");
const Role = require("./../models/role");
var mongoose = require("mongoose");
const { roleDetailsList } = require("../util/role");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
let uniqueValue = String(Math.floor(100000 + Math.random() * 900000));
const { validationResult } = require("express-validator");
var resourcehelper = require('../helper/resourcehelper');
const db = mongoose.connection;

//call for add new users
module.exports.addUser = async (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(200).json({ responseCode: resourcehelper.unprocessable_code, errors: errors.array() });
      return;
    } else {
      let physicianId = mongoose.Types.ObjectId();
      let user = new User();
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.email = req.body.email;
      user.physicianName = req.body.physicianName;
      user.physicianId = physicianId;
      user.phoneNumber = req.body.phoneNumber;
      user.study = req.body.study;
      user.createdBy = req.data == undefined ? req.body.email : req.data.userId; // req.data.userId;
      user.password = uniqueValue;
      user.ipAddress = ipAddress;
      user.siteId = req.body.siteId;
      user.isApproved = req.body.isApproved;
      user.isRejected = req.body.isRejected;
      
      user.isFirstPasswordChangedTime = moment().add(120, "minutes"); //
      let researchPermission,
        physicianPermission,
        labPermission,
        techPermission,
        adminPermission,
        croAdminPermission,
        studyAdminPermission,
        dataManagerPermission;

      if (req.body.research) {
        user.research = mongoose.Types.ObjectId("5f994542972996702ededdde");
        researchPermission = "research";
      } else {
        user.research = mongoose.Types.ObjectId();
        researchPermission = "Notresearch";
      }

      if (req.body.physician) {
        user.physician = mongoose.Types.ObjectId("5f994677972996702ededddf");
        physicianPermission = "physician";
      } else {
        user.physician = mongoose.Types.ObjectId();
        physicianPermission = "Notphysician";
      }

      if (req.body.lab) {
        user.lab = mongoose.Types.ObjectId("5f994751972996702ededde1");
        labPermission = "lab";
      } else {
        user.lab = mongoose.Types.ObjectId();
        labPermission = "Notlab";
      }

      if (req.body.tech) {
        user.tech = mongoose.Types.ObjectId("5f994785972996702ededde2");
        techPermission = "tech";
      } else {
        user.tech = mongoose.Types.ObjectId();
        techPermission = "Nottech";
      }

      if (req.body.admin) {
        user.admin = mongoose.Types.ObjectId("5f9947a4972996702ededde3");
        adminPermission = "admin";
      } else {
        user.admin = mongoose.Types.ObjectId();
        adminPermission = "Notadmin";
      }

      if (req.body.croAdmin) {
        user.croAdmin = mongoose.Types.ObjectId("60d54315aac14447b79499a4");
        croAdminPermission = "croAdmin";
      } else {
        user.croAdmin = mongoose.Types.ObjectId();
        croAdminPermission = "Notcroadmin";
      }

      if (req.body.studyAdmin) {
        user.studyAdmin = mongoose.Types.ObjectId("60d5436eaac14447b79499a5");
        studyAdminPermission = "studyAdmin";
      } else {
        user.studyAdmin = mongoose.Types.ObjectId();
        studyAdminPermission = "NotstudyAdmin";
      }

      if (req.body.dataManager) {
        user.dataManager = mongoose.Types.ObjectId("60d543a2aac14447b79499a6");
        dataManagerPermission = "dataManager";
      } else {
        user.dataManager = mongoose.Types.ObjectId();
        dataManagerPermission = "NotdataManager";
      }

      user.permission.push(
        researchPermission,
        physicianPermission,
        labPermission,
        techPermission,
        adminPermission,
        croAdminPermission,
        studyAdminPermission,
        dataManagerPermission
      ),
        User.findOne({ email: req.body.email }, async (err, user1) => {
          if (err) {
            exceptionlogs({
              fileName: "user.js",
              functionName: "addUser",
              description: err.stack,
              errorMassage: err.message,
              errorType: "critical",
            });
            res
              .status(200).json({
                responseCode: resourcehelper.exception_msg_code,
                error: resourcehelper.exception_msg_text
              });
          } else {
            if (user1 != null) {
              res
                .status(200).json({
                  responseCode: resourcehelper.duplicate_code,
                  message: resourcehelper.duplicate_email,
                });
            } else {
              user.save((err, doc) => {
                if (!err) {
                  let objdetails = {
                    mailId: user.email,
                    uniqueValue: uniqueValue,
                    userId: doc._id,
                    permission: doc.permission,
                  };
                 
                  let tokenValue = user.generateJwt(objdetails);

                  let obj = {
                    mailId: user.email,
                    uniqueValue: uniqueValue,
                    userName: user.firstName + " " + user.lastName,
                    token: tokenValue,
                  };

                  let checkMail = sendMail(obj);
                  if (checkMail == true) {
                    if (!err) {
                      res
                        .status(200)
                        .json({
                          responseCode: resourcehelper.server_error,
                          message: resourcehelper.email_sender_error,
                        });
                    }
                  }
                  User.findOne(
                    { email: req.body.email },
                    async (err1, user2) => {
                      if (!err1) {
                        if (user2) {
                          let userauditlog = new UserAuditLog();
                          userauditlog.New_Data.permission = user2.permission;
                          userauditlog.New_Data.userId = user2._id;
                          userauditlog.New_Data.firstName = req.body.firstName;
                          userauditlog.New_Data.lastName = req.body.lastName;
                          userauditlog.New_Data.email = req.body.email;
                          userauditlog.New_Data.physicianName =
                            req.body.physicianName;
                          userauditlog.New_Data.physicianId = physicianId;
                          userauditlog.New_Data.phoneNumber =
                            req.body.phoneNumber;
                          userauditlog.New_Data.study =
                            req.body.study;
                          userauditlog.New_Data.createdBy =
                            req.data == undefined
                              ? req.body.email
                              : req.data.userId; //req.body.firstName + " " + req.body.lastName;
                          userauditlog.New_Data.password = user2.password;
                          userauditlog.New_Data.research = user.research;
                          userauditlog.New_Data.physician = user.physician;
                          userauditlog.New_Data.lab = user.lab;
                          userauditlog.New_Data.tech = user.tech;
                          userauditlog.New_Data.admin = user.admin;
                          userauditlog.New_Data.croAdmin = user.croAdmin;
                          userauditlog.New_Data.studyAdmin = user.studyAdmin;
                          userauditlog.New_Data.dataManager = user.dataManager;
                          userauditlog.New_Data.actiontype = "Add";
                          userauditlog.New_Data.tokenValue = tokenValue;
                          userauditlog.New_Data.ipAddress = ipAddress;
                          userauditlog.New_Data.siteId = req.body.siteId;
                          userauditlog.New_Data.isApproved = req.body.isApproved;
                          userauditlog.New_Data.siteId = req.body.siteId;
                          userauditlog.New_Data.isRejected = user2.isRejected;
                          userauditlog.save((err2, doc) => {
                            if (err2) {
                              exceptionlogs({
                                fileName: "User.js",
                                functionName: "addUser =>user audit log issue",
                                description: err2.stack,
                                errorMassage: err2.message,
                                errorType: "critical",
                              });
                              res
                                .status(200)
                                .json({
                                  responseCode: resourcehelper.exception_msg_code,
                                  error: resourcehelper.exception_msg_text,
                                });
                            }
                          });
                        }
                      }
                    }
                  );
                  res
                    .status(200)
                    .json({
                      responseCode: resourcehelper.msg_save_code,
                      message: resourcehelper.msg_save_text,
                      data: req.body,
                      token: tokenValue,
                    });
                } else {
                  if (err.code == 11000)
                    res
                      .status(200)
                      .json({
                        responseCode: resourcehelper.duplicate_code,
                        message: resourcehelper.duplicate_email_phone,
                      });
                  else return next(err);
                }
              });
            }
          }
        });
    }
  } catch (ex) {
    exceptionlogs({
      fileName: "Patient.js",
      functionName: "addPatient",
      description: ex.stack,
      errorMassage: ex.message,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text,
    });
  }
};

//call for get particular user details
module.exports.UserDetails = async (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(200).json({ responseCode: resourcehelper.unprocessable_code, errors: errors.array() });
      return;
    } else {
      let email = req.query.email;
     // User.findOne({ email: email }, (err, user) => {
        db.collection("users")
        .aggregate([
          { $match: { email : email } },
          {
            $lookup: {
              from: "sitemasterdatas",
              localField: "siteId",
              foreignField: "siteId",
              as: "SiteDetails",
            },
          },
        ])
        .toArray(async function (err, user) {
        if (err) {
          exceptionlogs({
            fileName: "user.js",
            functionName: "userdetails",
            description: err.stack,
            errorMassage: err.message,
            ipAddress: ipAddress,
            errorType: "critical",
          });
          res
            .status(200)
            .json({
              responseCode: resourcehelper.exception_msg_code,
              error: resourcehelper.exception_msg_text,
            });
        } else if (user === null) {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.notfound_code,
              message: resourcehelper.notfound_text
            });
        } else {
          res.status(200).json({ responseCode: resourcehelper.msg_save_code, data: user });
        }
      });
    }
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "userdetails",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text,
    });
  }
};

//call for get all user details
module.exports.UserDetailsList = async (req, res, next) => {
  var pageNo = parseInt(req.body.pageNo);
  const pagesize = req.body.pagesize;
  const skip = (pageNo - 1) * pagesize;
  let ipAddress = req.connection.remoteAddress;

  let userTotalCount = 0;
  await User.find({}, (err, user1) => {
    userTotalCount = user1?.length;
    
  });

  try {
    //User.find({}, (err, user) => {
      db.collection("users")
        .aggregate([
         
          {
            $lookup: {
              from: "sitemasterdatas",
              localField: "siteId",
              foreignField: "siteId",
              as: "SiteDetails",
            },
          },
        ])
        .toArray(async function (err, user) {
      if (err) {
        exceptionlogs({
          fileName: "user.js",
          functionName: "UserDetailsList",
          description: ex.stack,
          errorMassage: err.message,
          ipAddress: ipAddress,
          errorType: "critical",
        });
        res
          .sendStatus(200)
          .json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text,
          });
      } else {
        if (user == null) {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.notfound_code,
              message: resourcehelper.notfound_text
            });
        } else {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.msg_save_code,
              data: user,
              recordsTotal: user?.length,
              recordsFiltered: user?.length,
              userTotalCount: userTotalCount,
              draw: 0,
            });
        }
      }
    })
    // .limit(pagesize).skip(skip);
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "UserDetailsList",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res
      .sendStatus(200)
      .json({
        responseCode: resourcehelper.exception_msg_code,
        error: resourcehelper.exception_msg_text,
      });
  }
};

//Modify user details
module.exports.updateUser = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  
  try {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(200).json({ responseCode: resourcehelper.unprocessable_code, errors: errors.array() });
      return;
    }
    let token;
    if ("authorization" in req.headers)
      token = req.headers["authorization"].split(" ")[1];
    
    let researchPermission,
      physicianPermission,
      labPermission,
      techPermission,
      adminPermission,
      croAdminPermission,
      studyAdminPermission,
      dataManagerPermission;
      
    let ipAddress = req.connection.remoteAddress;
    let _user = new User();
    //_user.firstName = req.body.firstName;
    //_user.lastName = req.body.lastName;
    //_user.physicianName = req.body.physicianName;
    //_user.phoneNumber = req.body.phoneNumber;
    //_user.research = req.body.research;
    //_user.physician = req.body.physician;
    //_user.lab = req.body.lab;
    // _user.tech = req.body.tech;
    // _user.admin = req.body.admin;
   
    if (req.body.research == true || req.body.research == '5f994542972996702ededdde') {
      _user.research = mongoose.Types.ObjectId("5f994542972996702ededdde");
      researchPermission = "research";
      req.body.research = mongoose.Types.ObjectId("5f994542972996702ededdde");
    } else {
      _user.research = mongoose.Types.ObjectId();
      req.body.research = mongoose.Types.ObjectId();
      researchPermission = "Notresearch";
    }

    if (req.body.physician == true || req.body.physician == '5f994677972996702ededddf') {
      _user.physician = mongoose.Types.ObjectId("5f994677972996702ededddf");
      req.body.physician = mongoose.Types.ObjectId("5f994677972996702ededddf");
      physicianPermission = "physician";
    } else {
      _user.physician = mongoose.Types.ObjectId();
      req.body.physician = mongoose.Types.ObjectId();
      physicianPermission = "Notphysician";
    }

    if (req.body.lab == true|| req.body.lab == '5f994751972996702ededde1') {
      _user.lab = mongoose.Types.ObjectId("5f994751972996702ededde1");
      req.body.lab = mongoose.Types.ObjectId("5f994751972996702ededde1");
      labPermission = "lab";
    } else {
      req.body.lab = mongoose.Types.ObjectId();
      _user.lab = mongoose.Types.ObjectId();
      labPermission = "Notlab";
    }

    if (req.body.tech == true|| req.body.tech == '5f994785972996702ededde2') {
      _user.tech = mongoose.Types.ObjectId("5f994785972996702ededde2");
      req.body.tech = mongoose.Types.ObjectId("5f994785972996702ededde2");
      techPermission = "tech";
    } else {
      _user.tech = mongoose.Types.ObjectId();
      req.body.tech = mongoose.Types.ObjectId();
      techPermission = "Nottech";
    }

    if (req.body.admin == true || req.body.admin == '5f9947a4972996702ededde3') {
      _user.admin = mongoose.Types.ObjectId("5f9947a4972996702ededde3");
      req.body.admin = mongoose.Types.ObjectId("5f9947a4972996702ededde3");
      adminPermission = "admin";
    } else {
      _user.admin = mongoose.Types.ObjectId();
      req.body.admin = mongoose.Types.ObjectId();
      adminPermission = "Notadmin";
    }

    if (req.body.croAdmin == true || req.body.croAdmin == '60d54315aac14447b79499a4') {
      _user.croAdmin = mongoose.Types.ObjectId("60d54315aac14447b79499a4");
      req.body.croAdmin = mongoose.Types.ObjectId("60d54315aac14447b79499a4");
      croAdminPermission = "croAdmin";
    } else {
      _user.croAdmin = mongoose.Types.ObjectId();
      req.body.croAdmin = mongoose.Types.ObjectId();
      croAdminPermission = "NotcroAdmin";
    }

    if (req.body.studyAdmin == true || req.body.studyAdmin == '60d5436eaac14447b79499a5') {
      _user.studyAdmin = mongoose.Types.ObjectId("60d5436eaac14447b79499a5");
      req.body.studyAdmin = mongoose.Types.ObjectId("60d5436eaac14447b79499a5");
      studyAdminPermission = "studyAdmin";
    } else {
      _user.studyAdmin = mongoose.Types.ObjectId();
      req.body.studyAdmin = mongoose.Types.ObjectId();
      studyAdminPermission = "NotstudyAdmin";
    }
   
    if (req.body.dataManager == true || req.body.dataManager == '60d543a2aac14447b79499a6') {
      _user.dataManager = mongoose.Types.ObjectId("60d543a2aac14447b79499a6");
      req.body.dataManager = mongoose.Types.ObjectId("60d543a2aac14447b79499a6");
      dataManagerPermission = "dataManager";
    } else {
      _user.dataManager = mongoose.Types.ObjectId();
      req.body.dataManager = mongoose.Types.ObjectId();
      dataManagerPermission = "NotdataManager";
    }
   
    User.findOne(
      { email: req.body.old_email ? req.body.old_email : req.body.email },
      (err, user) => {
        if (err) {
          exceptionlogs({
            fileName: "user.js",
            functionName: "updateUser =>user audit log issue",
            description: err.stack,
            errorMassage: err.message,
            ipAddress: ipAddress,
            errorType: "critical",
          });
          res
            .status(200)
            .json({
              responseCode: resourcehelper.exception_msg_code,
              error: resourcehelper.exception_msg_text,
            });
        } else {
          
          if (user != null) {
            
            for (var i = 0; i < user.permission.length; i++) {
              user.permission.pop(user.permission[i]);
            }
           
            _user.permission.push(
              researchPermission,
              physicianPermission,
              labPermission,
              techPermission,
              adminPermission,
              croAdminPermission,
              studyAdminPermission,
              dataManagerPermission,
            );
            let userauditlog = new UserAuditLog();
            let userOldData = new User();
            userauditlog.Old_Data = userOldData;
            req.body.updatedBy = req.data == undefined ? "NA" : req.data.userId;
            req.body.dateUpdated = moment();
            req.body.ipAddress = ipAddress;
            req.body.permission = _user.permission;
            
            User.findOneAndUpdate(
              {
                email: req.body.old_email ? req.body.old_email : req.body.email,
              },
              req.body,
              { new: true },
              (err, userNewData) => {
                if (!err) {
                  userauditlog.New_Data = userNewData;
                  var OldModifyData = diff(
                    userauditlog.New_Data,
                    userauditlog.Old_Data
                  );
                  var newModifyData = diff(
                    userauditlog.Old_Data,
                    userauditlog.New_Data
                  );
                  //====================User New Data============
                  userauditlog.New_Data = newModifyData;
                  userauditlog.New_Data.userId = userNewData._id;
                  userauditlog.New_Data.dateCreated = userNewData.dateCreated;
                  userauditlog.New_Data.dateUpdated = req.body.dateUpdated;
                  userauditlog.New_Data.updatedBy =
                    req.data == undefined ? "NA" : req.data.userId;
                  userauditlog.New_Data.actiontype = "Update User";
                  userauditlog.New_Data.ipAddress =
                    userNewData.ipAddress == undefined
                      ? ipAddress
                      : userNewData.ipAddress;
                  userauditlog.New_Data.permission = userNewData.permission;
                  
                  //====================User Old Data============
                  userauditlog.Old_Data = OldModifyData;
                  userauditlog.Old_Data.userId = userNewData._id;
                  userauditlog.Old_Data.dateCreated = user.dateCreated;
                  userauditlog.Old_Data.updatedBy = user.updatedBy;
                  userauditlog.Old_Data.dateUpdated = user.dateUpdated;
                  userauditlog.Old_Data.permission = user.permission;
                  userauditlog.Old_Data.actiontype = user.dateUpdated == null ? "Add Patient" : "Update Patient";
                  userauditlog.Old_Data.ipAddress = user.ipAddress == undefined ? ipAddress : user.ipAddress;
                  userauditlog.save((logerr, auditlogdata) => {
                    if (logerr) {
                     
                      exceptionlogs({
                        fileName: "user.js",
                        functionName: "Update user =>user auditlog issue",
                        description: err.stack,
                        errorMassage: logerr.message,
                        ipAddress: ipAddress,
                        errorType: "critical",
                      });
                      res.status(200).json({
                        responseCode: resourcehelper.exception_msg_code,
                        error: resourcehelper.exception_msg_text,
                      });
                    } else {
                      
                      res.status(200).json({
                        responseCode: resourcehelper.msg_update_code,
                        message: resourcehelper.msg_update_text,
                        data: req.body
                      });
                    }
                  });
                }
                else {
                  res
                    .status(200)
                    .json({
                      responseCode: resourcehelper.exception_msg_code,
                      error: resourcehelper.exception_msg_text,
                    });
                }
              }
            );
          } else {
            res
              .status(200)
              .json({
                responseCode: resourcehelper.exception_msg_code,
                error: resourcehelper.exception_msg_text,
              });
          }
        }
      }
    );
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "updateUser",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text,
    });
  }
};

//delete Users
module.exports.deleteUser = async(req, res, next) => {

    let ipAddress = req.connection.remoteAddress;
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
      if (!errors.isEmpty()) {
        res.status(200).json({ responseCode: resourcehelper.unprocessable_code, errors: errors.array() });
        return;
      } else {
        let email = req.body.email;
        
        User.findOneAndDelete({ email: email }, (err, user) => {

          if (err) {
            exceptionlogs({
              fileName: "user.js",
              functionName: "deleteUser",
              description: err.stack,
              errorMassage: err.message,
              ipAddress: ipAddress,
              errorType: "critical",
            });
            res
              .status(200)
              .json({
                responseCode: resourcehelper.exception_msg_code,
                error: resourcehelper.exception_msg_text,
              });
          } else if (user === null) {
            res
              .status(200)
              .json({
                responseCode: resourcehelper.notfound_code,
                message: resourcehelper.notfound_text
              });
          } else {
            res.status(200).json({ responseCode: resourcehelper.msg_delete_text });
          }
        });
      }
    } catch (ex) {
      exceptionlogs({
        fileName: "user.js",
        functionName: "deleteUser",
        description: ex.stack,
        errorMassage: ex.message,
        ipAddress: ipAddress,
        errorType: "critical",
      });
      res.status(200).json({
        responseCode: resourcehelper.exception_msg_code,
        error: resourcehelper.exception_msg_text,
      });
    }
  };


//Verify password link for first time and forgot time.
module.exports.verifyPasswordLink = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    let confirm_Email = req.data.mailId;
    let old_Password = String(req.data.uniqueValue);
    User.findOne({ email: confirm_Email }, (err, user) => {
      if (err) {
        exceptionlogs({
          fileName: "user.js",
          functionName: "verifyPasswordLink",
          description: err.stack,
          errorMassage: err.message,
          ipAddress: ipAddress,
          errorType: "critical",
        });
        res
          .status(200)
          .json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text,
          });
      }
      if (user == null) {
        res
          .status(200)
          .json({
            responseCode: resourcehelper.notfound_code,
            message: resourcehelper.notfound_text
          });
      }
      if (user != null) {
        if (user.isFirstPasswordChanged === false) {
          let linkexpiretime = user.isFirstPasswordChangedTime;
          // var linkExpiredTime = linkexpiretime.setHours(linkexpiretime.getHours() + 2);
          // let date1 = linkExpiredTime;
          // var date2 = new Date();
          // let diffhours = (date1 - date2) / 36e5;
          //if (diffhours >= 0) {
          let date1 = moment(linkexpiretime);
          let date2 = moment();
          let difftime = date1.diff(date2, "minutes");
          if (0 <= difftime && difftime <= 120) {
            if (user != null) {
              let hash = user.password;
              let checkPassword = bcrypt.compareSync(old_Password, hash);
              if (checkPassword) {
                res.status(200).json({ responseCode: resourcehelper.msg_save_code, message: "true" });
              } else {
                res.status(200).json({ responseCode: resourcehelper.authentication_code, message: "false" });
              }
            }
          } else {
            res.status(200).json({ responseCode: resourcehelper.authentication_code, message: "false" });
          }
        } else if (
          user.isFirstPasswordChanged === true &&
          user.isFirstPasswordExpire === true &&
          user.isForgotPasswordChanged === false &&
          user.isForgotPasswordExpire === false
        ) {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.authentication_code,
              message: resourcehelper.session_expire,
            });
        } else if (
          user.isFirstPasswordChanged === true &&
          user.isFirstPasswordExpire === true &&
          user.isForgotPasswordChanged === true &&
          user.isForgotPasswordExpire === true
        ) {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.authentication_code,
              message: resourcehelper.session_expire,
            });
        } else if (
          (user.isForgotPasswordChanged === false ||
            user.isForgotPasswordChanged === true) &&
          user.isFirstPasswordChanged === true &&
          user.isFirstPasswordExpire === true
        ) {
          let linkexpiretime = user.isForgotPasswordChangedTime;
          let date1 = moment(linkexpiretime);
          let date2 = moment();
          let difftime = date1.diff(date2, "minutes");
          if (0 <= difftime && difftime <= 120) {
            if (user != null) {
              let hash = user.password;
              let checkPassword = bcrypt.compareSync(old_Password, hash);
              if (checkPassword) {
                res.status(200).json({ responseCode: resourcehelper.msg_save_code, message: "true" });
              } else {
                res.status(200).json({ responseCode: resourcehelper.authentication_code, message: "false" });
              }
            }
            //res.status(200).json({ responseCode: 200, message: 'true' });
          } else {
            res
              .status(200)
              .json({
                responseCode: resourcehelper.authentication_code,
                message: resourcehelper.session_expire,
              });
          }
        } else {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.notfound_code,
              message: resourcehelper.password_updated,
            });
        }
      }
    });
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "verifyPasswordLink",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text,
    });
  }
};

//call for update password
module.exports.updatePassword = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    let old_Password = String(req.data.uniqueValue);
    let confirm_Email = req.data.mailId;
    let new_Password = req.body.newPassword;
    let confirm_Password = req.body.confirmPassword;
    User.findOne({ email: confirm_Email }, (err, user) => {
      if (err) {
        exceptionlogs({
          fileName: "user.js",
          functionName: "updatePassword",
          description: err.stack,
          errorMassage: err.message,
          ipAddress: ipAddress,
          errorType: "critical",
        });
        res.status(200).json({
          responseCode: resourcehelper.exception_msg_code,
          error: resourcehelper.exception_msg_text,
        });
      }
      if (user == null) {
        res.status(200).json({
          responseCode: resourcehelper.notfound_code,
          message: resourcehelper.email_not_exist,
        });
      }
      if (user != null) {
        let hash = user.password;
        let saltkey = user.saltSecret;
        let checkPassword = bcrypt.compareSync(old_Password, hash);
        let checkNewPassword = bcrypt.compareSync(new_Password, hash);
        if (checkNewPassword) {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.authentication_code,
              message: resourcehelper.token_expired,
            });
        } else {
          if (checkPassword) {
            if (new_Password === confirm_Password) {
              const hash = bcrypt.hashSync(new_Password, salt);
              user.password = hash;
              user.saltSecret = salt;
              if (user.isFirstPasswordChanged == false) {
                let linkexpiretime = user.isFirstPasswordChangedTime;
                // var linkExpiredTime = linkexpiretime.setHours(linkexpiretime.getHours() + 2);
                // let date1 = linkExpiredTime;
                // var date2 = new Date();
                // let diffhours = (date1 - date2) / 36e5;
                // if (diffhours >= 0) {
                let date1 = moment(linkexpiretime);
                let date2 = moment();
                let difftime = date1.diff(date2, "minutes");
                if (0 <= difftime && difftime <= 120) {
                  User.updateOne(
                    { email: user.email },
                    {
                      $set: {
                        password: hash,
                        isFirstPasswordChanged: true,
                        isFirstPasswordExpire: true,
                        isActiveUser: true,
                      },
                    },
                    { new: true },
                    (err, doc) => {
                      if (err) {
                        console.log("Something wrong when updating data!");
                      }
                      User.findOne(
                        { email: confirm_Email },
                        async (err1, user2) => {
                          if (!err1) {
                            if (user2) {
                              let userauditlog = new UserAuditLog();
                              userauditlog.Old_Data = user;
                              userauditlog.New_Data = user2;
                              var OldModifyData = diff(
                                userauditlog.New_Data,
                                userauditlog.Old_Data
                              );
                              var newModifyData = diff(
                                userauditlog.Old_Data,
                                userauditlog.New_Data
                              );

                              //==================New DATA==================
                              userauditlog.New_Data = newModifyData;
                              userauditlog.New_Data.actiontype = "Update";
                              userauditlog.New_Data.tokenValue =
                                user2.tokenValue;
                              userauditlog.New_Data.ipAddress = user2.ipAddress;
                              userauditlog.New_Data.permission = user.permission;
                              //==================OLD DATA==================

                              userauditlog.Old_Data = OldModifyData;
                              userauditlog.Old_Data.actiontype = user.actiontype;
                              userauditlog.Old_Data.tokenValue = user.tokenValue;
                              userauditlog.Old_Data.ipAddress = user.ipAddress;
                              userauditlog.Old_Data.permission = user.permission;
                              userauditlog.save((err2, doc) => {
                                if (err2) {
                                  exceptionlogs({
                                    fileName: "User.js",
                                    functionName: "updatePassword",
                                    description: err2.stack,
                                    errorMassage: err2.message,
                                    ipAddress: ipAddress,
                                    errorType: "critical",
                                  });
                                  res
                                    .status(200)
                                    .json({
                                      responseCode: resourcehelper.exception_msg_code,
                                      error: resourcehelper.exception_msg_text,
                                    });
                                }
                              });
                            }
                          }
                        }
                      );
                      res
                        .status(200)
                        .json({
                          responseCode: resourcehelper.msg_save_code,
                          data: req.body,
                          message: resourcehelper.password_changed,
                        });
                    }
                  );
                }
                else {
                  res
                    .status(200)
                    .json({
                      responseCode: resourcehelper.authentication_code,
                      message: resourcehelper.session_expire,
                    });
                }
              } else {
                if (
                  user.isFirstPasswordChanged === true &&
                  user.isFirstPasswordExpire === true &&
                  (user.isForgotPasswordChanged == false ||
                    user.isForgotPasswordChanged == true) &&
                  user.isForgotPasswordExpire == false
                ) {
                  let linkexpiretime = user.isForgotPasswordChangedTime;
                  let date1 = moment(linkexpiretime);
                  let date2 = moment();
                  let difftime = date1.diff(date2, "minutes");
                  if (0 <= difftime && difftime <= 120) {
                    User.updateOne(
                      { email: user.email },
                      {
                        $set: {
                          password: hash,
                          isForgotPasswordChanged: true,
                          isForgotPasswordExpire: true,
                          isActiveUser: true,
                        },
                      },
                      { new: true },
                      (err, doc) => {
                        if (err) {
                          console.log("Something wrong when updating data!");
                        }
                        User.findOne(
                          { email: user.email },
                          async (err1, user2) => {
                            if (!err1) {
                              if (user2) {
                                let userauditlog = new UserAuditLog();
                                let obj = new User(user)
                                let obj2 = new User(user2)

                                userauditlog.Old_Data = obj;
                                userauditlog.New_Data = obj2;
                                var OldModifyData = diff(
                                  userauditlog.New_Data,
                                  userauditlog.Old_Data
                                );
                                var newModifyData = diff(
                                  userauditlog.Old_Data,
                                  userauditlog.New_Data
                                );

                                //==================New DATA==================
                                userauditlog.New_Data = newModifyData;
                                userauditlog.New_Data.actiontype = "Update";
                                userauditlog.New_Data.tokenValue = user2.tokenValue;
                                userauditlog.New_Data.ipAddress = user2.ipAddress;
                                userauditlog.New_Data.permission = user.permission;
                                //==================OLD DATA==================

                                userauditlog.Old_Data = OldModifyData;
                                userauditlog.Old_Data.actiontype = user.actiontype;
                                userauditlog.Old_Data.tokenValue = user.tokenValue;
                                userauditlog.Old_Data.ipAddress = user.ipAddress;
                                userauditlog.Old_Data.permission = user.permission;
                                userauditlog.save((err2, doc) => {
                                  if (err2) {
                                    exceptionlogs({
                                      fileName: "User.js",
                                      functionName: "updatePassword",
                                      description: err2.stack,
                                      errorMassage: err2.message,
                                      ipAddress: ipAddress,
                                      errorType: "critical",
                                    });
                                    res
                                      .status(200)
                                      .json({
                                        responseCode: resourcehelper.exception_msg_code,
                                        error: resourcehelper.exception_msg_text,
                                      });
                                  }
                                  else {
                                    res
                                      .status(200)
                                      .json({
                                        responseCode: resourcehelper.msg_save_code,
                                        data: req.body,
                                        message: resourcehelper.password_changed,
                                      });
                                  }
                                });
                              }
                            }
                          }
                        );
                        res
                          .status(200)
                          .json({
                            responseCode: resourcehelper.msg_save_code,
                            data: req.body,
                            message: resourcehelper.password_changed,
                          });
                      }
                    );
                  } else {
                    res
                      .status(200)
                      .json({
                        responseCode: resourcehelper.authentication_code,
                        message: resourcehelper.session_expire,
                      });
                  }
                } else {
                  res
                    .status(200)
                    .json({
                      responseCode: resourcehelper.authentication_code,
                      message: resourcehelper.session_expire,
                    });
                }
              }
            } else {
              res
                .status(200)
                .json({
                  responseCode: resourcehelper.authentication_code,
                  message: resourcehelper.password_not_exist,
                });
            }
          } else {
            res
              .status(200)
              .json({
                esponseCode: resourcehelper.authentication_code,
                message: resourcehelper.password_not_exist,
              });
          }
        }
      }
    });
    //res.status(400).json({ message: 'Email does not exist in database.' });
  } catch (err) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "updatePassword",
      description: err.stack,
      errorMassage: err.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text
    });
  }
};
// forgot password for user
module.exports.forgotPassword = async (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    let uniquePasswordValue = uniqueValue;
    //console.log(uniquePasswordValue)
    let confirm_Email = req.body.email;
    if (!emailValidation(confirm_Email)) {
      res
        .status(404)
        .json({
          responseCode: resourcehelper.notfound_code,
          message: resourcehelper.valid_email_msg
        });
    }
    else {
      User.findOne({ email: confirm_Email }, (err, user) => {
        let hash = bcrypt.hashSync(uniquePasswordValue, salt);

        if (user) {
          let objdetails = {
            mailId: req.body.email,
            uniqueValue: uniqueValue,
            userId: user._id,
            permission: user.permission,
          };
         
          let tokeValue = user.generateJwt(objdetails);
          User.updateMany(
            { email: confirm_Email },
            {
              $set: {
                password: hash,
                isFirstPasswordChanged: true,
                isFirstPasswordExpire: true,
                isForgotPasswordChanged: true,
                isForgotPasswordExpire: false,
                isForgotPasswordChangedTime: moment().add(120, "minutes"),
              },
            },
            { new: true },
            (err, doc) => {
              if (!err) {
                let obj = {
                  mailId: user.email,
                  uniqueValue: uniqueValue,
                  userName: user.firstName + " " + user.lastName,
                  token: tokeValue,
                };
                let checkMail = sendMail(obj);
                //console.log(checkMail);

                User.findOne({ email: req.body.email }, async (err1, user2) => {
                  if (!err1) {
                    if (user2) {
                      let userauditlog = new UserAuditLog();
                      let usernew = new User(user)
                      let userold = new User(user2)
                      userauditlog.Old_Data = usernew;
                      userauditlog.New_Data = userold;
                      var OldModifyData = diff(
                        userauditlog.New_Data,
                        userauditlog.Old_Data
                      );
                      var newModifyData = diff(
                        userauditlog.Old_Data,
                        userauditlog.New_Data
                      );

                      //==================New DATA==================
                      userauditlog.New_Data = newModifyData;
                      userauditlog.New_Data.actiontype = "Update";
                      // userauditlog.New_Data.tokenValue = user2.tokenValue;
                      userauditlog.New_Data.ipAddress = user2.ipAddress;
                      //==================OLD DATA==================

                      userauditlog.Old_Data = OldModifyData;
                      userauditlog.Old_Data.actiontype = user.actiontype;
                      //  userauditlog.Old_Data.tokenValue = user.tokenValue;
                      userauditlog.Old_Data.ipAddress = user.ipAddress;
                      userauditlog.Old_Data.permission = user.permission;
                      userauditlog.New_Data.permission = user.permission;
                      userauditlog.save((err2, doc) => {
                        if (err2) {
                          exceptionlogs({
                            fileName: "User.js",
                            functionName: "updatePassword",
                            description: err2.stack,
                            errorMassage: err2.message,
                            ipAddress: ipAddress,
                            errorType: "critical",
                          });
                          res
                            .status(200)
                            .json({
                              responseCode: resourcehelper.exception_msg_code,
                              error: resourcehelper.exception_msg_text,
                            });
                        }
                        else {
                          res
                            .status(200)
                            .json({
                              responseCode: resourcehelper.msg_save_code,
                              message: resourcehelper.email_inbox_msg,
                            });
                        }
                      });
                    }
                  }
                });
              } else {
                if (err.code == 11000)
                  res
                    .status(200)
                    .json({
                      responseCode: resourcehelper.authentication_code,
                      message: resourcehelper.duplicate_email_phone,
                    });
                else next(console.log("Something wrong when updating data!"));
              }
            }
          );
        } else {
          res
            .status(200)
            .json({
              responseCode: resourcehelper.notfound_code,
              message: resourcehelper.email_not_exist
            });
        }
      });
    }
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "forgotPassword",
      description: err2.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text
    });
  }
};

//call for Change password
module.exports.ChangePassword = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
    if (!errors.isEmpty()) {
      res.status(200).json({ responseCode: resourcehelper.unprocessable_code, errors: errors.array() });
      return;
    } else {
      let old_Password = req.body.oldPassword;
      let new_Password = req.body.newPassword;
      let confirm_Password = req.body.confirmPassword;
      let confirm_Email = req.data.mailId;
      if (new_Password === old_Password) {
        res.status(200).json({
          responseCode: resourcehelper.authentication_code,
          message: resourcehelper.password_compare
        });
      } else {
        User.findOne({ email: confirm_Email }, (err, user) => {
          if (user != null) {
            let hash = user.password;
            let saltkey = user.saltSecret;
            let checkPassword = bcrypt.compareSync(old_Password, hash);
            //console.log("checkPassword----------------", checkPassword);
            if (checkPassword) {
              if (new_Password === confirm_Password) {
                const hash = bcrypt.hashSync(new_Password, salt);
                user.password = hash;
                user.saltSecret = salt;
                if (user.isFirstPasswordChanged === true) {
                  User.updateOne(
                    { email: confirm_Email },
                    { $set: { password: hash } },
                    { new: true },
                    (err, doc) => {
                      if (err) {
                        exceptionlogs({
                          fileName: "User.js",
                          functionName: "Change Password ",
                          description: err2.stack,
                          errorMassage: err2.message,
                          ipAddress: ipAddress,
                          errorType: "critical",
                        });
                        //console.log("Something wrong when updating data!");
                      }
                      User.findOne({ email: confirm_Email },
                        async (err1, user2) => {
                          if (!err1) {
                            if (user2) {
                              let userauditlog = new UserAuditLog();
                              userauditlog.Old_Data = user;
                              userauditlog.New_Data = user2;
                              var OldModifyData = diff(
                                userauditlog.New_Data,
                                userauditlog.Old_Data
                              );
                              var newModifyData = diff(
                                userauditlog.Old_Data,
                                userauditlog.New_Data
                              );
                              //==================New DATA==================
                              userauditlog.New_Data = newModifyData;
                              userauditlog.New_Data.updatedBy = user2.updatedBy;
                              userauditlog.New_Data.createdBy = user2.createdBy;
                              userauditlog.New_Data.dateCreated = user2.dateCreated;
                              userauditlog.New_Data.dateUpdated = user2.dateUpdated;
                              userauditlog.New_Data.actiontype = "Update user Change Password";
                              userauditlog.New_Data.tokenValue = user2.tokenValue;
                              userauditlog.New_Data.ipAddress = user2.ipAddress;
                              userauditlog.New_Data.permission = user2.permission;
                              //==================OLD DATA==================

                              userauditlog.Old_Data = OldModifyData;
                              userauditlog.Old_Data.createdBy = user.createdBy;
                              userauditlog.Old_Data.updatedBy = user.updatedBy;
                              userauditlog.Old_Data.dateCreated = user.dateCreated;
                              userauditlog.Old_Data.dateUpdated = user.dateUpdated;
                              userauditlog.Old_Data.actiontype = user.actiontype;
                              userauditlog.Old_Data.tokenValue = user.tokenValue;
                              userauditlog.Old_Data.ipAddress = user.ipAddress;
                              userauditlog.Old_Data.permission = user.permission;
                              userauditlog.save((err2, doc) => {
                                if (err2) {
                                  exceptionlogs({
                                    fileName: "User.js",
                                    functionName: "updatePassword",
                                    description: err2.stack,
                                    errorMassage: err2.message,
                                    ipAddress: ipAddress,
                                    errorType: "critical",
                                  });
                                  res.status(200).json({
                                    responseCode: resourcehelper.exception_msg_code,
                                    error: resourcehelper.exception_msg_text
                                  });
                                }
                              });
                            }
                          }
                        }
                      );
                      res.status(200).json({
                        responseCode: resourcehelper.msg_save_code,
                        message: resourcehelper.password_changed
                      });
                    }
                  );
                }
              } else {
                res
                  .status(200)
                  .json({
                    responseCode: resourcehelper.authentication_code,
                    message: resourcehelper.password_not_exist
                  });
              }
            } else {
              res.status(200).json({
                responseCode: resourcehelper.authentication_code,
                message: resourcehelper.password_not_exist
              });
            }
          }
        });
      }
    }
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "ChangePassword",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text
    });
  }
};

// call for authentication the user
module.exports.authenticate = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    passport.authenticate("local", (err, user, info) => {
      // error from passport middleware
      if (err) {
        exceptionlogs({
          fileName: "user.js",
          functionName: "authenticate",
          description: ex.stack,
          errorMassage: err.message,
          ipAddress: ipAddress,
          errorType: "critical",
        });
        res
          .status(200)
          .json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text
          });
      }
      // registered user
      else if (user) {
        let objdetails = {
          mailId: user.email,
          uniqueValue: user.password,
          userId: user._id,
          permission: user.permission,
          siteId: user.siteId,

        };
        //console.log("objdetails",objdetails);
        return res.status(200).json({ token: user.generateJwt(objdetails) });
      }
      // unknown user or wrong password
      else return res.status(200).json(info);
    })(req, res);
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "authenticate",
      description: ex.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text
    });
  }
};

// call for user profile
module.exports.userProfile = (req, res, next) => {
  let ipAddress = req.connection.remoteAddress;
  try {
    User.findOne({ email: req.data.mailId }, (err, user) => {
      if (err) {
        exceptionlogs({
          fileName: "user.js",
          functionName: "userProfile",
          description: err.stack,
          errorMassage: err.message,
          ipAddress: ipAddress,
          errorType: "critical",
        });
        res
          .status(200)
          .json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text
          });
      } else {
        if (!user)
          return res
            .status(200)
            .json({ responseCode: resourcehelper.notfound_code, message: resourcehelper.user_record });
        else
          return res
            .status(200)
            .json({
              responseCode: 200,
              user: _.pick(user, [
                "firstName",
                "email",
                "research",
                "physician",
                "lab",
                "tech",
                "admin",
                "permission",
              ]),
            });
      }
    });
  } catch (ex) {
    exceptionlogs({
      fileName: "user.js",
      functionName: "userProfile",
      description: err.stack,
      errorMassage: ex.message,
      ipAddress: ipAddress,
      errorType: "critical",
    });
    res.status(200).json({
      responseCode: resourcehelper.exception_msg_code,
      error: resourcehelper.exception_msg_text
    });
  }
};
