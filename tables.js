var assert=require('assert');
const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], keyspace: 'demo2' });

const query = "CREATE type follow(eventId int, eventname text)";
client.execute(query, function (err, result) {
  if(!err)
  	console.log("Created Type for following");
});

const query5 = "CREATE type topic(key text,value text)";
client.execute(query5, function (err, result) {
  if(!err)
  	console.log("Created Type for topic");
});

const query7 = "CREATE type temp(template_name text,template_message text,template_fields text)";
client.execute(query7, function (err, result) {
  if(!err)
  	console.log("Created Type for templates");
});

const query2 = "CREATE TABLE Users (username text primary key, password text, email text, name text, registered date,follow boolean,following frozen <follow>)";
client.execute(query2, function (err, result) {
  if(!err)
  	console.log("Created table for users");
  else
  	console.log(err);
});

const query3 = "CREATE TABLE tweets (message text primary key, author frozen <follow>,timestamp text)";
client.execute(query3, function (err, result) {
  if(!err)
  	console.log("Created table for tweets");
  else
  	console.log(err);
});

const query4 = "CREATE TABLE events (eventname text,restricted text,parent_id int,parent_name text,event_message text primary key,event_fields text,topic_definition frozen <topic>,topic_description list<text>,createdby text,createdon date,follow boolean)";
client.execute(query4, function (err, result) {
  if(!err)
  	console.log("Created table for events");
  else
  	console.log(err);
});

const query6 = "CREATE TABLE Templates (eventname text,templates frozen <temp> primary key)";
client.execute(query6, function (err, result) {
  if(!err)
  	console.log("Created table for templates");
  else
  	console.log(err);
});

const query8 = "CREATE TABLE Comments (commentVal text primary key)";
client.execute(query8, function (err, result) {
  if(!err)
  	console.log("Created table for Comments");
  else
  	console.log(err);
});

const query9 = "CREATE TABLE userTweets (tweet_id int primary key,username text,tweet_flag text,createdby text,createdon date)";
client.execute(query9, function (err, result) {
  if(!err)
  	console.log("Created table for User tweets");
  else
  	console.log(err);
});