let mongoose = require('mongoose')


//use promises instead of callback arguments
mongoose.Promise = global.Promise

//MONGODB_URI = mlab on heroku, mongodb://localhost:27017/TodoApp on development and mongodb://localhost:27017/TodoAppTest
mongoose.connect(process.env.MONGODB_URI)

module.exports = {
    mongoose
}