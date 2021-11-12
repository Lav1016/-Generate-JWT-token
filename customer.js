const passport = require('passport');
const _ = require("lodash");
const Customer = require('./../models/customer_detail');
const CustomerProject = require('./../models/customer_project');
const { sendMail, emailValidation, sendMailCustomer } = require("../util/mail");
const { exceptionlogs, diff } = require("../util/utilCommon");
let moment = require("moment");
let url = require("url");
var mongoose = require("mongoose");
const mail = require('../config/mail');
var resourcehelper = require('../helper/resourcehelper');

//call add customer

module.exports.addCustomer = async (req, res, next) => {
    try {
        let exist_customer = await Customer.findOne({ email: req.body.email }); //check record where it present or not

        if (Boolean(exist_customer)) {
            const project_detail_saved = await addProjectsDetail(req.body, exist_customer._id);   //add project through method

            res.status(resourcehelper.msg_save_code).json({
                responseMsg: resourcehelper.msg_save_text,
                project: project_detail_saved,
                customer: exist_customer
            })

        } else {
            const addCustomer = new Customer(req.body);

            const customer_personal_enfo = await addCustomer.save();   // add new customer
            const mailoption = {
                email: customer_personal_enfo.email,
                firstName: customer_personal_enfo.firstName,
                customerId: customer_personal_enfo._id
            }

            const project_detail_saved = await addProjectsDetail(req.body, customer_personal_enfo._id); //add project through method
            const sendMail = await sendMailCustomer(mailoption);

            res.status(resourcehelper.msg_save_code).json({
                responseMsg: resourcehelper.msg_save_text,
                project: project_detail_saved,
                customer: customer_personal_enfo
            })
        }

    } catch (ex) {
        res.status(resourcehelper.exception_msg_code).json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text,
            err: ex
        });
    }
}

module.exports.updateProject = async (req, res, next) => {
    let ipAddress = req.connection.remoteAdrress;
    try {


    } catch (error) {
        res.status(resourcehelper.exception_msg_code).json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text,
            err: ex
        });
    }
}

module.exports.customerList = async (req, res, next) => {

    try {

        let cusomerlist = await Customer.find();
        if (Boolean(cusomerlist)) {
            res.status(resourcehelper.msg_save_code).json({
                responseCode: resourcehelper.msg_save_code,
                customerList: cusomerlist,
                status: true,
            });
        } else {
            res.status(resourcehelper.notfound_code).json({
                responseCode: resourcehelper.notfound_code,
                customerList: cusomerlist,
                status: false,
            });
        }

    } catch (ex) {
        res.status(resourcehelper.exception_msg_code).json({
            responseCode: resourcehelper.exception_msg_code,
            error: resourcehelper.exception_msg_text,
            err: ex,
            status: false,
        });
    }

}

addProjectsDetail = async (projectData, customer_id) => {
    // let ipAddress=req.connection.remoteAdrress;
    const customer_project_info = new CustomerProject({
        customer_id: customer_id,
        about_us: projectData.about_us,
        project_name: projectData.project_name,
        work_type: projectData.work_type,
        home_commodity: projectData.home_commodity,
        company_name: projectData.company_name,
        interest_area: projectData.interest_area,
        notes: projectData.notes,
        isActiveCustomer: projectData.isActiveCustomer,

    });

    let project_seved = await customer_project_info.save();

    return project_seved;


}