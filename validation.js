const { body, query,validationResult  } = require("express-validator");
/*===================================== User Module=========================*/

module.exports.validate = (method) => {
  console.log("work");
  switch (method) {
    case "createuser": {
      return [
        body("email", "email does not exists/invalid email").exists().isEmail(),
        body("phone", "phoneNumber does not exists").exists(),
      ];
    }

    case "UserDetails": {
      return [
        query("email", "email does not exists/invalid email")
          .exists()
          .isEmail(),
      ];
    }
    case "updatePassword": {
      return [
        body("newPassword", "New Password does not exists").exists(),
        body("confirmPassword", "Confirm Password does not exists").exists(),
      ];
    }
    case "changePassword": {
      return [
        body("oldPassword", "Old Password does not exists").exists(),
        body("newPassword", "New Password does not exists").exists(),
        body("confirmPassword", "Confirm Password does not exists").exists(),
      ];
    }


  }
};
