var auth = require(__dirname + '/auth');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'demo2' });
//var popup = require('popups');
//var url = require('url');
//var stringify = require('json-stringify');
// var idList = [];

exports.init = function(app, Config) {

    // Two test requests to make sure the api works 
    app.get('/api/ping', function(req, res) {
        res.json({
            'pong': true
        });
    });
    app.post('/api/ping', function(req, res) {
        res.json({
            'pong': req.body
        });
    });

    // User API 


    if (Config.registration) {
        app.post('/api/users', function(req, res) {
            var username=req.body.username;
            var email=req.body.email;
            var password=req.body.password;
            var query_count="SELECT count(*) from users where username ="+"'"+username+"'"+"AND email = "+"'"+email+"'";
            client.execute(query,function(err,result){
                if(err)
                {
                    console.log("There was a problem while counting the number of users");
                    return res.json({
                        'error':'could not hash the existing password'

                    },500);
                }
                if(result>=1)
                {
                    console.log("A user with the given details already exists");
                    return res.json({
                        'error':'User already exists'
                    },500);
                }
                bcrypt.hash(password, null, null, function(err, hash) {
                    if (err) {
                        console.log('There was an error while hashing the password: ' + err);
                        return res.json({
                            'error': 'Couldn\'t hash the password'
                        }, 500);
                    }
                     password = hash;
                     var query_insert="INSERT INTO users (username,email,password) VALUES"+"("+"'"+username+"'"+","+"'"+email+"'"+","+"'"+password+"'"+")";
                     client.execute(query_insert,function(err,result)
                     {
                        if(err)
                        {
                            console.log("Error while saving to the database");
                            return res.json({
                                'error':'could not store the user to the database'
                            },500);
                        }
                        else
                        {
                            console.log("User details successfully stored in the database");
                            return res.json({
                                'successful':true
                            });
                        }
                     });

                });

          });
        });
    }
   
    app.post('/api/template',auth.authenticate, function(req, res) {

       var username=req.query.username;
       var eventname=req.body.eventname;
       var query_user="SELECT * from users where username = "+"'"+username+"'";
       client.execute(query_user,function(err,result)
       {
          if(err)
          {
            console.log("There was an error while loading the data from the database");
            return res.json({
                'error':'could not load users'

            },500);
          }
          return res.json({
            'user':user
          });

       });
       var query_event="SELECT count(*) from events where eventname = "+"'"+eventname+"'";
       client.execute(query_event,function(err,result)
       {
           if(err)
           {
             console.log("There was an error while counting the events");
             return res.json({
                'error':'could not count the event list'
             },500);
           }
           if(result>=1)
           {
             console.log("Topic already exists in the database");
             return res.json({
                'error':'topic already exists';
             },500);
           }

           var restricted: req.body.restricted;
           var parent_id: req.body.parent_id;
           var parent_name: req.body.parent_name;
           var event_message: req.body.event_message;
           var event_fields: req.body.event_fields;
           var topic_definition: req.body.topic_definition;
           var topic_description: req.body.topic_description;
           var createdby: req.session.username;
           var createdon: req.body.createdon;
           var follow: req.body.follow;

           var insert_events="INSERT INTO events(event_message,createdby,createdon,event_fields,eventname,follow,parent_id,parent_name,restricted)values("+"'"+event_message+"'","'"+createdby+"'"+","+createdon+","+"'"+event_fields+"'"+","+"'"+eventname+"'"+","+follow+","+parent_id+","+"'"+parent_name+"'"+","+"'"+restricted+"'"+")";
           client.execute(insert_events,function(err,result){
            if(err)
            {
                console.log("There was some problem while inserting the events");
                return res.json({
                    'error':'Problem in inserting the events'
                },500);

            }
            else
            {
                console.log("A new event was created with name = "+event_name);
                return res.json({
                    'successful':true
                });
            }

           });

       });
            
    });
    
        app.post('/api/usertweets/saveflag', function(req, res) {

        console.log("save Flag::" + req.body._id);

        //-------------------
        //checking already tweet flag entry is available
            var tweet_id= req.body._id;
            var username= req.session.username;
            var tweet_flag='N';

            var query_user_tweets="SELECT * from usertweets where tweet_id = "+tweet_id+"AND username = "+"'"+username+"'"+"AND tweet_flag = "+tweet_flag;
            client.execute(query_user_tweets,function(err,result){
                if(err)
                {
                    console.log("There was a problem while loading the data from the database");
                    return res.json({
                        'error':'Could not load tweet data'

                    },500);
                }
                if(!result)
                {

                var currentDate = new Date();
                tweet_flag= 'Y';
                createdby= req.session.username;
                createdon= currentDate;

                
                var insert_user_tweets="INSERT INTO usertweets(tweet_id,createdby,createdon,tweet_flag,username)VALUES("+tweet_id+","+"'"+createdby+"'"+","+createdon+","+tweet_flag+","+"'"+username+"'"+")";
                client.execute(insert_user_tweets,function(err,result){
                    if(err)
                    {
                        console.log("There was an error while storing the tweets");
                        return res.json({
                            'error':'Error while storing tweets'
                        });
                    }
                    else
                    {
                        console.log("The tweet has been inserted into the database");
                        return res.json({
                           'successful':true
                        });
                    }

                });
            }

             else 
             {
                //update old entry
                var query_update="Update usertweets SET tweet_flag = "+'Y'+"WHERE tweet_id = "+tweet_id+"AND username ="+"'"+username+"'";
                client.execute(query_update,function(err,result){
                    if(err)
                    {
                        console.log("There was an error while updating the tweets");
                        return res.json({
                            'error':'usertweets update failed'

                        },500);
                    }
                    else
                    {
                        console.log("successfully updated user tweets");
                        return res.json({
                          'successful':true
                        });
                    }

                });
            }

        });
    });

    app.post('/api/usertweets/deleteflag', function(req, res) {

        console.log("delete Flag tweet id::::" + req.body._id);

        var UserTweetFlag = mongoose.model('UserTweetFlag');

        UserTweetFlag.update(
		    {
                'tweet_id': req.body._id,
                'username': req.session.username
            },

			{
                '$set': {
                    'tweet_flag': 'N'
                }
            },
		 function(err, numberAffected, raw) {
                if (err) {
                    console.log('Couldn\'t update userTweetFlag');
                    return res.json({
                        'error': 'Couldn\'t update userTweetFlag'
                    }, 500);
                }

                return res.json({
                    'successful': true
                });
            });

    });
    app.get('/api/users/:username', auth.authenticate, function(req, res) {
        var User = mongoose.model('User');
        User.findOne({
            'username': req.params.username
        }, function(err, user) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }
            if (!user) {
                console.log('No user with this username was not found1');
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 404);
            }

            res.json({
                'user': user
            });
        });
    });

    // app.get('/api/users/:username', auth.authenticate, function(req, res) {
    //     var User = mongoose.model('User');
    //     User.findOne({
    //         'username': req.params.username
    //     }, function(err, user) {
    //         if (err) {
    //             console.log('There was an error while loading data from the database: ', err);
    //             return res.json({
    //                 'error': 'Couldn\'t load user'
    //             }, 500);
    //         }
    //         if (!user) {
    //             console.log('No user with this username was not found1');
    //             return res.json({
    //                 'error': 'Couldn\'t load user'
    //             }, 404);
    //         }

    //         res.json({
    //             'user': user
    //         });
    //     });
    // });



    // Tweet API
    app.get('/api/event/:eventname/tweets/:skip/:limit', auth.authenticate, function(req, res) {

        var Tweet = mongoose.model('Tweet');
        var Events = mongoose.model("Event");
        console.log(Events+"---events");
        //TODO add filter functions
        /*	Tweet.find({'author.username': req.params.username}, null, {'sort': {'timestamp': -1}},{'skip':req.params.skip},{'limit':req.params.limit}, function(err, tweets) {
        		if(err) {
        			console.log('There was an error while loading data from the database: ', err);
        			return res.json({'error': 'Couldn\'t load tweets for the user'}, 500);
        		}
        		res.json({'tweets': tweets});
        	});*/
        //.find({"author.username":"EmployeeJoining"}).sort({"_id":1}).limit(5);

        Tweet.find({
            "author.eventname": req.params.eventname
        }).sort({
            'timestamp':
                -1
        }).skip(req.params.skip).limit(req.params.limit).exec(function(err, tweets) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load tweets for the user dashboard'
                }, 500);
            }

            res.json({
                'tweets': tweets
            });
        });

    });
    // var promise = $http.get('/api/users/:username/:searchCriteriaData/:dashboard/:skip/:limit',auth.authenticate);
    // promise.then(
    //     function(payload) {
    //       $scope.movieContent = payload.data;
    //     });
    app.get('/api/users/:username/:searchCriteriaData/:displaytweet/:dashboard/:skip/:limit', auth.authenticate, function(req, res) {

        var idList = [];
        var searchCriteriaData = req.params.searchCriteriaData;

		console.log("username::"+username);

		console.log("displaytweet in API call::"+req.params.displaytweet);


        var conditionArray = [];
        if (searchCriteriaData == 'undefined') {} else {
            searchCriteriaData = JSON.parse(searchCriteriaData);
            for (var i = 0; i < searchCriteriaData.length; i++) {
                console.log("colName::" + "author." + searchCriteriaData[i].key + ":" + searchCriteriaData[i].value);
                var obj = {};
                obj[searchCriteriaData[i].colname] = searchCriteriaData[i].colvalue;
                conditionArray.push(obj);
            }
        }
        //  console.log("conditionArray::"+conditionArray);
        var User = mongoose.model('User');
        var Tweet = mongoose.model('Tweet');

        User.findOne({
            'username': req.user.username
        }, function(err, user) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            if (!user) {
                console.log('No user with this username where found');
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }


            for (var i = 0; i < user.following.length; i++) {
                if (user.following[i].eventname) {
                    console.log(user.following[i].eventname);
                    idList.push(user.following[i].eventname);
                }
            }
            var criteria = (searchCriteriaData == 'undefined' || searchCriteriaData == '') ? '' : {
                $and: conditionArray
            };
            //console.log("criteria::"+{$and:conditionArray});

            /*Tweet.find(criteria).where('author.eventname').in(idList).sort({
              'timestamp': -1
            }).skip(req.params.skip).limit(req.params.limit).exec(function(err, tweets) {
			  if (err) {
                    console.log('There was an error while loading data from the database: ', err);
                    return res.json({
                        'error': 'Couldn\'t load tweets for the user dashboard'
                    }, 500);
                }

							for (var i = 0; i < tweets.length; i++) {
					console.log(tweets[i].timestamp);
				}

				res.json({
                    'tweets': tweets
                });
            });*/



				  console.log("display all records");
               Tweet.aggregate([{
                    '$match': {
                        'author.eventname': {
                            '$in': idList
                        }
                    }
                },
                {
                    "$sort": {
                        'timestamp': -1
                    }
                },

                {
                    "$skip": parseInt(req.params.skip)
                },
                {
                    "$limit": parseInt(req.params.limit)
                },

                {
                    "$lookup": {
                        "from": 'usertweetflags',
                        "localField": '_id',
                        "foreignField": 'tweet_id',
                        "as": 'tweetDetails'
                    }
                },
							   {
        '$addFields': {
            'tweetDetails': {
                '$arrayElemAt': [
                    {
                        '$filter': {
                            input: '$tweetDetails',
                            as: 'tweetDetail',
                            'cond': {
                               '$eq': [ '$$tweetDetail.username', req.session.username ]
							 }
                        }
                    }, 0
                ]
            }
        }
    }]).exec(function(err, tweets) {
		          console.log("flag::"+ req.params.displaytweet +" tweet length"+tweets.length);
			    	if(req.params.displaytweet=='flagtweet' && tweets.length>0  ){
					     for(var i = tweets.length -1; i >= 0 ; i--){
							// console.log("test::"+tweets[i].tweetDetails.tweet_flag);
                          if(tweets[i].tweetDetails===undefined){
							  tweets.splice(i, 1);
						  }
							 else if(typeof tweets[i].tweetDetails !== "undefined" && tweets[i].tweetDetails.tweet_flag=='N'){
							    tweets.splice(i, 1);
						   }else{

						   }
				    }
					}
			    if (err) {
                    console.log('There was an error while loading data from the database: ', err);
                    return res.json({
                        'error': 'Couldn\'t load tweets for the user dashboard'
                    }, 500);
                }
                res.json(   {
                             'tweets': tweets
                           }
				);
               });
		 });
    });

    app.post('/api/users/:username/tweets', auth.authenticate, function(req, res) {
        if (req.params.username !== req.user.username) {
            return res.json({
                'error': 'You are not allowed to tweet as another user'
            }, 403);
        }

        //TODO validation
        var Tweet = mongoose.model('Tweet');
        var tweet = new Tweet({
            'author': {
                'eventId': req.event.id,
                'eventname': req.event.eventname
            },
            'message': req.body.message
        });
        tweet.save(function(err) {
            if (err) {
                console.log('There was an error while storing the tweet to the database: ' + err);
                return res.json({
                    'error': 'Couldn\'t store the tweet'
                }, 500);
            } else {
                console.log('A new tweet was created with the id ' + tweet.id);
                return res.json({
                    'tweet': tweet
                });
            }
        });
    });


    app.post('/api/postComment/commentVal', function(req, res) {

        //TODO validation
        var Comment = mongoose.model('Comment');
        var comment = new Comment({
            'emp_id': req.body.emp_id,
            'commentVal': req.body.commentVal
        });
        comment.save(function(err) {
            if (err) {
                console.log('There was an error while storing the comment to the database: ' + err);
                return res.json({
                    'error': 'Couldn\'t store the tweet'
                }, 500);
            } else {
                console.log('A new comment was created with the id ' + comment.id);
                return res.json({
                    'comment': comment
                });
            }
        });
    });


    //// EVENT API
    app.get('/api/events', auth.authenticate, function(req, res) {
        var User = mongoose.model('User');
        var Event = mongoose.model('Event');

        var username = req.query.username;

        //if user is admin.so able to access restrcied status with restrict as well as normal.
        User.findOne({
            'username': username
        }, function(err, user) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            if (!user) {
                console.log('No user with this username was not found2');
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            var followerMap = {};
            for (var i = 0; i < user.following.length; i++) {
                followerMap[user.following[i].eventname] = 1;
            }

            var userRole = username == "admin" ? {} : {
                'restricted': 'N'
            };
            console.log("userRole::" + JSON.stringify(userRole));
            //if user is admin,then able to access Normal as well as restricted  events.
            //if user is not admin or normal user,then access only normal events.
            Event.find(userRole, {
                'eventname': 1,
                'createdon': 1,
                'follow': 1,
                'parent_id':1,
                'parent_name':1,
                'event_message':1,
                'event_fields':1,
                'createdby': 1,
                'topic_definition':1,
                'topic_description':1
            }, {
                'sort': {
                    'eventname': 1,
                    'createdon': 1,
                    'follow': 1
                }
            }, function(err, events) {
                if (err) {
                    console.log('There was an error while loading data from the database: ', err);
                    return res.json({
                        'error': 'Couldn\'t load user'
                    }, 500);
                }

                for (var i = 0; i < events.length; i++) {
                    if (events[i].eventname in followerMap) {
                        events[i]['follow'] = true;
                    } else {
                        events[i]['follow'] = false;
                    }
                    events[i] = events[i].toObject({
                        virtuals: false
                    });
                }
                res.json({
                    'events': events
                });
            });
        });
    });

    app.post('/api/events/:eventname', auth.authenticate, function(req, res) {
        console.log("-----------------" + event);

        var Event = mongoose.model('Event');
        Event.findOne({
            'eventname': eventname
        }, function(err, event) {

            if (err) {
                console.log('There was an error while fetching event from database: ' + err);
                return res.json({
                    'error': 'Couldn\'t load event'
                }, 500);
            } else {
                console.log('event found ' + event.id);
                return res.json({
                    'event': event
                });
            }
        });
    });

    app.get('/api/events/followings', auth.authenticate, function(req, res) {

        var User = mongoose.model('User');
        var username = req.query.username;

        User.findOne({
            'username': username
        },
        function(err, user) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }
            if (!user) {
                console.log('No user with this username was not found4');
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            return res.json({
                'user': user
            });
        });
    });

    app.put('/api/events/:eventname/follow', auth.authenticate, function(req, res) {

        var User = mongoose.model('User');

        User.findOne({
                'username': req.body.username
            }, {
                'id': 1,
                'username': 1,
                'name': 1
            },
            function(err, user) {
                if (err) {
                    console.log('There was an error while loading data from the database: ', err);
                    return res.json({
                        'error': 'Couldn\'t load user'
                    }, 500);
                }
                if (!user) {
                    console.log('No user with this username was not found3');
                    return res.json({
                        'error': 'Couldn\'t load user'
                    }, 500);
                }

                // User.find(
                //     {
                //         '_id': req.user.id
                // }, {
                //     following: {
                //         $elemMatch: {
                //             "eventname": req.body.following.parent_name
                //         }
                //     },
                //     function(err, numberAffected, raw) {

                //     if (err) {
                //         console.log('Couldn\'t save user');
                //         return res.json({
                //             'error': 'Couldn\'t save user'
                //         }, 500);
                //     }
                //     console.log('The user with id ' + req.user.id + ' follow now the event with id ' + following.parent_name);
                //     return res.json({
                //         'successful': true
                //     });
                //     }
                // });

                User.update({
                    '_id': req.user.id
                }, {
                    '$push': {
                        following: {
                            'eventId': req.body.following._id,
                            'eventname': req.body.following.parent_name
                        }
                    }
                }, function(err, numberAffected, raw) {
                    if (err) {
                        console.log('Couldn\'t save user');
                        return res.json({
                            'error': 'Couldn\'t save user'
                        }, 500);
                    }

                    //console.log('The user with id ' + req.user.id + ' follow now the event with id ');
                    return res.json({
                        'successful': true
                    });
                });
            });
    });
    var get_total_num_docs = function(db_client, query, cb) {
        db_client.collection(query['collection'], function(e, coll) {
            coll.find(query.params, query.options).count(function(e, count) {
                console.log(count);
                return cb(e, count);
            });
        });
    };
    app.put('/api/events/:eventname/unfollow', auth.authenticate, function(req, res) {
        var User = mongoose.model('User');
        var Event = mongoose.model('Event');

        User.findOne({
            'username': req.body.username
        }, {}, {
            'id': 1,
            'username': 1,
            'name': 1
        }, function(err, following) {

            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }
            if (!following) {
                console.log('No user with this username was not found4');
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            User.update({
                    '_id': req.user.id
                }, {
                    '$pull': {
                        following: {
                            'eventname': req.body.following.eventname,
                            'follow':req.body.following.follow
                        }
                    }
                },
                function(err, numberAffected, raw) {
                    if (err) {
                        console.log('Couldn\'t save user');
                        return res.json({
                            'error': 'Couldn\'t save user'
                        }, 500);
                    }

                    console.log('The user with id ' + req.user.id + ' unfollowed the event with id ' + following.id);
                    return res.json({
                        'successful': true
                    });
                });

            Event.update({
              '_id': req.body.following._id
            },{
                '$push': {
                    'follow': req.body.following.follow
                }
            }, function (err, result){
                if (err) {
                    console.log('Couldn\'t save user');
                    return res.json({
                        'error': 'Couldn\'t save user'
                    }, 500);
                }

                return res.json({
                    'successful': true
                });
            });

        });
    });

    app.post('/api/saverecentsearch', function(req, res) {
        console.log(req.body);
        var RecentSearch = mongoose.model('RecentSearch');
        RecentSearch.findOne({
            'emp_id': req.body.emp_id
        }, function(err, recentSearch) {
            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load tweet flag data'
                }, 500);
            }

			console.log("test::"+JSON.stringify(recentSearch));
            if (!recentSearch) {
                //new entry
                var currentDate = new Date();
                var recentSearch = new RecentSearch({
                    'emp_id': req.body.emp_id,
                    'description': req.body.description,
                    'date_time': req.body.date_time,
                    'sequence': req.body.sequence

                });

                recentSearch.save(function(err) {
                    if (err) {
                        console.log('There was an error while storing the flag tweet to the database: ' + err);
                        return res.json({
                            'error': 'Couldn\'t store the event'
                        }, 500);
                    } else {
                        return res.json({
                            'successful': true
                        });
                    }
                });
            } else {
                 RecentSearch.find({
                            'emp_id': req.body.emp_id
                        }, function(err, recentSearch) {
                            // $scope.descriptionArr = recentSearch[0].description;
                            if(recentSearch[0].description.length < 3) {
                            RecentSearch.update( { 'emp_id': req.body.emp_id },
                            { "$push": { "description":  req.body.description } },
                            function(err, numberAffected, raw) {
                                if (err) {
                                    console.log('Couldn\'t update userTweetFlag');
                                    return res.json({
                                        'error': 'Couldn\'t update userTweetFlag'
                                    }, 500);
                                }
                        return res.json({
                            'successful': true
                        });
                    });
                    }
                    else {
                        RecentSearch.update( { 'emp_id': req.body.emp_id },
                        { "$push": { "description":  req.body.description } },
                        function(err, numberAffected, raw) {
                            RecentSearch.update( { 'emp_id': req.body.emp_id },
                                { $pop: { description: -1 } },
                                function(err, numberAffected, raw) {
                                    if (err) {
                                        console.log('Couldn\'t update userTweetFlag');
                                        return res.json({
                                            'error': 'Couldn\'t update userTweetFlag'
                                        }, 500);
                                    }
                                    return res.json({
                                        'successful': true
                                    });
                                });
                            if (err) {
                                console.log('Couldn\'t update userTweetFlag');
                                return res.json({
                                    'error': 'Couldn\'t update userTweetFlag'
                                }, 500);
                            }
                    return res.json({
                        'recentSearch': recentSearch
                    });
                });
                    }
                });
            }
        });
    });

    app.get('/api/recentSearches', auth.authenticate, function(req, res) {
        var RecentSearch = mongoose.model('RecentSearch');
        RecentSearch.find({},
        function(err, recentSearcheData) {
            if (err) {
                console.log('There was an error while storing the flag tweet to the Database: ' + err);
                return res.json({
                    'error': 'Couldn\'t store the event'
                }, 500);
            }

            for(var i = 0 ;i < recentSearcheData.length; i++){
                if(recentSearcheData[i].emp_id === req.query.username){
                    recentSearcheData = recentSearcheData[i];
                }
            }

            return res.json({
                'res': recentSearcheData
            });
        });
    });

    /*get search List api */
    app.get('/api/searchList', auth.authenticate, function(req, res) {

        var User = mongoose.model('User');
        var Event = mongoose.model('Event');
        var username = req.query.username;

        //if user is admin.so able to access restrcied status with restrict as well as normal.
        User.findOne({
            'username': username
        }, function(err, user) {
            Event.aggregate([
                { $sort: { "createdon": -1} },
                { $group : {
                    "_id": "$parent_id",
                    "parent_name": {"$first": "$parent_name"},
                    search_list : { $push: "$$ROOT"}
                    }
                },
                { $project: {
                    parent_id : "$_id",
                    parent_name: 1,
                    search_list:1,
                    lastUpdated: {
                      $let: {
                        vars: {
                          firstUser: {
                            $arrayElemAt: ["$search_list", 0]
                          }
                        },
                        in: {
                          createdon: "$$firstUser.createdon"
                        }
                      }
                    }/*,
                     follow: {
                      $let: {
                        vars: {
                          firstUser: {
                            $arrayElemAt: ["$search_list", 0]
                          }
                        },
                        in: {
                          follow: "$$firstUser.follow"
                        }
                      }
                    }*/
                }}
            ], function(err, list){
                if (err) {
                    console.log('There was an error while storing the flag tweet to the database: ' + err);
                    return res.json({
                        'error': 'Couldn\'t store the event'
                    }, 500);
                }

                res.json({
                    'searchList': list
                });
            });
        })
    });

    /* Source system api Start */
    app.get('/api/source', auth.authenticate, function(req, res) {
        var User = mongoose.model('User');
        var Tweet = mongoose.model('Tweet');

        User.findOne({
            'username': username
        }, function(err, user) {
            Tweet.aggregate([
                {$group: {
                    '_id':"$author.sourceSystem",
                    count:{$sum:1}
                    }
                },
                { $project: {
                    'sourceSystem':"$_id",
                    count:1
                    }
                }
            ],function(err, source){
                if (err) {
                    console.log('There was an error while storing the flag tweet to the database: ' + err);
                    return res.json({
                        'error': 'Couldn\'t store the event'
                    }, 500);
                }

                res.json({
                    'source': source
                });
            });
        });
    })
    /* Source system api End */

    /* Get Subscribed List Api Start */
    app.get('/api/subscribedList', auth.authenticate, function(req, res) {

        var User = mongoose.model('User');
        var Event = mongoose.model('Event');
        var username = req.query.username;

        User.findOne({
            'username': username
        }, function(err, user) {
            Event.aggregate([
                { $sort: { "createdon": -1} },
                { $group : {
                    "_id": "$parent_id",
                    "parent_name": {"$first": "$parent_name"},
                    "follow": {"$first": "$follow"},
                    subscribed_list : { $push: "$$ROOT"}
                    }
                },
                { $project: {
                    parent_id : "$_id",
                    parent_name: 1,
                    follow:"$follow",
                    subscribed_list:1,
                    lastUpdated: {
                      $let: {
                        vars: {
                          firstUser: {
                            $arrayElemAt: ["$subscribed_list", 0]
                          }
                        },
                        in: {
                          createdon: "$$firstUser.createdon"
                        }
                      }
                    }
                }}
            ], function(err, subscribedList){
                if (err) {
                    console.log('There was an error while storing the flag tweet to the database: ' + err);
                    return res.json({
                        'error': 'Couldn\'t store the event'
                    }, 500);
                }

                res.json({
                    'subscribedList': subscribedList
                });
            });
        })
    });

    /*Get Subscribed List Api End */
    /* topic follow start*/
    app.put('/api/events/:eventname/topicFollow', auth.authenticate, function(req, res) {

        var User = mongoose.model('User');
        var Event = mongoose.model('Event');

        User.findOne({
                'username': req.body.username
            }, {
                'id': 1,
                'username': 1,
                'name': 1
            },
            function(err, following) {
                if (err) {
                    console.log('There was an error while loading data from the database: ', err);
                    return res.json({
                        'error': 'Couldn\'t load user'
                    }, 500);
                }

                Event.update(
                    {
                        '_id': req.body.following._id
                    },
                    {
                        $set: {
                            'follow': req.body.following.follow
                        }
                    }, function(err, event) {
                        if (err) {
                            console.log('Couldn\'t save user');
                            return res.json({
                                'error': 'Couldn\'t save user'
                            }, 500);
                        }
                        return res.json({
                            'successful': true
                    });
                })
            });
    });
    /*topic follow end*/

    /* topic unfollow start*/
    app.put('/api/events/:eventname/topicUnfollow', auth.authenticate, function(req, res) {
        var User = mongoose.model('User');
        var Event = mongoose.model('Event');

        User.findOne({
            'username': req.body.username
        }, {
            'id': 1,
            'username': 1,
            'name': 1
        }, function(err, following) {

            if (err) {
                console.log('There was an error while loading data from the database: ', err);
                return res.json({
                    'error': 'Couldn\'t load user'
                }, 500);
            }

            Event.update({
                    '_id': req.body.following._id
                },
                {
                    $set: {
                        'follow': req.body.following.follow
                    }
                }, function(err, event) {
                    if (err) {
                        console.log('Couldn\'t save user');
                        return res.json({
                            'error': 'Couldn\'t save user'
                        }, 500);
                    }
                    return res.json({
                        'successful': true
                });
            })

        });
    });
    /* topic unfollow end*/
};
