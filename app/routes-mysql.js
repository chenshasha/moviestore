// app/routes.js

var User = require('../app/models/user');
var Movie = require('../app/models/movie');

var mysql = require('../node_modules/mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'moviestore'
});

GLOBAL.count=0;

module.exports = function (app, passport) {
    connection.connect();


//****************************************************************
// Member Management
//****************************************************************
    //to do
    //add new member
    app.get('/addMember', isLoggedIn, function (req, res) {
        res.render('addmember.ejs'); // load the index.ejs file
    });

    app.post('/addMember', isLoggedIn, function (req, res) {
        var newUser            = new User();
        // set the user's local credentials
        newUser.local.email      = req.param('email');
        newUser.local.city       = req.param('city');
        newUser.local.state      = req.param('state');
        newUser.local.zipcode   = req.param('zipcode');
        newUser.local.firstName  = req.param('firstName');
        newUser.local.lastName   = req.param('lastName');
        newUser.local.phone      = req.param('phone');
        newUser.local.address    = req.param('address');
        newUser.local.password   = newUser.generateHash(req.param('password'));
        newUser.local.createDate = new Date();
        newUser.local.userType   = req.param('userType');
        newUser.local.expireDate = new Date();
        newUser.local.balance    = 0;
        newUser.local.availableCopy = 2;
        newUser.local.checkedOutCopy = 0;
        if(req.param('userType') == "Simple"){
            newUser.local.expireDate.setDate(newUser.local.expireDate.getDate()+365);
        }else{
            newUser.local.expireDate.setDate(newUser.local.expireDate.getDate()+31);
        }

        newUser.save();
        var pathName = '/profile/'+ req.param('email');
        res.redirect(pathName);

    });


    //search members based on attributes
    app.post('/searchMember', isLoggedIn, function (req, res) {

        var name = 'local.' + req.param('searchparam');
        var value = {'$regex': req.param('str'), $options: 'i'};
        var query = {};
        query[name] = value;

        console.log(query);

        User.find(query, function (err, users) {
            if (err) {
            }
            ;
            res.render('searchMember.ejs', {
                users: users
            });
        });

    });

    //change Membership -- Simple User: 1 year validation, Premium User: 1 month validation
    app.get('/changeMembership/:id/:type', isLoggedIn, function (req, res) {

        var memberDay = new Date();

        User.findOne({"local.email": req.params.id}, function (err, user) {
            //console.log(user.local.checkedOutCopy);
            var checkedOutCopy = user.local.checkedOutCopy;
            var availableCopy = 0;
            if(req.params.type == "Simple"){
                if (checkedOutCopy >= 10 ){
                    availableCopy = 0;
                }else{
                    availableCopy = 10 - checkedOutCopy;
                }
                memberDay.setDate(memberDay.getDate()+31);
                User.update({"local.email": req.params.id},{"local.userType": "Premium","local.availableCopy": availableCopy, "local.createDate":new Date(),
                    "local.expireDate":memberDay}).exec();


            }else{
                if (checkedOutCopy >= 2 ){
                    availableCopy = 0;
                }else{
                    availableCopy = 2 - checkedOutCopy;
                }
                memberDay.setDate(memberDay.getDate()+365);
                User.update({"local.email": req.params.id},{"local.userType": "Simple", "local.availableCopy": availableCopy, "local.createDate":new Date(),
                    "local.expireDate":memberDay}).exec();


            }


        });

        var pathName = pathName = '/profile/'+ req.params.id;
        res.redirect(pathName);
    });


    //user first sign up
    app.get('/register', isLoggedIn, function (req, res) {
        User.findOne({user_id: req.user.id}, function(err, user) {
            res.render('addMember-user.ejs', {
                user : req.user
            });
        });
    });

    app.post('/register', isLoggedIn, function (req, res) {

        // set the user's local credentials
        var userId     = req.session.userId;
        var email      = req.session.email;
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
        }


        connection.query('INSERT user ' +
            '(userId, email, city, state, zipcode, firstName, lastName, phone, createDate, userType, expireDate, balance, checkedOutCopy, availableCopy, address) VALUES ("'+
              userId + '","' + email +'","'+ city+ '","' + state +'","' + zipcode+ '","'+ firstName+ '","'+ lastName +'","'+
              phone + '","' + createDate +'","' + userType+ '","' + expireDate + '",' + balance +',' +checkedOutCopy + ','+availableCopy+',"'+ address+'")', function(err, rows, fields) {
            if(err){
                console.log()

            }
        });

        res.redirect('/profile-view-only');


    });

    //member view profile
    app.get('/profile-view-only', isLoggedIn, function (req, res) {
        console.log(req.session.userId);
        connection.query('SELECT * from user WHERE userId =' + req.session.userId, function(err, rows, fields) {
            console.log(rows[0].email);
            res.render('profile-view-only.ejs', {
                user : rows[0]
            });
        });

    });


    //view individual profile
    app.get('/profile/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM user WHERE userId = ' + req.params.id, function(err, rows, fields) {
            if (err) {};
            res.render('profile.ejs', {user: rows[0]});

        });

    });


    //modify profile
    app.get('/modifyprofile/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM user WHERE userId = ' + req.params.id, function(err, rows, fields) {
            if (err) {};
            res.render('modifyprofile.ejs', {
                user: rows[0]
            });

        });

    });

    app.post('/modifyprofile/:id', isLoggedIn, function (req, res) {

        connection.query('UPDATE user SET firstName = "' + req.param('firstName')
            + '", lastName = "' + req.param('lastName') + '", address = "'+ req.param('address')
            +'", phone =" ' + req.param('phone') +'", city = "'+ req.param('city') +'", state ="'
            + req.param('state') + '", zipcode =" ' + req.param('zipcode') +'" WHERE userId = "'
            + req.params.id +'"', function(err, rows, fields) {

        });

        var pathName = '/profile/'+ req.params.id;
        res.redirect(pathName);
    });

    //delete individual member
    app.get('/destroy/:id', isLoggedIn, function (req, res) {
        User.remove({"local.userId": req.params.id}).exec();
        connection.query('DELETE FROM user WHERE userId = '+ req.params.id);
        res.redirect('/searchMember');
    });


    //search members
    app.get('/searchMember', function(req, res) {

        connection.query('SELECT * from user', function(err, users, fields) {

            res.render('searchMember.ejs', {
                users: users
            });
        });


    });


