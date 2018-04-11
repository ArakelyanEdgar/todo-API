let mongoose = require('./db/mongoose.js').mongoose
let User = require('./models/user').User
let Todo = require('./models/todo').Todo



let newUser = new User({
    email: 'arakeedgar@gmail.com'
})

newUser.save().then( (docs) => {
    console.log(docs)
    mongoose.disconnect()
}, (err) => {
    console.log(err)
})