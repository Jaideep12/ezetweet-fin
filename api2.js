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
        var query_delete="UPDATE usertweets SET tweet_flag = "+'N'+"WHERE tweet_id="+req.body._id+"AND username = "+"'"+req.session.username+"'";
        client.execute(query_delete,function(err,result){
            if(err)
            {
                console.log("Error while deleting the user tweets");
                return res.json({
                    'error':'Error in deleting error user tweets'
                },500);
            }
            else
            {
                return res.json({
                    'successful':true
                });

            }
        });

    });
    app.get('/api/users/:username', auth.authenticate, function(req, res) {
        var username=req.params.username;
        var query="SELECT * from users where username = "+"'"+username+"'";
        client.execute(query,function(err,result){
            if(err)
            {
                console.log("Error while loading user data");
                return res.json({
                    'error':'Could not load user data'
                },500);
            }
                    res.json({
                    'user':result
                });

        });

    });

    // Tweet API
    app.get('/api/event/:eventname/tweets/:skip/:limit', auth.authenticate, function(req, res) {
        var author_event=req.params.eventname;
        var limit=req.params.limit;
        var query_tweets="SELECT * from tweets where author.eventname="+"'"+author_event+"'"+"LIMIT "+limit;
        client.execute(query_tweets,function(err,result){
            if(err)
            {
                console.log("Error while fetching tweets");
                return res.json({
                    'error':'Error while fetching tweets from database'

                },500);
            }
            res.json({
                'tweets':result
            });
        });
    });
