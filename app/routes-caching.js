//app/routes.js
var User = require('../app/models/user');
var Movie = require('../app/models/movie');
var MicroCache	= require('microcache.js');
var userCache = new MicroCache();
var movieCache = new MicroCache();

var mysql = require('../node_modules/mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'pass',
    database : 'moviestore'
});


module.exports = function (app, passport) {
    connection.connect();


//	****************************************************************
//	Member Management
//	****************************************************************
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
                user: user[0],message:req.flash('Error')
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

        var cachedUsers = userCache.getAll();
        if (cachedUsers == null) {
            console.log("cache miss, read user info from DB");
            connection.query('SELECT * from user', function(err, users, fields) {
                for (i=0; i < users.length; i++) {
                    userCache.set(i, users[i])
                }

                res.render('searchMember.ejs', {
                    users: users
                });
            });
        } else {
            console.log("cache hit, return user info from cache");
            res.render('searchMember.ejs', {
                users: cachedUsers
            });
        }


    });

    //app.get('/profile', isLoggedIn, function (req, res) {
    //res.render('profile.ejs', {message: req.flash('noReturnMovie')}); // load the index.ejs file
    //});
//	****************************************************************************************
//	Transaction Management
//	***************************************************************************************
    app.post('/returnMovie/:uid/:mid', isLoggedIn, function (req, res) {
        var userid=req.params.uid;
        var movieid=req.params.mid;
        console.log(userid);
        connection.query('select * from user_movie where issueDate is not null',function(err, results){
            if(results.length!=0)
            {

                connection.query('update movies set AvailableCopies=AvailableCopies+1  where id='+movieid, function(err, rows, fields) {
                    if(err){console.log('unsuccessful update on movies '+err);}
                    console.log('Movies avail + 1');
                });
                connection.query('select availableCopy ,userType from user where userId="' +userid+ '"', function(err, rows, fields) {
                    if(err){console.log('unsuccessful select on avl copy');}
                    console.log(rows[0].availableCopy);
                    console.log(rows[0].userType);

                    if((rows[0].availableCopy <2 && rows[0].userType=="Simple" && rows[0].checkedOutCopy!=0) )
                    {
                        connection.query('update user set checkedOutCopy=checkedOutCopy-1, availableCopy=availableCopy+1 where userId="'+userid+'"', function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on user '+err);}
                            console.log('user avail + 1');
                        });
                        connection.query('update movies set userId=NULL where id='+movieid, function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on movies'+err);}
                            console.log('userid set null');
                        });
                        connection.query('update user_movie set returnDate=date_format(curdate(),"%Y-%m-%d") where userId="'+userid+'" and movieId='+movieid+'', function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on user_movie'+err);}
                            console.log('userid set null');
                        });
                        connection.query('select * from user_movie join user join movies where user_movie.movieId=movies.id and user.userId="'+req.params.id+'" and returnDate is NULL and issueDate is  null and inCart=true and returnDate=date_format(curdate(),"%Y-%m-%d")', function(err, joins, fields) {
                            //console.log('SELECT * FROM user join movies on movies.userId = user.userId where user.userId="'+userid+'"');
                            if (err) {console.log('unsuccessful select on join '+err);}
                            if(joins.length!=0){
                                res.render('returnContinue.ejs', {joins: joins});
                            }
                            else{console.log('no movie to return');
                                req.flash('Error', 'No movies have been issued to this user');
                                res.redirect('/profile/'+userid);
                            }
                        });
                        //res.redirect('/checkoutPage/'+userid)

                    }
                    else{console.log('cannot add more copies');
                        req.flash('Error', 'Cannot add more copies');
                        res.redirect('/profile/'+userid);}


                    if((rows[0].availableCopy <10 && rows[0].userType=="premium" && rows[0].checkedOutCopy!=0) )
                    {
                        connection.query('update user set checkedOutCopy=checkedOutCopy-1 ,availableCopy=availableCopy+1 where userId="'+userid+'"', function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on user '+err);}
                            console.log('user avail + 1');
                        });
                        connection.query('update movies set userId=NULL where id='+movieid, function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on movies'+err);}
                            console.log('userid set null');
                        });
                        connection.query('update user_movie set returnDate=date_format(curdate(),"%Y-%m-%d") where userId="'+userid+'" and movieId='+movieid+'', function(err, rows, fields) {
                            if(err){console.log('unsuccessful update on user_movie'+err);}
                            console.log('userid set null');
                        });
                        connection.query('SELECT * FROM user_movie join movies on movies.id = user_movie.movieId join user on user_movie.userId=user.userId where user_movie.userId="'+userid+'" and returnDate=date_format(curdate(),"%Y-%m-%d")', function(err, joins, fields) {
                            //console.log('SELECT * FROM user join movies on movies.userId = user.userId where user.userId="'+userid+'"');
                            if (err) {console.log('unsuccessful select on join '+err);}
                            if(joins.length!=0){
                                res.render('returnContinue.ejs', {joins: joins});
                            }
                            else{console.log('no movie to return');}
                        });
                    }
                    else{console.log('cannot add more copies');}


                });
            }
            else{
                req.flash('no movies are issued');


            }
        });
    });

    app.get('/returnMovie/:uid/:name', isLoggedIn, function (req, res) {
        var array = {id:req.params.uid, firstName:req.params.name};
        connection.query('select * from user_movie um join movies m on um.movieId=m.id where returnDate is  NULL and issueDate is not Null', function(err, rows, fields) {
            if(err){console.log('unsuccessful select');}
            if(rows.length!=0){
                res.render('returnMovie.ejs', {user: array, searchres: rows});
            }
            else{console.log('no movie checked out');
                req.flash('Error', 'No movies have been issued to this user');
                res.redirect('/profile/'+req.params.uid);
            }
        });


    });
    // Remove movie from the cart before checking out

    app.get('/removeMovie/:mid/:id/:ukey', isLoggedIn, function (req, res) {
        var userid=req.params.id;
        connection.query('delete from user_movie where movieId='+req.params.mid+' and uniquekey='+req.params.ukey, function(err, rows, fields) {
            if(err){console.log('unsuccessful delete');}

        });
        connection.query('update movies set userId=null where id='+req.params.mid+'', function(err, rows, fields) {
            if(err){console.log('unsuccessful update after delete');}

        });

        connection.query('update user set availableCopy=availableCopy+1 where userId="'+req.params.id+'"', function(err, rows, fields) {
            if(err){console.log('unsuccessful update after delete');}

        });
        connection.query('select RentAmount from movies where id='+req.params.mid+'', function(err, rows, fields) {
            var bal=rows[0].RentAmount;

            connection.query('update user set balance=balance-'+bal+' where userId="'+req.params.id+'"', function(err, rows, fields) {
                if(err){console.log('unsuccessful update after delete');}

            });
        });
        var pathName = '/profile/'+ userid;
        res.redirect(pathName);


    });


    app.post('/issueMovie/:uid/:mid', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM movies WHERE id = ' + req.params.id, function(err, movies, fields) {
            if (err) {};
            console.log('uid='+uid+'mid='+mid);

            //res.render('viewMoviePage.ejs', {movies: movies[0]});
        });

    });

