const mongoose = require('mongoose')
const post = require('./post')
mongoose.connect('mongodb://127.0.0.1:27017/PostApp')

const userSchema = mongoose.Schema({
    username : String,
    name : String,
    age : Number,
    email : String,
    password : String,
    posts : [{ type : mongoose.Schema.Types.ObjectId, ref : 'post'}],
    profile_pic : { type: String, default: "default.jpg"}
})

module.exports = mongoose.model('user', userSchema)