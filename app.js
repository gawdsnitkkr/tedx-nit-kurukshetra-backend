/**
 * Created by Narendra on 13/8/17.
 */
var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var session= require('express-session');
var multer = require('multer');
var mysql = require('mysql');
var sanitizeHtml = require('sanitize-html');
var multiparty = require('multiparty');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ted"
});
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});
app.use(express.static(path.join(__dirname, 'www')));
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'ted-x-gawds',
    resave: true,
    saveUninitialized: true
}));
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./www/images");
    },
    filename: function(req, file, callback) {
        callback(null,  sanitizeHtml(req.body.speakername)+".jpg");
    }
});
var upload = multer({
    storage: storage
}).array("images", 3);
app.get('/login' , function (req , res) {
    if(req.session.username) {
        res.redirect('/admin');
    }else {
        res.sendFile(__dirname + '/www/login.html');
    }
});
app.post('/login' , function (req , res) {
    const post = req.body;
    const username  = sanitizeHtml(post.user);
    const password = sanitizeHtml(post.password);
    var sql = "SELECT * FROM login WHERE username='"+username+"'";
    con.query(sql, function (err, result, fields) {
        if( result.length > 0 && result[0].password === password ) {
            console.log("Auth set");
            req.session.username = post.user;
            res.send({"result" : "Found"});
        }else {
            res.send({"result": "NotFound"});
        }
    });
});
app.get('/admin'  ,  function (req , res) {
    if(!req.session.username) {
        res.redirect('/login');
    }else {
        res.sendFile(__dirname + '/www/admin.html');
    }
});
app.get('/speakers' , function (req , res) {
	res.sendFile(__dirname + '/www/speaker.html');
});
app.post('/speakers' , function (req , res) {
    var sql = "SELECT * FROM speaker ";
    con.query(sql, function (err, result, fields) {
        res.send(result);
    });
});
app.post("/speaker-insert", function(req, res) {
    upload(req ,res, function(err) {
        if (err) {
            return res.end("Something went wrong!");
        }else {
            const post = req.body;
            const name  = sanitizeHtml(post.speakername);
            const topic = sanitizeHtml(post.topic);
            const description = sanitizeHtml(post.description);
            var sql = "INSERT INTO speaker(name, topic, description, pic_url) " +
                        "values('"+name+"','"+topic+"','"+description+"','/images/"+name+".jpg')";
            con.query(sql, function (err, result, fields) {
                res.redirect('/admin');
            });
        }
    });
});
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});
app.post('/getuser' , function (req , res) {
    res.send({
        "username" : req.session.username
    });
});
app.get('/blog' , function (req , res) { 
	res.sendFile(__dirname + '/www/blog.html');
});
app.post('/blog' , function (req , res) { 
    var sql = "SELECT * FROM videos";
    con.query(sql, function (err, result, fields) {
        res.send(result);
    });
});
app.post("/video-insert", function(req, res) {
    const post = req.body;
    const title  = sanitizeHtml(post.title);
    const description = sanitizeHtml(post.description);
    const url = sanitizeHtml(post.url);
    var sql = "INSERT INTO videos(title, description, video_url) " +
                "values('"+title+"','"+description+"','"+url+"')";
    con.query(sql, function (err, result, fields) {
        res.redirect('/admin');
    });
});
app.post("/delete-speaker", function(req, res) {
    const post = req.body;
    const speakerName  = sanitizeHtml(post.speakerName);
    var sql = "Delete from speaker where name = '" + speakerName +"'" ;
    con.query(sql, function (err, result, fields) {
        res.redirect('/admin');
    });
});
app.post("/delete-video", function(req, res) {
    const post = req.body;
    const videoTitle  = sanitizeHtml(post.videoTitle);
    var sql = "Delete from videos where title = '" + videoTitle +"'" ;
    con.query(sql, function (err, result, fields) {
        res.redirect('/admin');
    });
});
// Starting Server
const port = process.env.PORT || 3000;
server.listen(port, function(){
    console.log('listening on *:3000');
});