//	Checking out the movies in the cart
    app.get('/pay/:uid', isLoggedIn, function (req, res) {
        connection.query('select sum(rent) as totalRent , count(movieId) as total from user_movie where userId="'+req.params.uid+'" and issueDate is NULL', function(err, rows, fields) {
            if (err) {console.log('unsuccessful select of sum of rent');}
            var bal=rows[0].totalRent;
            console.log(rows[0].totalRent);
            var moviesPurchased=rows[0].total;
            console.log(' balance + '+bal);
            connection.query('update user set checkedOutCopy=checkedOutCopy+'+moviesPurchased+' ,balance=balance-'+bal+' where userId="'+req.params.uid+'"', function(err, rows, fields) {
                if(err){console.log('unsuccessful update in checking out'+err);}

            });
            connection.query('update user_movie set issueDate=date_format(curdate(),"%Y-%m-%d") , inCart=false where userId="'+req.params.uid+'"', function(err, movies, fields) {
                if (err) {};
            });
            connection.query('select * from user_movie join movies on user_movie.movieId=movies.id join user on user.userId=user_movie.userId where user_movie.userId="'+req.params.uid+'" and issueDate=date_format(curdate(),"%Y-%m-%d")', function(err, info, fields) {
                if (err) {};
                if(info.length!=0)
                {
                    res.render('finalPage.ejs', {info:info});
                }
                else {console.log('no movie matched');}
            });
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
                        connection.query('insert into user_movie(userId,movieId,rent,returnDate,issueDate,inCart) values("' +
                            req.params.uid+ '",'+req.params.mid+','+rows[0].RentAmount+',NULL,NULL,true)', function(err, rows, fields) {
                            if(err){console.log('unsuccessful insert');}
                        });
                        rent=rows[0].RentAmount;
                        console.log('Avail < 0 so rent '+rows[0].RentAmount);
                        connection.query('update user set  availableCopy=availableCopy-1 , balance=balance+'+rent+' where userId="'+req.params.uid+'"', function(err, rows, fields) {
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
                    req.flash('Error', 'Cannot rent - User has reached his limit');
                    res.redirect('/profile/'+userid);

                }

                var pathName = '/checkoutPage/'+ userid;
                res.redirect(pathName);
            }
            else{console.log('no movie was searched');}
        });



    });



    app.get('/checkoutPage/:id', isLoggedIn, function (req, res) {

        connection.query('select * from user_movie join user join movies where user_movie.movieId=movies.id and user.userId="'+req.params.id+'" and returnDate is NULL and issueDate is  null and inCart=true;', function(err, joins, fields) {

            if (err) {};
            if(joins.length!=0){
                res.render('checkoutPage.ejs', {joins: joins,message: req.flash('Error')});
            }
            else{console.log('no movies in the cart');
                req.flash('Error', 'No movies in the cart');
                res.redirect('/profile/'+req.params.id);
                // res.render('profile.ejs');}
            }
        });

    });

    app.get('/checkout/:id', isLoggedIn, function (req, res) {

        connection.query('select * from user_movie join user join movies where user_movie.movieId=movies.id and user.userId="'+req.params.id+'" and user_movie.returnDate is NULL',function(err,joins){
            if (err) {};
            res.render('generateBill.ejs', {joins: joins});

        });

    });

    app.get('/issue/:id', isLoggedIn, function (req, res) {
        connection.query('SELECT * FROM user WHERE userId = "' + req.params.id + '"', function(err, user, fields) {
            if (err) {};
            if(user[0].availableCopy==0){
                req.flash('Error', 'Cannot rent - User has reached his limit');
                res.redirect('/profile/'+req.params.id);
            }
            //console.log('SELECT * FROM user WHERE userId = "' + req.params.id + '"');
            res.render('issueMovie.ejs', {
                user: user[0], searchres: '',message:req.flash('Error')
            });

        });

    });
    app.post('/issueSearch/:id/:name', isLoggedIn, function (req, res) {
        var qry= 'SELECT * from movies WHERE ' + req.param('searchparam') + ' = ' + req.param('str')+' and AvailableCopies > 0';
        if(req.param('searchparam')=='MovieName' || req.param('searchparam')=='MovieBanner' || req.param('searchparam')=='category'){qry='SELECT * from movies WHERE ' + req.param('searchparam') + ' like "%' + req.param('str')+'%" and AvailableCopies > 0';}
        var array = {id:req.params.id, firstName:req.params.name}
        //console.log(array);
        connection.query(qry, function(err, movies, fields) {
            if (err) {
            };
            if(movies.length!=0){
                res.render('issueMovie.ejs', {
                    user: array, searchres: movies, message:req.flash('Error')
                });
            }
            else{console.log('no movie was searched');
                req.flash('Error', 'No movie found');
                res.render('issueMovie.ejs', {
                    user: array, searchres: '', message:req.flash('Error')
                });
            }
        });

    });
    app.get('/issueSearch/:id/:name', isLoggedIn, function (req, res) {
        res.redirect('/issueSearch/'+req.params.id+'/'+req.params.name);
    });
    //********************************************************************************************

