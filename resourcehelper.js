var msg_update_code = '200';
var msg_update_text = 'Record updated successfully';
var exception_msg_code = '400';
var exception_msg_text = 'Something went wrong';
var msg_save_code = '200';
var msg_save_text = 'Record saved successfully';
var unprocessable_code = '422';
var notfound_code = '404';
var notfound_text = 'Records does not exist';
var msg_delete_text = 'Record deleted successfully';
var msg_approved_text = 'Record approved successfully';
var msg_reject_text = 'Record reject successfully.';
var authentication_code = '401';
var password_not_exist = 'Password does not match';
var password_verify = 'Password verify sucessfully';
var duplicate_code = '409';
var duplicate_email = 'Duplicate e-mail address';
var server_error = '500';
var email_sender_error = 'Error in e-mail sender id';
var duplicate_email_phone = 'Duplicate e-mail id or phone number';
var session_expire = 'Your session has been expired';
var password_updated = 'Password already updated or wrong e-mail id';
var email_not_exist = "Email does not exist.";
var token_expired = 'Token expired or new password should be diffrent';
var password_changed = 'Password has been changed successfully';
var valid_email_msg = 'Please enter valid e-mail id';
var email_inbox_msg = 'Please check your mail and change you password by click on the link';
var password_compare = 'New Password Should be diffrent from old password';
var user_record = 'User record does not exist';
var error_master = 'Please enter search value';


module.exports = {
    msg_update_code: msg_update_code,
    msg_update_text: msg_update_text,
    exception_msg_code: exception_msg_code,
    exception_msg_text: exception_msg_text,
    msg_save_code: msg_save_code,
    msg_save_text: msg_save_text,
    unprocessable_code: unprocessable_code,
    notfound_code: notfound_code,
    notfound_text: notfound_text,
    msg_delete_text: msg_delete_text,
    msg_approved_text: msg_approved_text,
    msg_reject_text: msg_reject_text,
    authentication_code: authentication_code,
    password_not_exist: password_not_exist,
    password_verify: password_verify,
    duplicate_code: duplicate_code,
    duplicate_email: duplicate_email,
    server_error: server_error,
    email_sender_error: email_sender_error,
    duplicate_email_phone: duplicate_email_phone,
    session_expire: session_expire,
    password_updated: password_updated,
    email_not_exist: email_not_exist,
    token_expired: token_expired,
    password_changed: password_changed,
    valid_email_msg: valid_email_msg,
    email_inbox_msg: email_inbox_msg,
    password_compare: password_compare,
    user_record: user_record,
    error_master: error_master
};
