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
        res.render('addmember.ejs', {message: req.flash('userDuplicate')}); // load the index.ejs file
    });

    app.post('/addMember', isLoggedIn, function (req, res) {
        //check whether same email exist
        connection.query('SELECT * from user WHERE email = "' + req.param('email')+'"', function(err, rows, fields) {
            if (err) {
            };
            if(rows.length != 0){
                console.log('SELECT * from user WHERE email = "' + req.param('email')+'"');
                console.log(rows);
                //flash the message
                req.flash('userDuplicate', 'That email exists already.');

                res.render('addMember.ejs', { message: req.flash('userDuplicate') });

            }else{
                //var userId     = Math.floor(Math.random() * 1000000000);

                var idString   = (Math.floor(Math.random()* 900000000) + 100000000).toString();;
                var userId     = idString.substr(0,3) + "-" + idString.substr(3,2) + "-" + idString.substr(5,4);
                var email      = req.param('email');
                var password   = req.param('password');
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

                connection.query('INSERT user ' +
                    '(userId, email, city, state, zipcode, firstName, lastName, phone, createDate, userType, expireDate, balance, checkedOutCopy, availableCopy, address) VALUES ("'+
                    userId + '","' + email +'","'+ city+ '","' + state +'","' + zipcode+ '","'+ firstName+ '","'+ lastName +'","'+
                    phone + '","' + createDate +'","' + userType+ '","' + expireDate + '",' + balance +',' +checkedOutCopy + ','+availableCopy+',"'+ address+'")', function(err, rows, fields) {

                });
                console.log(phone);
                console.log('INSERT user ' +
                    '(userId, email, city, state, zipcode, firstName, lastName, phone, createDate, userType, expireDate, balance, checkedOutCopy, availableCopy, address) VALUES ("'+
                    userId + '","' + email +'","'+ city+ '","' + state +'","' + zipcode+ '","'+ firstName+ '","'+ lastName +'","'+
                    phone + '","' + createDate +'","' + userType+ '","' + expireDate + '",' + balance +',' +checkedOutCopy + ','+availableCopy+',"'+ address+'")');
                //save in mongodb
                var newUser            = new User();
                newUser.local.userId   = userId;
                newUser.local.email      = email;
                newUser.local.password   = newUser.generateHash(password); // use the generateHash function in our user model
                newUser.save();
                var pathName = '/profile/'+ userId;
                res.redirect(pathName);


            };

        });




    });


    //search members based on attributes
    app.post('/searchMember', isLoggedIn, function (req, res) {


        connection.query('SELECT * from user WHERE ' + req.param('searchparam') + ' = "' + req.param('str')+'"', function(err, users, fields) {
            if (err) {
                res.redirect('/searchMember');
            };
            res.render('searchMember.ejs', {
                users: users
            });
        });

    });

    //change Membership -- Simple User: 1 year validation, Premium User: 1 month validation
    app.get('/changeMembership/:id/:type', isLoggedIn, function (req, res) {

        var today = new Date();
        var memberDay = new Date();
        var availableCopy = 0;
        var userType;
        var newBalance = 0;
        connection.query('SELECT * from user WHERE userId ="' + req.params.id +'"', function(err, rows, fields) {
            var checkedOutCopy = rows[0].checkedOutCopy;
            var oldBalance = rows[0].balance;
            availableCopy = 0;
            if(req.params.type == "Simple"){
                if (checkedOutCopy >= 10 ){
                    availableCopy = 0;

                }else{
                    availableCopy = 10 - checkedOutCopy;

                }
                memberDay.setDate(memberDay.getDate()+31);
                userType = "Premium";
                newBalance = oldBalance + 10;

            }else{
                if (checkedOutCopy >= 2 ){
                    availableCopy = 0;
                }else{
                    availableCopy = 2 - checkedOutCopy;
                }
                memberDay.setDate(memberDay.getDate()+365);
                userType = "Simple";
                newBalance = oldBalance;
            }
            connection.query('UPDATE user SET userType = "' + userType
                + '", availableCopy = ' + availableCopy
                + ', balance = ' + newBalance
                +', createDate =" ' + today +'", expireDate = "'+ memberDay +'" WHERE userId = "'
                + req.params.id +'"', function(err, rows, fields) {

            });

        });

        var pathName = pathName = '/profile/'+ req.params.id;
        res.redirect(pathName);

    });


    //member view profile
    app.get('/profile-view-only', isLoggedIn, function (req, res) {
        console.log('SELECT * from user WHERE userId = "' + req.session.userId + '"');
        connection.query('SELECT * from user WHERE userId = "' + req.session.userId + '"', function(err, user, fields) {

            res.render('profile-view-only.ejs', {
                user : user[0]
            });
        });

    });


    //view individual profile
    app.get('/profile/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM user WHERE userId = "' + req.params.id + '"', function(err, user, fields) {
            if (err) {};
            res.render('profile.ejs', {
                user: user[0]
            });

        });

    });


    //modify profile
    app.get('/modifyprofile/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM user WHERE userId = "' + req.params.id + '"', function(err, user, fields) {
            if (err) {};
            res.render('modifyprofile.ejs', {
                user: user[0]
            });

        });

    });

    app.get('/issue/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM user WHERE userId = "' + req.params.id + '"', function(err, user, fields) {
            if (err) {};
            res.render('issueMovie.ejs', {
                user: user[0]
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
        connection.query('DELETE FROM user WHERE userId = "'+ req.params.id + '"');
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


//********************************************************************************************
// Movie Management
//********************************************************************************************
    
    // create movie 
    app.get('/createMovie', isLoggedIn, function (req, res) {
        res.render('createMovie.ejs'); // load the createMovie.ejs file
    });
    app.post('/createMovie', isLoggedIn, function (req, res) {
    	 
    	connection.query('select max(id) as id from movies',function(err, result,fields){	
    	    	//console.log(result[0].id);
    	
    	var Id=result[0].id+1;
    	
        var MovieName      = req.param('movie_name');
        var MovieBanner   = req.param('banner');
        var ReleaseDate    = req.param('releaseDate');
        var RentAmount       = req.param('rentAmount');
        var AvailableCopies     = req.param('availableCopies');
       // var category    = req.param('category');
      
        if(req.param('category') == "other"){
            var category=req.param('other');
        }else{
        	
        	var category=req.param('category');
        }

        connection.query('INSERT movies ' +
            '( MovieName, MovieBanner, ReleaseDate, RentAmount, AvailableCopies, category) VALUES ("'+
           MovieName +'","'+ MovieBanner+ '",' + ReleaseDate +',' + RentAmount+ ','+ AvailableCopies + ',"'+ category + '")', function(err, rows, fields) {
        	
        });
        var pathName = '/viewMoviePage/'+Id;
        res.redirect(pathName);
    	 });
    });
    
//***************************************************************
   
  //delete individual movie 
    app.get('/deleteMovie/:id', isLoggedIn, function (req, res) {
       
        connection.query('DELETE FROM movies WHERE id = '+ req.params.id);
        res.redirect('/searchMovie');
    });
    //***************************************************************
    //Search movie for members
    app.post('/searchMovieForMembers', isLoggedIn, function (req, res) {
    	//connection.query('SELECT * from movies limit 10', function(err, movies, fields) {
    	var qry= 'SELECT * from movies WHERE ' + req.param('searchparam')  + ' like "%' + req.param('str')+'%"';
    	if(req.param('searchparam')=='MovieName' || req.param('searchparam')=='MovieBanner' || req.param('searchparam')=='category'){qry='SELECT * from movies WHERE ' + req.param('searchparam') + ' like "%' + req.param('str')+'%"';}
        connection.query(qry, function(err, movies, fields) {
            if (err) {
            };
            console.log("in post");
            res.render('searchMovieForMembers.ejs', {
                movies: movies
            });
        });

    });
    app.get('/searchMovieForMembers', function(req, res) {
    	console.log("in get");
        connection.query('SELECT * from movies limit 10', function(err, movies, fields) {

            res.render('searchMovieForMembers.ejs', {
                movies: movies
            });
        });


    });


    //***************************************************************
   //view For members
    
    app.get('/movie-view-only/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM movies WHERE id = ' + req.params.id, function(err, movies, fields) {
            if (err) {};
            res.render('movie-view-only.ejs', {movies: movies[0]});

        });

    });


    //***************************************************************

    //view all movies
    app.get('/movieall', function(req, res) {

        connection.query('SELECT * from movies', function(err, movies, fields) {

        	GLOBAL.count=GLOBAL.count+1;
            res.render('movie.ejs', {movies: movies, count: GLOBAL.count});
            });
        });


   
    app.post('/movieall', isLoggedIn, function (req, res) {
        res.redirect('/movieall');

    });

//*******************************************
  
    //serch movies for admin 
    app.post('/searchMovie', isLoggedIn, function (req, res) {
    	//connection.query('SELECT * from movies limit 10', function(err, movies, fields) {
    	var qry= 'SELECT * from movies WHERE ' + req.param('searchparam') + ' = ' + req.param('str')+'';
    	
    	if(req.param('searchparam')=='MovieName' || req.param('searchparam')=='MovieBanner' || req.param('searchparam')=='category'){qry='SELECT * from movies WHERE ' + req.param('searchparam') + ' like "%' + req.param('str')+'%"';}
    	console.log(qry);
        connection.query(qry, function(err, movies, fields) {
            if (err) {console.log('query unsuccessful');
            };
            console.log("in post");
            res.render('searchMovie.ejs', {
                movies: movies
            });
        });

    });
    app.get('/searchMovie', function(req, res) {
    	console.log("in get");
        connection.query('SELECT * from movies limit 10', function(err, movies, fields) {

            res.render('searchMovie.ejs', {
                movies: movies
            });
        });


    });


    
    //view individual movie 
    app.get('/viewMoviePage/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM movies WHERE id = ' + req.params.id, function(err, movies, fields) {
            if (err) {};
            res.render('viewMoviePage.ejs', {movies: movies[0]});

        });

    });
//***************************************************************
       //modify movie
    
    app.get('/modifyMovie/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM movies WHERE id = '+ req.params.id , function(err, movies, fields) {
            if (err) {};
            res.render('modifyMovie.ejs', {
                movies: movies[0]
            });

            
        });

    });

    app.post('/modifyMovie/:id', isLoggedIn, function (req, res) {

    	var movie_id=req.params.id;
    	var name=req.param('movie_name');
    	console.log(name);
        connection.query('UPDATE movies SET  MovieName = "'+ req.param('movie_name')
            +'", MovieBanner = "' + req.param('banner') + '", ReleaseDate = '+ req.param('releaseDate')
            +', RentAmount = ' + req.param('rentAmount') +', AvailableCopies = '+ req.param('availableCopies') +', category ="'
            + req.param('category') +'" WHERE id =' + req.params.id, function(err, rows, fields) {
        	if (err) {console.log('Query unsuccessful');};

        });
        connection.query('commit');

        var pathName = '/viewMoviePage/'+ movie_id;
        res.redirect(pathName);
    });


//***************************************************************    



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
        successRedirect: '/profile-view-only', // redirect to the secure profile section
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


