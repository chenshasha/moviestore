// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User       		= require('../app/models/user');
var mysql = require('../node_modules/mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'moviestore'
});


// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newUser            = new User();

                    //newUser.local.userId   = Math.floor(Math.random() * 1000000000);
                    var idString             = (Math.floor(Math.random()* 900000000) + 100000000).toString();;
                    newUser.local.userId     = idString.substr(0,3) + "-" + idString.substr(3,2) + "-" + idString.substr(5,4);
                    newUser.local.email      = email;
                    newUser.local.password   = newUser.generateHash(password); // use the generateHash function in our user model
                    req.session.email = email;
                    req.session.userId = newUser.local.userId;
                    newUser.save();

                    var userId     = newUser.local.userId;
                    var address    = req.param('address');
                    var city       = req.param('city');
                    var state      = req.param('state');
                    var zipcode    = req.param('zipcode');
                    var firstName  = req.param('firstName');
                    var lastName   = req.param('lastName');
                    var phone      = req.param('phone');
                    var createDate = new Date();
                    var userType   = req.param('userType');
                    var expireDate = new Date();
                    var balance    = 0;
                    var availableCopy = 0;
                    var checkedOutCopy = 0;

                    if(req.param('userType') == "Simple"){
                        expireDate.setDate(expireDate.getDate()+365);
                        availableCopy = 2;
                    }else{
                        expireDate.setDate(expireDate.getDate()+31);
                        availableCopy = 10;
                        balance = 10;
                    }

                    var expireDate_string = expireDate.toISOString();
                    var expireDate_string = expireDate_string.replace("T"," ");
                    var expireDate_string = expireDate_string.substring(0, expireDate_string.length - 5);

                    var createDate_string = createDate.toISOString();
                    var createDate_string = createDate_string.replace("T"," ");
                    var createDate_string = createDate_string.substring(0, createDate_string.length - 5);



                    connection.query('INSERT user ' +
                        '(userId, email, city, state, zipcode, firstName, lastName, phone, createDate, userType, expireDate, balance,' +
                        'checkedOutCopy, availableCopy, address) VALUES ("'+
                        userId+ '","' + email + '","' + city + '","' +state + '","' +zipcode + '","' + firstName + '","' + lastName
                        + '","' + phone + '","' + createDate_string + '","' + userType + '","' + expireDate_string + '",' + balance + ',' +checkedOutCopy + ',' + availableCopy + ',"' + address +'")', function(err, rows, fields) {
                        if(err){

                        }
                    });

                    return done(null, newUser);

                }

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists

            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata


                req.session.email = user.local.email;
                req.session.userId = user.local.userId;

                return done(null, user);
            });

        }));

};