/*
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
           var username=req.user.username;
           var query="SELECT * from users where username = "+"'"+username+"'";
           client.execute(query,function(err,result){
            if(err)
            {
                console.log("There was an error while loading the data from the database");
                return res.json({
                    'error':'Could not fetch data from the users table'
                });
            }
            if(!user)
            {
                console.log("No such user is present in the database");
                return res.json({
                    'error':'User not present'
                });
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

            var limit=req.params.limit;
            var query="SELECT * from tweets where author.eventname IN"+islist+"LIMIT "+limit;


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
*/
    app.post('/api/users/:username/tweets', auth.authenticate, function(req, res) {
        var message=req.body.message;
        var eventId=req.event.id;
        var eventname=req.event.eventname;

        if (req.params.username !== req.user.username) {
            return res.json({
                'error': 'You are not allowed to tweet as another user'
            }, 403);
        }
        var query_insert="INSERT INTO tweets(message,author,timestamp)values("+"'"+message+"'"+","+"{eventId:"+eventId+","+"eventname:"+"'"+eventname+"'"+"})";
        client.execute(query_insert,function(err,result){
            if(err)
            {
                console.log("There was an error while inserting the tweets in the database");
                return res.json({
                    'error':'Error while inserting'
                },500);
            }
            else
            {
                console.log("Tweet successfully inserted into the database");
                return res.json({
                    'tweet':result
                });
            }
        })
    });


    app.post('/api/postComment/commentVal', function(req, res) {
        var emp_id=req.body.emp_id;
        var commentVal=req.body.commentVal;
        var query_insert="INSERT INTO comments(emp_id,commentVal)values("+emp_id+","+"'"+commentVal+"'"+")";
        client.execute(query_insert,function(err,result){
            if(err)
            {
                console.log("There was a problem while inserting into comments");
                return res.json({
                    'error':'Error while inserting into comments'

                },500);
            }
            else
            {
                console.log("successfully inserted into comments");
                return res.json({
                    'comment':result
                })
            }

        });
    });


    //// EVENT API
    app.get('/api/events', auth.authenticate, function(req, res) {
        var username=req.query.username;
        var query_find="Select * from users where username ="+username;
        client.execute(query_find,function(err,result){
            if(err)
            {
                console.log("There was an error while fetching the user from the database");
                return res.json({
                    'error':'could not load the user'

                },500);
            }
            if(!result)
            {
                console.log("No such user was found in the database");
                return res.json({
                    'error':'No such user was found'
                },500);
            }
            var followerMap = {};
            for (var i = 0; i < user.following.length; i++) {
                followerMap[user.following[i].eventname] = 1;
            }
            var query;
            if(username=="admin")
            {
                 query="SELECT * from events";
            }
            else if(username!="admin")
            {
                 query="SELECT * FROM events where restricted ="+'N';
            }
            client.execute(query,function(err2,events){
                if(err2)
                {
                    console.log("There was a problem while loading the data from the database");
                    return res.json({
                        'error':'could not load the data'
                    },500);
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
        var query_find="SELECT * from events where eventname ="+"'"+eventname+"'";
        client.execute(query_find,function(err,result){
            if(err)
            {
                console.log("There was a problem while loading the data");
                return res.json({
                    'error':'Could not load the required data'
                },500);
            }
            else
            {
                console.log("Event found");
                return res.json({
                    'event':result
                });
            }
        });

        });

    app.get('/api/events/followings', auth.authenticate, function(req, res) {
        var username=req.query.username;
        var query="SELECT * from users where username = "+"'"+username+"'";
        client.execute(query,function(err,result){
            if(err)
            {
                console.log("There was a problem while loading the data from the database");
                return res.json({
                    'error':'Could not load user data'
                },500);
            }
            if(!result)
            {
                console.log("No such user was found in the database");
                return res.json({
                    'error':'No such user was found'
                },500);
            }
            res.json({
                'user':result
            });
        });
    });

    app.put('/api/events/:eventname/follow', auth.authenticate, function(req, res) {
        var username=req.body.username;
        var query_find="SELECT id,name,username FROM users where username="+"'"+username+"'";
        client.execute(query_find,function(err,result){
            if(err)
            {
                console.log("There was a problem while loading the data from the database");
                return res.json({
                    'error':'error while loading the data from the database'

                },500);
            }
            if(!result)
            {
                console.log("No such was found in the database");
                return res.json({
                    'error':'No such user was found in the database'
                },500);
            }
            var query_update="Update users SET following.eventId = "+req.body.following._id+"AND eventname="+"'"+req.body.following.parent_name+"'";
            if(err)
            {
                console.log("There was a problem while updating the user database");
                return res.json({
                    'error':'Error while updating'
                },500);
            }
            res.json({
                'successful':true
            });
        
      });

});
/*
    var get_total_num_docs = function(db_client, query, cb) {
        db_client.collection(query['collection'], function(e, coll) {
            coll.find(query.params, query.options).count(function(e, count) {
                console.log(count);
                return cb(e, count);
            });
        });
    };
*/

    app.put('/api/events/:eventname/unfollow', auth.authenticate, function(req, res) {
        var username=req.body.username;
        var query="SELECT id,username,name FROM users where username ="+"'"+username+"'";
        client.execute(query,function(err,result){
            if(err)
            {
                console.log("There was an error while loading the data from the users database");
                return res.json({
                    'error':'could not load user data'
                },500);
            }
            if(!result)
            {
                console.log("There was no such user found in the database");
                return res.json({
                    'error':'No such user was found in the database'
                });
            }
            var query_update="DELETE FROM users where following.eventname="+"'"+req.body.result.eventname+"AND follow="+req.body.result.follow;
            client.execute(query_update,function(err2,result2){
                if(err)
                {
                    console.log("Error while deleting");
                    return res.json({
                        'error':'Could not save users'

                    },500);
                }
                else
                {
                    return res.json({
                        'successful':true
                    })
                }

            });
            var query_update2="UPDATE users SET follow="+req.body.result.follow+"Where id ="+req.body.result.id;
            client.execute(query_update2,function(err3,result3)
            {
                if(err3)
                {
                    console.log("There was a problem while updating users");
                    return res.json({
                        'error':'Could not update users'
                    },500);
                }

                return res.json({
                    'successful':true

                });
            });

        });
    });

    app.post('/api/saverecentsearch', function(req, res) {
        var emp_id=req.body.emp_id;
        var query_find="SELECT * from RecentSearch where emp_id="+"'"+emp_id+"'";
        client.execute(query_find,function(err,recentSearch)
        {
            if(err)
            {
                console.log("Could not load the recent searches from the database");
                return res.json({
                    'error':'Error occured while loading the data'
                },500);
            }
            if(!recentSearch)
            {
                var currentDate = new Date();
                var description: req.body.description;
                var date_time: req.body.date_time;
                var sequence: req.body.sequence;
                var query_insert="INSERT INTO RecentSearch(emp_id,date_time,sequence)values("+"'"+emp_id+"'"+","+date_time+","+"'"+sequence+"'"+")";
                client.execute(query_insert,function(err,result)
                {
                    if(err)
                    {
                        console.log("Error while loading data in Recent Searches");
                        return res.json({
                            'error':'Could not insert the data'
                        },500);
                    }
                    else
                    {
                        var query_update="Update RecentSearch SET description=description+"+"{"+"'"+description+"'"+"}";
                        client.execute(query_update,function(err2,result2){
                            if(err2)
                            {
                                console.log("Could not load the description");
                                return res.json({
                                    'error':'Could not load the description into the database'
                                });
                            }
                        });
                        return res.json({
                            'successful':true
                        })
                    }

                });

            }
            else
            {
                

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
