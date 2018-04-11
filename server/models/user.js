let mongoose = require('mongoose')

let schemaUser = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }
})

let User = mongoose.model('User', schemaUser)

module.exports = {
    User
}