var express = require('express');
var router = express.Router();
var db = require('../db');
var bcrypt = require('bcryptjs');
var fileUpload = require('express-fileupload');
const { check ,validationResult } = require('express-validator/check');
const paginate = require('express-paginate');

router.all(function(req, res, next) {
  // set default or minimum is 10 (as it was prior to v0.2.0)
  if (req.query.limit <= 10) req.query.limit = 10;
  next();
});
router.use(fileUpload({
  
}));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Login',msg:req.session.errormsg,flagmessage:req.session.flagmessage });
});

router.get('/alluser', function(req, res, next) {
  const itemCount =17;
  const pageCount = Math.ceil(itemCount / req.query.limit);
  var offset =0;
  console.log(req.query);
  if(req.query.page > 1){
    offset =   (req.query.page - 1) * req.query.limit;
  }
  var currentpage = req.query.page;
  var sql ='select * from tbl_user limit '+req.query.limit+ ' OFFSET ' +offset ;
 // console.log(sql);
 var userdetail=[];
  db.query(sql, function (err, rows) {
    if (err) throw err;
    if(rows.length>0) {

      for (var i = 0; i < rows.length; i++) {
        
          var  userDetail2 = {
            'First Name':rows[i].f_name,
            'Last Name':rows[i].l_name,
            'Email':rows[i].email,
            'f_name':rows[i].f_name,
            'l_name':rows[i].l_name,
            'email':rows[i].email,
            'profile_pic':rows[i].profile_pic
          }

          userdetail.push(userDetail2);
      }
    }
    //return next();
 //console.log(userdetail);
    res.render('paggination', {
      users: userdetail,
      pageCount,
      itemCount,
      currentpage,
      pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
    });
});
 

 // res.render('index', { title: 'Login' });
});

/* GET home page. */
router.post('/login', function (req, res) { 
    //console.log(db.sql);

   // var password   = bcrypt.hashSync, 10);
    var email      = req.body.Email;
    var sql ="select * from tbl_user where email = '"+email+"'";
    console.log(sql);
    db.query(sql, function (err, result) {
          if (err) throw err;
        
        if(result.length > 0){
             
              var hash=result[0].password;
              var c = bcrypt.compareSync(req.body.password, hash);

              if(c){

                req.session.user_id = result[0].user_id;
               // console.log("true");
                res.redirect('/home');
              }else{

                req.session.errormsg = "Invalid Password";
                req.session.flagmessage = true;
               // console.log("false");
                res.redirect('/');

              }
         } else{
            // console.log("no");
             req.session.errormsg = "Email id doesn't exist";
             req.session.flagmessage = true;
             res.redirect('/');

         }  
    });

   // console.log(req.body);

    //res.send('Got a POST request');
  })


/*
 *  register record in db
*/

router.post('/savesignup'
,

[
  // username must be an email
  check('f_name').isLength({ min: 1 }).withMessage('First name is required'),
  check('l_name').isLength({ min: 1 }).withMessage('Last name is required'),
  check('email').isLength({ min: 1 }).withMessage('Email is required'),
  check('password')
    .isLength({ min: 5 }).withMessage('must be at least 5 chars long')
    .matches(/\d/).withMessage('must contain a number')
],
function(req,res){

    //console.log(check('email').isEmail());
    var errors =validationResult(req);
    console.log(errors.isEmpty());
     if(!errors.isEmpty()){
           req.session.errors = errors.array();
           req.session.error = true;
           //console.log(req.session.errors);
           res.redirect('/register');
       }else{

              var hash = bcrypt.hashSync(req.body.password, 10);

              console.log(hash);
              var request = {f_name:req.body.f_name, 
                  l_name:req.body.l_name,
                  email:req.body.email,
                  password:hash,
                  status:1,
                  created:new Date(),
                  modified:new Date()
                
                };
            db.query('INSERT INTO tbl_user SET ?',request , function (err, result) {
              if (err) throw err;
              if(result.affectedRows){
            
                req.session.user_id = result.insertId;
             
                res.redirect('/home');
              }else{
                res.redirect('/login');
              }
          });
  }
})//  End of Register function in db


router.get('/home',function(req,res){
  
  var user_id =  req.session.user_id;
  //user_id =41;
  var userDetail ={};
 // user_id =42;
  db.query('SELECT * FROM tbl_user WHERE  user_id = ?',user_id , function (err, rows) {
    if (err) throw err;
 
    if(rows.length==1) {
          
           userDetail = {
            'First Name':rows[0].f_name,
            'Last Name':rows[0].l_name,
            'Email':rows[0].email,
            'f_name':rows[0].f_name,
            'profile_pic':rows[0].profile_pic
          }

      }

      res.render('home', { title: 'Welcome Page',userDetail:userDetail});
  // console.log(userDetail[0].user_id);
});

 //console.log(req.session.error);
 // res.send('Welcome page');


})//  End of Register function in db


/*
 *  register record in db
*/
router.get('/register',function(req,res){
  
  res.render('register', { title: 'Sign Up',errorstatus: req.session.error,errormessage:req.session.errors });
  res.end();

})//  End of Register function in db


/*
 *  register record in db
 * $2a$10$z3OAxPywk6y9Kj2uv7GLj.1897xDJcbB.0dDVOxHmpObvDYe9A1UW
*/
router.post('/upload',function(req,res){
  
   if (!req.files)
    return res.status(400).send('No files were uploaded.');


    let profile_file = req.files.profile_pic;
    profile_file.mv('./public/images/'+req.files.profile_pic.name, function(err) {
      if (err)
        return res.status(500).send(err);
        
        var user_id =  req.session.user_id;

        if(user_id){
        var sql ="UPDATE tbl_user  set profile_pic =? WHERE user_id = ?";
        db.query(sql,[req.files.profile_pic.name,user_id] ,function (err, result) {
          if (err) throw err; 
          console.log(result.affectedRows + " record(s) updated");
        });


        }
         //console.log(user_id);
         res.redirect('/home');
      //res.send('File uploaded!');
    });

})//  End of Register function in db

/*
 *  Pug basic reference 
*/
router.get('/pug', function (req, res) {
 
  res.render('pugbasic', { name: 'pugtutorial' });
})

router.get('/logout',function(req,res){

  req.session.destroy(function(err) {
      res.redirect('/');
  });

});

module.exports = router;

//select * from tbl_user where email = 'bsk@gmail.com' and password ='$2a$10$Q0jMjbJ6/mgeWPQUhn5J3.CPD92wlVk6hx8.fx.sHH2UgB1REzUBm'
//$2a$10$UQNwouX871Mh/3zoDkUoUORTuNJczrU6AxAK5NwjUEfFxe7CjipnG