//****************************************************************
// Movie Management
//****************************************************************
    //Create New Movie

    app.get('/createMovie', isLoggedIn, function (req, res) {
        res.render('createMovie.ejs'); // load the createMovie.ejs file
    });
    app.post('/createMovie', isLoggedIn, function (req, res) {
        var newMovie            = new Movie();
        var total=0;

        Movie.count({id:{$exists:true}},function(err,count){

            newMovie.id				= count+1;//to  increment the id
            newMovie .MovieName  	= req.param('movie_name');
            newMovie .MovieBanner  	= req.param('banner');
            newMovie .ReleaseDate   = req.param('releaseDate');
            newMovie .RentAmount  		= req.param('rentAmount');
            newMovie .AvailableCopies  	= req.param('availableCopies');
            //newMovie.category 		= req.param('category');

            if(req.param('category') === "other"){
                newMovie.category = req.param('other');
            }
            else newMovie.category 		= req.param('category');


            newMovie.save();
            console.log(newMovie._id);

            var pathName = '/viewMoviePage/'+ newMovie._id;
            res.redirect(pathName);
        });
    });
//***************************************************************
    //delete individual movie

    app.get('/deleteMovie/:id', isLoggedIn, function (req, res) {
        Movie.remove({_id: req.params.id}).exec();
        res.redirect('/searchMovie');
    });
    //***************************************************************
    //search movie for members
    app.post('/searchMovieForMembers', isLoggedIn, function (req, res) {
        var twisted = function(res){
            return function(err, movies){
                if (err){
                    console.log('error occured');
                    return;
                }
                res.render('searchMovieForMembers.ejs', {movies: movies});
            }
        }
        var name = req.param('searchparam');
        var value = {'$regex': req.param('str'),$options: 'i'};
        if (req.param('searchparam')=="id" || req.param('searchparam')=="ReleaseDate" || req.param('searchparam')=="RentAmt" || req.param('searchparam')=="AvlCopies"){value=req.param('str');}
        var query = {};
        query[name] = value;
        console.log(query);
        Movie.find(query, twisted(res));
    });


    app.get('/searchMovieForMembers', isLoggedIn, function (req, res) {
        var twisted = function(res){
            return function(err, movies){
                if (err){
                    console.log('error occured');
                    return;
                }
                res.render('searchMovieForMembers.ejs', {movies: movies});
            }
        }
        Movie.find({}, twisted(res)).limit(100);
    });


    //***************************************************************
    //view movie for members

    app.get('/movie-view-only/:id', isLoggedIn, function (req, res) {
        Movie.findOne({id: req.params.id}, function (err,movies) {
            if (err) {};
            res.render('movie-view-only.ejs', {movies: movies});


        });
    });


    //***************************************************************

    //view all movies
    app.get('/movieall', isLoggedIn, function (req, res) {
        var twisted = function(res){
            return function(err, movie){
                if (err){
                    console.log('error occured');
                    return;
                }
                GLOBAL.count=GLOBAL.count+1;
                res.render('movie.ejs', {movie: movie, count: GLOBAL.count});
            }
        }

        Movie.find({}, twisted(res));
    });
    app.post('/movieall', isLoggedIn, function (req, res) {
        res.redirect('/movieall');

    });

