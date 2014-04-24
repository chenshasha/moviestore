// app/routes.js

var User = require('../app/models/user');
var Movie = require('../app/models/movie');

GLOBAL.count=0;

module.exports = function (app, passport) {


    //Member Management
    //member upgrade
    app.get('/upgrade/:id', isLoggedIn, function (req, res) {

        var memberDay = new Date();
        memberDay.setDate(memberDay.getDate()+31)
        User.update({"local.email": req.params.id},{"local.userType": "Premium", "local.createDate":new Date(),
            "local.expireDate":memberDay}).exec();
        var pathName = '/profile/'+ req.params.id;
        res.redirect(pathName);
    });



    //add new member
    app.get('/addMember', isLoggedIn, function (req, res) {
        res.render('addmember.ejs'); // load the index.ejs file
    });
    app.post('/addMember', isLoggedIn, function (req, res) {
        var newUser            = new User();
        // set the user's local credentials
        newUser.local.email      = req.param('email');
        newUser.local.firstName  = req.param('firstName');
        newUser.local.lastName   = req.param('lastName');
        newUser.local.phone      = req.param('phone');
        newUser.local.address    = req.param('address');
        newUser.local.password   = newUser.generateHash(req.param('password'));
        newUser.local.createDate = new Date();
        newUser.local.userType   = req.param('userType');
        newUser.local.expireDate = new Date();
        if(req.param('userType') == "Simple"){
            newUser.local.expireDate.setDate(newUser.local.expireDate.getDate()+365);
        }else{
            newUser.local.expireDate.setDate(newUser.local.expireDate.getDate()+31);
        }

        newUser.save();
        var pathName = '/profile/'+ req.param('email');
        res.redirect(pathName);

    });

//****************************************************************
    //Create New Movie
    
    app.get('/createMovie', isLoggedIn, function (req, res) {
    	res.render('createMovie.ejs'); // load the createMovie.ejs file
    });
    app.post('/createMovie', isLoggedIn, function (req, res) {
    	var newMovie            = new Movie();
    	//var total=Movie.count({ id: { $exists: true } });
    	

    	
    	

    	newMovie .id      		= Math.random();           //temporary solution
    	newMovie .MovieName  	= req.param('movie_name');
    	newMovie .MovieBanner  	= req.param('banner');
    	newMovie .ReleaseDate   = req.param('releaseDate');
    	newMovie .RentAmt  		= req.param('rentAmount');
    	newMovie .AvlCopies  	= req.param('availableCopies');
    	newMovie.category 		= req.param('category');

    	if(req.param('category') == "Other"){
    		newMovie.category = req.param('other');
    	}

    	newMovie.save();
    	var pathName = '/viewMoviePage/'+ newMovie.id;
    	res.redirect(pathName);

    });

    
 //***************************************************************   
    //view individual profile
    app.get('/profile/:id', isLoggedIn, function (req, res) {
         User.findOne({"local.email": req.params.id}, function (err, user) {
              if (err) {};
              res.render('profile.ejs', {user: user});

            });
    });
    
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
    

    //member view profile
    app.get('/profile-view-only', isLoggedIn, function (req, res) {
        User.findOne({user_id: req.user.id}, function(err, user) {
            res.render('profile-view-only.ejs', {
                user : req.user
            });
        });
    });

    //delete individual member
    app.get('/destroy/:id', isLoggedIn, function (req, res) {
        User.remove({"local.email": req.params.id}).exec();
        res.redirect('/adminstore');
    });

    //modify profile
    app.get('/modifyprofile/:id', isLoggedIn, function (req, res) {
        User.findOne({"local.email": req.params.id}, function (err, user) {
            if (err) {
            };
            res.render('modifyprofile.ejs', {
                user: user
            });
        });
    });

    app.post('/modifyprofile/:id', isLoggedIn, function (req, res) {
        User.update({"local.email": req.params.id},{"local.firstName": req.param('firstName'), "local.lastName":req.param('lastName'),
            "local.address":req.param('address'), "local.phone":req.param('phone')}).exec();
        var pathName = '/profile/'+ req.params.id;
        res.redirect(pathName);
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
        //Movie.find({"MovieName":{'$regex': req.param('str'),$options: 'i'}}, twisted(res));    	
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
        Movie.find({}, twisted(res));  
    });
    //view individual movie
    app.get('/viewMoviePage/:id', isLoggedIn, function (req, res) {
        Movie.findOne({id: req.params.id}, function (err,movies) {
              if (err) {};
              res.render('viewMoviePage.ejs', {movies: movies});

            });
    });

 
 //********************************************   

    //view all members
    app.get('/searchMember', function(req, res) {

        User.find({ "local.userType": { $ne: "admin" } },function (err, users) {
            if (err) {
            }
            ;
            res.render('searchMember.ejs', {
                users: users
            });
        });

    });

    //view profile-view-only




    //direct to user page
    app.get('/store', isLoggedIn, function (req, res) {
        res.render('store.ejs'); // load the index.ejs file
    });

    //direct to admin page
    app.get('/adminstore', isLoggedIn, function (req, res) {
        res.render('adminstore.ejs'); // load the index.ejs file
    });

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

        successRedirect: '/adminstore', // redirect to the secure profile section
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
        successRedirect: '/profile-view-only', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));



    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        //req.session.destroy();
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


