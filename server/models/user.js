const mongoose = require('mongoose')
let Validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

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

    return new Promise(resolve => {
        this.save().then(() => {
            resolve(token)
        })
    })
}

//hashes users password and saves it to its instance
schemaUser.methods.hashPassword = function(){

    let salt = bcrypt.genSaltSync()
    let hash = bcrypt.hashSync(this.password, salt)
    this.password = hash

     return new Promise(resolve => {
         this.save().then(user => {
             resolve(user)
         })
     })
}

//compares user hash to password in order to determine if it is valid. Returns TRUE or FALSE
schemaUser.methods.compareHashToPassword = function(password){
    bcrypt.compare(password, this.password, (err, res) => {
        return res
    })
}

//finds a user with the id of the decrypted token
schemaUser.statics.findByToken = function(token){
    let decodedUser = ""

    //jwt.verify throws err if not verified
    return new Promise((resolve, reject) => {
        try {
            decodedUser = jwt.verify(token, 'secret')
            resolve(
                this.findOne({
                    _id: decodedUser._id,
                    'tokens.token': token,
                    'tokens.access': 'auth'
                })
            )
        } catch(err){
            reject(err)
        }
    })
}

let User = mongoose.model('User', schemaUser)

module.exports = {
    User
}