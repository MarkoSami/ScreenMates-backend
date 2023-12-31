const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, `User name is required`],
    unique: [true, `User name must be Unique`],
    minlength: [6, `User name can't be less than 6 charachters`],
    maxlength: [20, `User name can't exceed 20 charachters`],
    validate: {
      // validate that tthe username doesn't contain anu special charachters excepts '_'
      validator: function (value) {
        return /^[a-zA-Z0-9_]+$/.test(value);
      },
      message: "User name must only contain letters, numbers, and underscores.",
    },
  },
  firstName: {
    type: String,
    required: [true, `First name is required`],
    minlength: [2, `First name can't be less than two charachters `],
    maxlength: [15, `First name is too long`],
    validate: {
      // validate that tthe username doesn't contain anu special charachters excepts '_'
      validator: function (value) {
        return /^[a-zA-Z0-9_]+$/.test(value);
      },
      message: "FirstName must only contain letters, numbers, and underscores.",
    },
  },
  lastName: {
    type: String,
    required: [true, `Last name is required`],
    minlength: [2, `Last name can't be less than two charachters `],
    maxlength: [15, `Last name is too long`],
    validate: {
      // validate that tthe username doesn't contain anu special charachters excepts '_'
      validator: function (value) {
        return /^[a-zA-Z0-9_]+$/.test(value);
      },
      message: "LastName must only contain letters, numbers, and underscores.",
    },
  },
  password: {
    type: String,
    required: [true, `Password is required`],
    minlength: [8, `Password can't be less than 8 charachters`],
    maxlength: [100, `Password can't exceed 100 charachters`],
  },
  userDescription: {
    type: String,
    default: "No description",
    maxlength: [500, "User description is too long"],
  },
  friends: [
    {
      type: String
    },
  ],
  friendRequests: [
    {
      type: String
    },
  ],
  imgURL: {
    type: String,
    default: "",
  },
  coverURL: {
    type: String,
    default: "",
  },
  influence: {
    type: Number,
    default: 0,
    min: [0, `influence can't be a negative number.`],
  },
  // feedOffset: {
  //   type: Number,
  //   default: 0,
  //   min: [0, `the offeset of the posts feed can't be a negative number`],
  // },
  // commentsOffset: {
  //   type: Number,
  //   default: 0,
  //   min: [0, `the offeset of the comments feed can't be a negative number`],
  // },
  // friendRequestsOffset: {
  //   type: Number,
  //   default: 0,
  //   min: [0, `the offeset of the friend requests can't be a negative number`],
  // },
});

// hashing the password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    // Generate a salt to hash the password
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(this.password, salt);

    // Replace the plain text password with the hashed password
    this.password = hashedPassword;

    // Continue saving the user document
    next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = {User,UserSchema};