//	********************************************************************************************
//	Movie Management
//	********************************************************************************************

    // create movie
    app.get('/createMovie', isLoggedIn, function (req, res) {
        res.render('createMovie.ejs',{message: req.flash('movieDuplicate')}); // load the createMovie.ejs file
    });
    app.post('/createMovie', isLoggedIn, function (req, res) {

        connection.query('SELECT * from movies WHERE MovieName = "' + req.param('movie_name')+'" and MovieBanner="'+req.param('banner')+'"', function(err, rows, fields) {
            if (err) {
            };
            if(rows.length != 0){
                //console.log('SELECT * from user WHERE email = "' + req.param('email')+'"');
                console.log(rows);
                //flash the message
                req.flash('movieDuplicate', 'That movie exists already.');

                res.render('createMovie.ejs', { message: req.flash('movieDuplicate') });

            }else{




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
            }
        });
    });

//	***************************************************************

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

        var cachedMovies = movieCache.getAll();
        if (cachedMovies == null) {
            console.log("cache miss, read movie info from DB");
            var low=0;
            low=(req.params.cnt * 20) - 20;

            connection.query('SELECT * from movies limit '+low+', 20', function(err, movies, fields) {
                console.log('low='+low);
                //GLOBAL.count=GLOBAL.count+1;
                for (i=0; i < movies.length; i++) {
                    movieCache.set(i, movies[i])
                }
                res.render('movie.ejs', {
                    movies: movies ,cnt: req.params.cnt
                });
            });
        } else {
            console.log("cache hit, return movie info from cache");
            res.render('movie.ejs', {
                movies: cachedMovies, cnt: req.params.cnt
            });
        }

