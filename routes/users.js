var express = require("express");
var router = express.Router();
const {User} = require('../models/User');
const userController = require('../controllers/usersController');
const Post = require('../models/Posts');
const postController = require('../controllers/postsController');
// const {connectedUsers_IDtoUserName,connectedUsers_UserNametoId} = require('../app');


const utils = require('../lib/utils');


// handling HTTP requests on the '/users/' gateway
router
  .get("/", async (req, res, next) => {
    try {

      // preparing the query
      let query = {};
      if (req.query.userName) {
        query.userName = { "$regex": `^${req.query.userName}`, "$options": "i" };
    }

  

      // getting the users
      const users = await userController.getUsers(query,req.query.req, req.query.offset? req.query.offset : 0, req.query.limit? req.querylimit : 30);
      
      res.status(200).json({
        count: users.length,
        users
      });
    } catch (err) {
      next(err);
    }
  })
  .post("/", async (req, res, next) => {
    const { body } = req;
    try {
      const userData = utils.FieldMapper(body,['userName','password','firstName','lastName','imgURL']);
      const result = await User.create(userData);
      res.statusCode = 200;
      res.json(result);
    } catch (err) {
      next(err,req,res,next);
    }
  })
  .put("/", async (req, res, next) => {
    res.statusCode = 403;
    res.json(`PUT request is not allowed on this URL: /users`);
  })
  .delete("/", async (req, res, next) => {
    try {
      const result = await User.deleteMany();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// handling HTTP requests on the '/users/:id' gateway
router
  .get("/:userName", async (req, res, next) => {
    try {
      const userName = req.params.userName;
      const users = await userController.getUsers({userName: req.params.userName},req.query.req);
      res.json(users);
    } catch (err) {
      next(err);
    }
  })
  .post("/:userName", async (req, res, next) => {
    res.statusCode = 403;
    res.json(`POST requests is not allowed on this URL: /users/:id`);
  })
  .put('/:userName', async (req, res, next) => {
    if(!req.body || !req.params || !req.params.userName){
      res.status(400).json({message: `The request has no body.`});
      return ;
    }

    let updateData = utils.FieldMapper(req.body,['firstName','lastName','userDescription','imgURL','coverURL']);

    const userName = req.params.userName;

    try {
      const result = await User.findOneAndUpdate({ userName }, updateData, {
        new: true
      });
      console.log(result);
      res.json(result);
    } catch (err) {
      console.log(err);
      next(err);
    }
  });


// handling getting posts of a specific user  by username and user id 

router
.get('/:userName/posts', async (req, res, next) => {

  const query = {};
  if(req.query.mediaType){
    query.mediaType = req.query.mediaType;
  }
  query.publisher = req.params.userName;
  try {
    const posts = await postController.getPosts(query,req.query.req,req.query.offset? req.query.offset: 0, req.query.limit? req.query.limit : 0);
    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    next(err);
  }
})

.delete('/:userName/posts',async(req,res,next)=>{
  const userName = req.params.userName;
  if(!userName){
    res.status(400).json({err: `wrong Params!`});
    return next();
  }
  try{
    const targetUser = User.find({userName});
    const result = await Post.deleteMany({publisher: targetUser});
    res.json(result);
  }catch(err){
    console.log(err);
    next(err);
  }
})
.all('/:userName/posts',async(req,res,next)=>{
  res.status(403).json({err: `${req.method} is not allowed in ${req.path}`});
});


// handle user friend requests gateway
 router
  .get('/:userName/friendRequests',async(req,res,next)=>{
      const userName = req.params.userName;
      if(!userName){
        res.status(400).json({err: `Wrong parameters!`});
        return;
      }
      try{
      const user = await User.findOne({userName});
      if(!User){
        res.status(404).json({err: `User not found`});
        return;
      }
      res.json(user.friendRequests);
    }catch(err){
      console.log(err);
      next(err);
    } 
  })
  .post('/:userName/friendRequests',async(req,res,next)=>{
    const userName = req.params.userName;
    const friendUserName = req.body.friendUserName;
    if(!userName || !friendUserName){
      res.status(400).json((!userName)? `Wrong parameters!` : `body is misiing data!`);
      return;
    }
    if(userName === friendUserName){
      res.status(403).json({err: `User can't send a friend request to himself!`});
      return;
    }
    try{
      const user = await User.findOne({userName});
      const friend = await User.findOne({userName: friendUserName});

      
      // checking for exisyence of the user and the friend in the database
      if(!user){
        res.status(404).json({err: `user not found!`});
        return ;
      }

      if(!friend){
        res.status(404).json({err: `friend user not found!`});
        return;
      }

      // checking if the user is already a friend
      if(user.friends.find((friend)=> friend === friendUserName )){
        res.status(403).json({err: `User already exists in the friends list!`});
        return;
      }

      // checking if the user already requested to be a friend
      if(user.friendRequests.find((friend)=> friend === friendUserName )){
        res.status(403).json({err: `User already exists in the friends requests list!`});
        return;
      }

      // adding the friend username to the friend requests list of the current user  
      user.friendRequests.push(friendUserName);
      await user.save();
      res.json({message: `Friend request sent successfully!`});
      //todo
      const io = req.app.locals.io;
      
        
      const userData = {
        userName: user.userName,
        userImgURL: user.imgURL,
        firstName: user.firstName,
        lastName: user.lastName,
        requesteDate: new Date()
      }
      const connectedUsers_UserNametoId = req.app.locals.connectedUsers_UserNametoId;
      const connectedUsers_IDtoUserName = req.app.locals.connectedUsers_IDtoUserName;

      // console.log(connectedUsers_UserNametoId);
      // console.log( connectedUsers_IDtoUserName);
      if(userData && userData.userName){
        // const socketId = connectedUsers_UserNametoId.get(userData.userName);
      }
      // console.log(connectedUsers_UserNametoId[friendUserName]);
      io.to(connectedUsers_UserNametoId[userName]).emit("friendRequestSent",userData);
      console.log('__________________________________________________________________________________________________________________________________________________\n');
      console.log(`==> Friend request notification has been sent successfully to user: ${userName} with socket id : ${connectedUsers_UserNametoId[userName]}`)
      console.log('__________________________________________________________________________________________________________________________________________________\n');
        
    }catch(err){
      console.log(err);
      next(err);
    }
  })
  // deleting all friend requests of a specific user (DANGER ZONE!)
  .delete('/:userName/friendRequests',async(req,res,next)=>{
    const userName = req.params.userName;
    if(!userName){
      res.json(400).json({err: `Wrong parameters!`});
      return;
    }

    try{
      const user = await User.findOne({userName});
      user.friendRequests = [];
      await user.save();
      res.json({message: `Friend requests removed successfully!`});
    }catch(err){
      console.log(err);
      next(err);
    }
  });



  router.delete('/:userName/friendRequests/:friendUserName',async (req,res,next)=>{
    const {userName,friendUserName} = req.params;
    // checking for missing information
    if(!userName || !friendUserName){
      res.status(400).json({err: `wrong parameters!`});
      return next();
    }
    try{
      const user = await User.findOne({userName});

      // checking for invalid username
      if(!user){
        res.status(404).json({err: `User not found!`})
        return;
      }

      // checking for invalid freind username
      const friend = await User.findOne({userName: friendUserName});
      if(!friend){
        res.status(404).json({err: `the friend was not found!`});
        return;
      }

      // checking foe the exstance of the friend in the current user friend list
      if(!user.friendRequests.find((friend)=> friend === friendUserName)){
        res.status(404).json({err: `The user wanted to be removed is not in  friend requests list!`});
        return ;
      }
      
      // removing friend user name from current user's freinds list 
      user.friendRequests = await user.friendRequests.filter((friend)=>friend !== friendUserName);
      await user.save();

      // removing the current user username from current freind's freinds list 
      friend.friendRequests = await  friend.friendRequests.filter((friend)=>friend !== userName);
      await friend.save();

      res.json({message: `Friend request is removed successfully!`});
      
    }catch(err){
      console.log(err);
      next(err);
    }
  })



  // handling user friends gateway
  router
  // getting all friends of a user 
  .get('/:userName/friends',async(req,res,next)=>{
    const userName = req.params.userName;
    if(!userName){
      res.status(400).json({err: `wrong parameters!`});
      return next();
    }

    try{
      // checking  for the existence of the user
      const user = await User.findOne({userName});
      if(!user){
        return res.status(404).json({Message: `User not found!`});
      }

      const friendsUserNames = user.friends;
      const friends = await userController.getUsers({userName: {$in:friendsUserNames}});
      res.json(friends);

    }catch(err){
      console.log(err);
      next(err);
    }
  })

  // accepting a friend request 
  .post('/:userName/friends',async(req,res,next)=>{
    const userName = req.params.userName;
    const friendUserName = req.body.friendUserName;

    // checking for missing information
    if(!userName || ! friendUserName){
      res.status(400).json({err: `wrong parameters!`});
      return next();
    }
    
    if(userName === friendUserName){
      res.status(403).json({err: `User can't be friend of  himself!`});
      return;
    }

    try{
      const user = await User.findOne({userName});
      const friend = await User.findOne({userName: friendUserName});

      // checking for invalid username or invalid freind username
      if(!user){
        res.status(404).json({err: `user not found!`});
        return ;
      }

      if(!friend){
        res.status(404).json({err: `friend user not found!`});
        return;
      }

      // checking if the user is trying to add himself as a friend
      if(user == friend){
        res.status(403).json({Message: `User Can't be friend to himself!`});
        return;
      }
      
      if( user.friends.find((friend)=> friend == friendUserName  )){
        res.status(400).json({err: `User already exists in Friends list!`});
        return ;
      }
      
      if( ! user.friendRequests.find((friend)=> friend == friendUserName )) {
        res.status(404).json({err: `Friend request not found `});
        return ;
      }

      await User.updateOne(
        {userName},
        {
          $push: {
            friends: friendUserName
          }
        }
      );

      await User.updateOne(
        {userName: friendUserName},
        {
          $push: {
            friends: userName
          }
        }
      );

      await User.updateOne(
        {userName},
        {
          $pull: {
            friendRequests: friendUserName
          }
        }
      );

      const  userData = {
        userName: friend.userName,
        imgURL: friend.imgURL,
        firstName: friend.firstName,
        lastName: friend.lastName,
        confirmationDate: new Date()
      };
      const io = req.app.locals.io;
      // todo2
      io.to(connectedUsers_UserNametoId[friendUserName]).emit('friendRequestAccepted',userData);
      console.log('__________________________________________________________________________________________________________________________________________________\n');
      console.log(`==> Friend Acception notification has been sent successfully to user: ${friendUserName} with socket id : ${connectedUsers_UserNametoId[friendUserName]}`)
      console.log('__________________________________________________________________________________________________________________________________________________\n');
        
      res.json({message: `friend request accepted!`});
    }catch(err){
      console.log(err);
      next(err);
    }
  })
  .delete('/:userName/friends',async(req,res,next)=>{
    const userName = req.params.userName;
    if(!userName){
      res.status(400).json({err: `wrong parameters!`});
      return next();
    }
    try{
      const user = await User.findOne({userName});
      user.friends = [];
      user.save();
      res.json({message: `Friends deleted!`});
    }catch(err){
      console.log(err);
      next(err);
    }

  });



  // handling removing a friends for a specific user 
  router
  .delete('/:userName/friends/:friendUserName',async (req,res,next)=>{
    const {userName,friendUserName} = req.params;
    // checking for missing information
    if(!userName || !friendUserName){
      res.status(400).json({err: `wrong parameters!`});
      return next();
    }
    try{
      const user = await User.findOne({userName});

      // checking for invalid username
      if(!user){
        res.status(404).json({err: `User not found!`})
        return;
      }

      // checking for invalid freind username
      const friend = await User.findOne({userName: friendUserName});
      if(!friend){
        res.status(404).json({err: `the friend was not found!`});
        return;
      }

      // checking foe the exstance of the friend in the current user friend list
      if(!user.friends.find((friend)=> friend === friendUserName)){
        res.status(404).json({err: `The user wanted to be removed is not a friend!`});
        return ;
      }
      
      // removing friend user name from current user's freinds list 
      user.friends = await user.friends.filter((friend)=>friend !== friendUserName);
      await user.save();

      // removing the current user username from current freind's freinds list 
      friend.friends = await  friend.friends.filter((friend)=>friend !== userName);
      await friend.save();

      res.json({message: `Friend is removed successfully!`});
      
    }catch(err){
      console.log(err);
      next(err);
    }

  })
  .all('/:userName/friends/:friendID',(req,res,next)=>{
    res.status(403).json({err: `${req.method} is forbidden on path: ${req.path}`});
  });




// handling getting a specific post of a specific user  by username and user id 
  router
  .get('/:userName/:postId',async(req,res,next)=>{
    const {userName,postId} = req.params;
    if(!req.params || !userName || !postId){
      res.status(400).json({message: `Wrong parameters!`});
      return next();
    }
    try{
      const post = await Post.findById(postId);
      res.json(post);
    }catch(err){
      console.log(err);
      next(err);
    }
    
  })
  .put('/:userName/:postId',async(req,res,next)=>{
    const {userName,postId} = req.params;
    if(!req.params || !userName || !postId){
      res.status(400).json({message: `Wrong parameters!`});
      return next();
    }
    try{
      const updatedPost = await Post.findByIdAndUpdate(postId);
      res.json(updatedPost);
    }catch(err){
      console.log(err);
      next(err);
    }
  })
  .delete('/:userName/:postId',async(req,res,next)=>{
    const {userName,postId} = req.params;
    if(!req.params || !userName || !postId){
      res.status(400).json({message: `Wrong parameters!`});
      return next();
    }
    try{
      const result = await Post.findByIdAndDelete(postId);
      res.json(result);
    }catch(err){
      console.log(err);
      next(err);
    }
  })
  .all('/',async(req,res,next)=>{
    res.status(403).json({err: `${req.method} is not allowed in ${req.path}`})
  });

  


module.exports = router;

