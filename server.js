// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');


require('./config/passport')(passport); // pass passport for configuration


app.configure(function () {

    // set up our express application
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser()); // read cookies (needed for auth)
    app.use(express.bodyParser()); // get information from html forms

    app.set('view engine', 'ejs'); // set up ejs for templating

    // required for passport
    app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session

    //header path
    var path    = require( 'path' );
    app.use( express.static( path.join( __dirname, 'public' )));

});





// routes ======================================================================
//use mongodb only
require('./app/routes.js')(app, passport);
var configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database
var db = mongoose.connection;



// launch ======================================================================
app.listen(port);
console.log('Listening to: ' + port);
