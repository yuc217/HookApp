const express = require('express');
const router = express.Router();
const User =require('../models/users');
const Event=require('../models/events');
const Header=require('../models/headers');
const passport=require('passport');
const jwt=require('jsonwebtoken');
const config=require('../config/database')


//register 
router.post('/register',(req,res,next)=>{
let newUser= new User({
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    });

    User.addUser(newUser,(err,user)=>{
        if(err){
        res.json({success:false, msg:'Failed user registration'});
        }
        else{
            res.json({success:true,msg:'User Resgistered'});
        }

    });
});

//Authenticate
router.post('/authenticate',function(req,res,next){
const username=req.body.username;
const password=req.body.password;

User.getUserByUsername(username,(err,user)=>{
    if(err) throw err;
    if(!user){
        return res.json({success:false,msg:'User not Found!'});

    }
    User.comparePassword(password,user.password,(err,isMatch)=>{
        //isMatch boolean
        if(err) throw err;
        if(isMatch){
            const token = jwt.sign(user,config.secret,{
                expiresIn:3600 //one hour
            });
            res.json({success:true,
            token:'JWT '+token,
            user:{
            id:user._id,
            name:user.name,
            username:user.username,
            email:user.email
        }
    });
        }
        else{
            return res.json({success:false, msg:"Wrong password"});

        }
    });
});
});


//Profile
//passport.authenticate('jwt',{session:false}) --> protects the route
router.get('/profile', passport.authenticate('jwt',{session:false}), function(req,res, next){
res.json({user : req.user});
});

//eventlister get method -- get all the list of events related to a username. or of a username with a particular headerkey.
router.get('/eventlister', passport.authenticate('jwt',{session:false}),function(req,res,next){
const query_userkey=req.query.username;
const query_headerkey=req.query.headerkey;
console.log("The query_key is "+query_userkey);

//Exclusively for Restcomm 
if(query_headerkey!=undefined){
    Event.find({username:query_userkey, headerkey:query_headerkey},(err,event)=>{
    if(err)
    {
            throw err;
        }
    console.log("The event of user with the headerkey is "+event);
    //var output=new Array();
    var output="";
    for(var i=0; i< event.length;i++){
        var x=""+(i+1);
        var str1=x.concat("."," ",event[i].event,"        ");
        output=output.concat(str1);
    //output.push(event[i].event);
    }
 
    return res.json({list:output});
    //return res.json({list:event}) 
    });
}
else{
    Event.find({username:query_userkey},(err,event)=>{
    if(err)
    {
            throw err;
        }
    console.log("All events of the user are "+event);
    return res.json({list:event}) 
    });
}
//  Event.getEventByUsername(query_key,(err,event)=>{
//       if(err) {
//           throw err;
//       }
//       if(!event){
//           return res.json({success:false, msg:"No events Found for the user "+query_key});
//      }
//      else{
//           console.log(event);
//          return res.json({list:event})
//      }
// }); 
});


//eventlister
router.post('/eventlister',passport.authenticate('jwt',{session:false}),function(req,res,next){
const event= new Event({
headerkey:req.body.headerkey,
event:req.body.event,
username:req.body.username
});
// Event.create(event,function (err, data) {
//    if (err) return handleError(err)});

  Event.addEvent(event,(err,event)=>{
        if(err){
        res.json({success:false, msg:'Failed event addition'});
        }
        else{
            res.json({success:true,msg:'Event added'});
        }

    });
});


//headers to get and to submit
router.get('/headers',function(req,res,next){
    const query_userkey=req.query.username;
    Header.findOne({username:query_userkey},(err,headerlist)=>{
        if(err) {
            console.log("Error in finding the allheader list");
            res.json({});
        }
        else{
            res.json(headerlist);
        }
    })
})




router.post('/headers', function(req,res,next){
    const header= new Header({
        username:req.body.username,
        allheaders:req.body.allheaders
    });
    
    Header.addHeader(header,(err,header)=>{
        if(err){
        res.json({success:false, msg:'Failed header addition'});
        }
        else{
            console.log('added headers  '+header);
            res.json({success:true,msg:'Headers added'});
        }

    });
})


function randomMethod(user){
Header.find({username:user},function(err,headerobj){
    if(err){

        throw err;
    }
    else{
        const allheaderlist=headerobj[0].allheaders;
        var finalObj=Object;
        for(var i=0;i<allheaderlist.length;i++){
            var header=allheaderlist[i];
            var list0= Event.find({username:user,headerkey:header});
            var output="";
            for(var j=0;j<list0.length;j++){
                var num=""+(j+1);
                var str1=x.concat("."," ",list0[j].event,"     ");
                output=output.concat(str1);
            }
            finalObj[header]=output;
        }
}
        
    });
}


module.exports=router;