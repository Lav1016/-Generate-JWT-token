var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
let moment = require("moment");

var customerSchema = new Schema({
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

    gender: {
        type: String,
        required: true,
    },

    address: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    phone: {
        type: Number,
        required: true,

    },
    company: {
        type: String,

    },

    isActiveCustomer: {
        type: Boolean,
        default: false,
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
customerSchema.path("email").validate((val) => {
    emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(val);
}, "Invalid e-mail address.");



const Customer = mongoose.model("customers", customerSchema);
module.exports = Customer;
