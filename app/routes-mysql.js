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

                var expireDate_string = expireDate.toISOString();
                var expireDate_string = expireDate_string.replace("T"," ");
                var expireDate_string = expireDate_string.substring(0, expireDate_string.length - 5);

                var createDate_string = createDate.toISOString();
                var createDate_string = createDate_string.replace("T"," ");
                var createDate_string = createDate_string.substring(0, createDate_string.length - 5);


                connection.query('INSERT user ' +
                    '(userId, email, city, state, zipcode, firstName, lastName, phone, createDate, userType, expireDate, balance, checkedOutCopy, availableCopy, address) VALUES ("'+
                    userId + '","' + email +'","'+ city+ '","' + state +'","' + zipcode+ '","'+ firstName+ '","'+ lastName +'","'+
                    phone + '","' + createDate_string +'","' + userType+ '","' + expireDate_string + '",' + balance +',' +checkedOutCopy + ','+availableCopy+',"'+ address+'")', function(err, rows, fields) {

                });

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

            var memberDay_string = memberDay.toISOString();
            var memberDay_string = memberDay_string.replace("T"," ");
            var memberDay_string = memberDay_string.substring(0, memberDay_string.length - 5);

            var today_string = today.toISOString();
            var today_string = today_string.replace("T"," ");
            var today_string = today_string.substring(0, today_string.length - 5);



            connection.query('UPDATE user SET userType = "' + userType
                + '", availableCopy = ' + availableCopy
                + ', balance = ' + newBalance
                +', createDate =" ' + today_string +'", expireDate = "'+ memberDay_string +'" WHERE userId = "'
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
//****************************************************************************************
// Transaction Management
//***************************************************************************************
    app.post('/returnMovie/:uid/:mid', isLoggedIn, function (req, res) {
    	var userid=req.params.uid;
       	var movieid=req.params.mid;
       	console.log(userid);
       	connection.query('update movies set AvailableCopies=AvailableCopies+1 where id='+movieid, function(err, rows, fields) {
	    if(err){console.log('unsuccessful update on movies '+err);}
	    console.log('Movies avail + 1');
	    });
    	connection.query('select availableCopy userType from user where userId="' +userid+ '"', function(err, rows, fields) {
       		if(rows[0].availableCopy <2 && rows[0].userType=="simple" || rows[0].availableCopy <10 && rows[0].userType=="premium")
       			{
       	connection.query('update user set availableCopy=availableCopy+1 where userId="'+userid+'"', function(err, rows, fields) {	
    	if(err){console.log('unsuccessful update on user '+err);}
        console.log('user avail + 1');
    	});	
       			}
       		else{console.log('cannot add more copies');};
    	});
       	connection.query('update movies set userId=NULL where id='+movieid, function(err, rows, fields) {	
        if(err){console.log('unsuccessful update on movies'+err);}
        console.log('userid set null');
       });
       	connection.query('update user_movie set returnDate=date_format(curdate(),"%Y-%m-%d") where userId="'+userid+'" and movieId='+movieid, function(err, rows, fields) {	
        if(err){console.log('unsuccessful update on user_movie'+err);}
        console.log('userid set null');
        });
       	connection.query('SELECT * FROM user_movie join movies on movies.id = user_movie.movieId join user on user_movie.userId=user.userId where user_movie.userId="'+userid+'" and user_movie.returnDate is not null', function(err, joins, fields) {
       	//console.log('SELECT * FROM user join movies on movies.userId = user.userId where user.userId="'+userid+'"');
        if (err) {console.log('unsuccessful select on join '+err);}
        if(joins.length!=0){
        res.render('returnContinue.ejs', {joins: joins});   
        }
        else{console.log('no movie to return');}
      });
       	//res.redirect('/checkoutPage/'+userid)
    });
    
    app.get('/returnMovie/:uid/:name', isLoggedIn, function (req, res) {
    	var array = {id:req.params.uid, firstName:req.params.name};
    			connection.query('select * from user_movie um join movies m on um.movieId=m.id where returnDate is  NULL', function(err, rows, fields) {
	       			if(err){console.log('unsuccessful select');}
	       			res.render('returnMovie.ejs', {user: array, searchres: rows});
	            });
            

    });

    
       app.post('/issueMovie/:uid/:mid', isLoggedIn, function (req, res) {
    		
           connection.query('SELECT * FROM movies WHERE id = ' + req.params.id, function(err, movies, fields) {
               if (err) {};
               console.log('uid='+uid+'mid='+mid);
          
               //res.render('viewMoviePage.ejs', {movies: movies[0]});
          
           
           		
    		 
           	 
           });
          
});
       
       
       

       app.post('/pay/:uid', isLoggedIn, function (req, res) {
    		
           connection.query('update user_movie set checkedOut=true where userId="'+req.params+'"', function(err, movies, fields) {
               if (err) {};
               console.log('uid='+uid+'mid='+mid);
          
               //res.render('viewMoviePage.ejs', {movies: movies[0]});
          
           
           		
    		 
           	 
           });
          
});
         
       
       app.get('/issueMovie/:uid/:mid', isLoggedIn, function (req, res) {
       	var userid=req.params.uid;
       	var movieid=req.params.mid;
       	
       	connection.query('select availableCopy from user where userId="' +userid+ '"', function(err, rows, fields) {
       		if(rows.length!=0){
       		if(rows[0].availableCopy > 0)
       			{
       				
       			var rent;
       			connection.query('update movies set userId="'+req.params.uid+'" where id='+req.params.mid+'',function(err,result){if(err){console.log('error in updating userid in movies');}});
   				connection.query('select RentAmount from movies where id='+req.params.mid, function(err, rows, fields) {  
   					var date= new Date();
   							connection.query('insert into user_movie values("' +
   	       	                req.params.uid+ '",'+req.params.mid+','+rows[0].RentAmount+',NULL,date_format(curdate(),"%Y-%m-%d"),NULL)', function(err, rows, fields) {
   	       	       			if(err){console.log('unsuccessful insert');}
   							});	
   							rent=rows[0].RentAmount;
   							console.log('Avail < 0 so rent '+rows[0].RentAmount);		
   							connection.query('update user set checkedOutCopy=checkedOutCopy+1, availableCopy=availableCopy-1,balance=balance+'+rent+' where userId="'+req.params.uid+'"', function(err, rows, fields) {
   	       	       	       	if(err){console.log('unsuccessful update'+err);}
   	       	       	       	console.log('Avail < 0 so chk+1 and balance + '+rent);
   	       	       	        });	
   							connection.query('update movies set AvailableCopies=AvailableCopies-1 where id='+req.params.mid, function(err, rows, fields) {
   				       	    if(err){console.log('unsuccessful update on movies '+err);}
   				       	    console.log('Movies avail - 1');
   				       	    });	
   				if(err){console.log('unsuccessful select');}
   	         	});
       			}
       		else
       			{
       				console.log("Cannot Rent - Overlimit");
       				
       			}
       		
       		var pathName = '/checkoutPage/'+ userid;
            res.redirect(pathName);
       		}
       		else{console.log('no movie was searched');}
            });
       	    	
       
               
           });

    
       
       app.get('/checkoutPage/:id', isLoggedIn, function (req, res) {

           connection.query('SELECT * FROM user_movie join movies on movies.userId = user_movie.userId join user on user_movie.userId=user.userId where user_movie.userId="'+req.params.id+'" and returnDate is NULL', function(err, joins, fields) {
              
               	 if (err) {};
               	 if(joins.length!=0){
               res.render('checkoutPage.ejs', {joins: joins});
               	 }
               	 else{console.log('no movies in the cart');  
               	// res.render('profile.ejs');}
               	 }
           });

       });
       
       app.get('/checkout/:id', isLoggedIn, function (req, res) {

           connection.query(' select * from user_movie join user on user_movie.userId=user.userId join movies on user_movie.movieId=movies.id  where user_movie.userId="'+req.params.id+'" and user_movie.returnDate is NULL',function(err,joins){
               	 if (err) {};
               res.render('generateBill.ejs', {joins: joins});
          
           });

       });
       
       app.get('/issue/:id', isLoggedIn, function (req, res) {
    	   
    	 
           connection.query('SELECT * FROM user WHERE userId = "' + req.params.id + '"', function(err, user, fields) {
               if (err) {};
               console.log('SELECT * FROM user WHERE userId = "' + req.params.id + '"');
               res.render('issueMovie.ejs', {
                   user: user[0], searchres: ''
               });

           });

       });
       app.post('/issueSearch/:id/:name', isLoggedIn, function (req, res) {
       	var qry= 'SELECT * from movies WHERE ' + req.param('searchparam') + ' = "' + req.param('str')+'" and AvailableCopies >= 1';
       	if(req.param('searchparam')=='MovieName' || req.param('searchparam')=='MovieBanner' || req.param('searchparam')=='category'){qry='SELECT * from movies WHERE ' + req.param('searchparam') + ' like "%' + req.param('str')+'%" and AvailableCopies > 0';}
           connection.query(qry, function(err, movies, fields) {
               if (err) {
               };
               if(movies.length!=0){
               var array = {id:req.params.id, firstName:req.params.name}
               console.log(array);
               res.render('issueMovie.ejs', {
               	user: array, searchres: movies
               });
               }
               else{console.log('no movie was searched');}
           });

       });
   //********************************************************************************************

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
            if (err) { res.redirect('/searchMovieForMembers')
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
    app.get('/movieall/:cnt',isLoggedIn, function(req, res) {
    	var low=0;
    	low=(req.params.cnt * 20) - 20;
        connection.query('SELECT * from movies limit '+low+', 20', function(err, movies, fields) {
        console.log('low='+low);
        	//GLOBAL.count=GLOBAL.count+1;
            res.render('movie.ejs', {movies: movies ,cnt: req.params.cnt});
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
    	//console.log(qry);
        connection.query(qry, function(err, movies, fields) {
            if (err) { 
            	 res.redirect('/searchMovie');
            	 console.log('query unsuccessful');
            };
            if(movies.length === 0){
               // console.log('SELECT * from user WHERE email = "' + req.param('email')+'"');
                console.log('no id');
                //flash the message
            	req.flash("No such Id', 'That id does not exist");

                res.render('searchMovie.ejs', { message: req.flash('noid') });

            }else{
            
            console.log("in post");
            res.render('searchMovie.ejs', {
                movies: movies
            });
            };
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


