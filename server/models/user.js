const mongoose = require('mongoose')
let Validator = require('validator')
const jwt = require('jsonwebtoken')

let schemaUser = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 1,
        validate: {
            validator: Validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
})

//generate a hashed and salted token
//NOTE: .methods is an instance method, thus "this" is a user and not a static method
//NOTE: we are using es5 function() syntax since () => {} doesn't bind "this"
schemaUser.methods.generateAuthToken = function(){
    let access = 'auth'
    let token = jwt.sign({
        _id: this._id.toHexString(),
        access
    }, 'secret').toString()


    this.tokens.push({
        access,
        token
    })

    return new Promise((resolve) => {
        this.save().then(() => {
            resolve(token)
        })
    })
}

let User = mongoose.model('User', schemaUser)

module.exports = {
    User
}