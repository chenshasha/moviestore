// app/routes.js

var User = require('../app/models/user');
var Movie = require('../app/models/movie');

GLOBAL.count=0;

module.exports = function (app, passport) {


//****************************************************************
// Member Management
//****************************************************************
    //change Membership -- Simple User: 1 year validation, Premium User: 1 month validation
    app.get('/changeMembership/:id/:type', isLoggedIn, function (req, res) {

        var memberDay = new Date();
        
        if(req.params.type == "Simple"){
        	memberDay.setDate(memberDay.getDate()+31);
        	User.update({"local.email": req.params.id},{"local.userType": "Premium", "local.createDate":new Date(),
                "local.expireDate":memberDay}).exec();

        }else{
        	memberDay.setDate(memberDay.getDate()+365);
        	User.update({"local.email": req.params.id},{"local.userType": "Simple", "local.createDate":new Date(),
                "local.expireDate":memberDay}).exec();
        	
        }
        
        var pathName = pathName = '/profile/'+ req.params.id;
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
    

    //member view profile
    app.get('/profile-view-only', isLoggedIn, function (req, res) {
        User.findOne({user_id: req.user.id}, function(err, user) {
            res.render('profile-view-only.ejs', {
                user : req.user
            });
        });
    });
    
    //view individual profile
    app.get('/profile/:id', isLoggedIn, function (req, res) {
         User.findOne({"local.email": req.params.id}, function (err, user) {
              if (err) {};
              res.render('profile.ejs', {user: user});

            });
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
    
    //delete individual member
    app.get('/destroy/:id', isLoggedIn, function (req, res) {
        User.remove({"local.email": req.params.id}).exec();
        res.redirect('/adminstore');
    });
    
    
    //search members
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
    
    
    //view all members
    app.get('/memberAll', isLoggedIn, function (req, res) {	
    	
    	User.find({}, function (err, users) {
    		if (err) {
    			console.log('error occured');
                return;
            }
    		GLOBAL.count=GLOBAL.count+1;
            res.render('memberAll.ejs', {
            	users: users, 
            });
        });
    	
    });
    
    app.post('/memberAll', isLoggedIn, function (req, res) { 
    	res.redirect('/memberAll');     
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


