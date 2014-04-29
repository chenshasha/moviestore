/**
 * Created by shashachen on 4/28/14.
 */
// app/routes.js

var User = require('../app/models/user');
var Movie = require('../app/models/movie');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'moviestore'
});


GLOBAL.count=0;

module.exports = function (app, passport) {
    connection.connect();




};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


