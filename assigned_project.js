var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
let moment = require("moment");


var assignedProjectSchema = new Schema({
    project_name: {
        type: String,
        required: true,
    },
    designer_name: {
        type: String,
        default: true,
    },
    project_current_status: {
        type: String
    },

    project_material: {
        type: Array,
    },

    project_status: {
        type: Boolean,
    },
    project_assigned_by: {
        type: String,
        required: true,

    },
    project_initial_paid: {
        type: String,
    },
    project_due_paid: {
        type: String,
    },
    project_estimate_time: {
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


const AssignedProject = mongoose.model("assignedProject", assignedProjectSchema);
module.exports = AssignedProject;
