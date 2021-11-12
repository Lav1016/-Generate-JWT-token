var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
let moment = require("moment");
const { times } = require("lodash");

var customerProjectSchema = new Schema({
    customer_id: {
        type: String,
        required: true,
    },
    created_date: {
        type: Date,
        default: moment(),
    },
    created_time: {
        type: String,
        default: moment().format("HH:mm")
    },
    about_us: {
        type: String
    },

    project_name: {
        type: String,
        required: true,
    },

    work_type: {
        type: String,
    },
    home_commodity: {
        type: String,
        required: true,

    },
    company_name: {
        type: String,

    },
    interest_area: {
        type: String
    },
    notes: {
        type: String
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


const CustomerProject = mongoose.model("customerProject", customerProjectSchema);
module.exports = CustomerProject;