//*******************************************
    app.post('/searchMovie', isLoggedIn, function (req, res) {
        var twisted = function(res){
            return function(err, movies){
                if (err){
                    console.log('error occured');
                    return;
                }
                res.render('searchMovie.ejs', {movies: movies});
            }
        }
        var name = req.param('searchparam');
        var value = {'$regex': req.param('str'),$options: 'i'};
        if (req.param('searchparam')=="id" || req.param('searchparam')=="ReleaseDate" || req.param('searchparam')=="RentAmt" || req.param('searchparam')=="AvlCopies"){value=req.param('str');}
        var query = {};
        query[name] = value;
        console.log(query);
        Movie.find(query, twisted(res));
    });

    app.get('/searchMovie', isLoggedIn, function (req, res) {
        var twisted = function(res){
            return function(err, movies){
                if (err){
                    console.log('error occured');
                    return;
                }
                res.render('searchMovie.ejs', {movies: movies});
            }
        }
        Movie.find({}, twisted(res)).limit(100);
    });

    //view individual movie
    app.get('/viewMoviePage/:id', isLoggedIn, function (req, res) {
        Movie.findOne({_id: req.params.id}, function (err,movies) {
            if (err) {};
            res.render('viewMoviePage.ejs', {movies: movies});

        });
    });
//***************************************************************
    //modify movie


    app.get('/modifyMovie/:id', isLoggedIn, function (req, res) {
        Movie.findOne({_id: req.params.id}, function (err, movies) {
            if (err) {
            };
            res.render('modifyMovie.ejs', {
                movies: movies
            });
        });
    });

    app.post('/modifyMovie/:id', isLoggedIn, function (req, res) {
        Movie.update({_id:req.params.id},{"MovieName": req.param('movie_name'), "MovieBanner":req.param('banner'),
            "ReleaseDate":req.param('releaseDate'), "RentAmount":req.param('rentAmount'),"AvailableCopies":req.param('availableCopies'),"category":req.param('category')}).exec();
        var pathName = '/viewMoviePage/'+ req.params.id;
        res.redirect(pathName);

    });


//***************************************************************    


    //direct to user page
    app.get('/store', isLoggedIn, function (req, res) {
        res.render('store.ejs'); // load the index.ejs file
    });

//    //direct to admin page
//    app.get('/adminstore', isLoggedIn, function (req, res) {
//        res.render('adminstore.ejs'); // load the index.ejs file
//    });

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    app.get('/adminlogin', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('adminlogin.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile-view-only', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/adminlogin', passport.authenticate('local-login',{

        successRedirect: '/searchMember', // redirect to the secure profile section
        failureRedirect: '/adminlogin', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages

    }));


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });

    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/register', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));



    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();

        res.redirect('/');

    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