//        var low=0;
//        low=(req.params.cnt * 20) - 20;
//        connection.query('SELECT * from movies limit '+low+', 20', function(err, movies, fields) {
//            console.log('low='+low);
//            //GLOBAL.count=GLOBAL.count+1;
//            res.render('movie.ejs', {movies: movies ,cnt: req.params.cnt});
//        });
    });


    app.post('/movieall', isLoggedIn, function (req, res) {
        res.redirect('/movieall');

    });

//	*******************************************

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
                req.flash('Error', 'No movie found');
                res.render('searchMovie.ejs', {
                    movies: movies, message:req.flash('Error')
                });
            }else{

                console.log("in post");
                res.render('searchMovie.ejs', {
                    movies: movies,message:req.flash('Error')
                });
            };
        });


    });
    app.get('/searchMovie', function(req, res) {
        console.log("in get");

        connection.query('SELECT * from movies limit 10', function(err, movies, fields) {

            res.render('searchMovie.ejs', {
                movies: movies, message:req.flash('Error')
            });
        });


    });

    app.get('/seeUsers/:id', isLoggedIn, function (req, res) {

        connection.query('select * from user_movie join user join movies where user_movie.movieId=movies.id and movies.id=' + req.params.id+' and issueDate is not null', function(err, users, fields) {
            if (err) {};
            if(users.length!=0)
            {
                res.render('seeUserPage.ejs', {users: users});
            }
            else{console.log('no users');
                req.flash('Error', 'No users have issued this movie');
                res.redirect('/viewMoviePage/'+req.params.id);
            }
        });

    });

    app.get('/seeMovies/:id', isLoggedIn, function (req, res) {

        connection.query('select * from user_movie join user join movies where user_movie.movieId=movies.id and user.userId="' + req.params.id+'" and issueDate is not null and returnDate is NULL', function(err, movies, fields) {
            if (err) {};
            if(movies.length!=0)
            {
                res.render('seeMoviesPage.ejs', {movies: movies,user:req.params.id});
            }
            else{console.log('no movies');
                req.flash('Error', 'No movies have been issued to this user');
                res.redirect('/profile/'+req.params.id);
                //return done(null, false, req.flash('message', 'no movies'));
            }
        });

    });



    //view individual movie
    app.get('/viewMoviePage/:id', isLoggedIn, function (req, res) {

        connection.query('SELECT * FROM movies WHERE id = ' + req.params.id, function(err, movies, fields) {
            if (err) {};
            res.render('viewMoviePage.ejs', {movies: movies[0],message:req.flash('Error')});

        });

    });
//	***************************************************************
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


//	***************************************************************    



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
    var a;
    var b;
    var c;
    var d;
    var e;
    app.get('/dashboard',isLoggedIn, function (req, res) {
        connection.query('select count(*) as cnt from movies', function(err, rows1, fields) {
            a=rows1[0].cnt;
            connection.query('select count(*) as cnt from user', function(err, rows2, fields) {
                b=rows2[0].cnt;
                connection.query('select count(*) as cnt from movies where AvailableCopies=0', function(err, rows3, fields) {
                    c=rows3[0].cnt;
                    connection.query('select count(*) as cnt from movies where AvailableCopies>0', function(err, rows4, fields) {
                        d=rows4[0].cnt;
                        connection.query('select MovieName, count(*) as cnt from user_movie join movies where movieId=id group by MovieName order by 2 desc limit 5;', function(err, rows5, fields) {
                            e=rows5;
                            if(!err){console.log('Dashboard Updated',a,b,c,d);}
                            res.render('MovieHome.ejs', { message: req.flash('loginMessage'),a: a, b: b, c: c, d: d, e: e });
                        });
                    });
                });
            });
        });
        // render the page and pass in any flash data if it exists
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile-view-only', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/adminlogin', passport.authenticate('local-login',{

        successRedirect: '/dashboard', // redirect to the secure profile section
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

//route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


