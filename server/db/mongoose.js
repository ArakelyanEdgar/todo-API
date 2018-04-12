let mongoose = require('mongoose')


//use promises instead of callback arguments
mongoose.Promise = global.Promise

//using mlab cloud
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp')

module.exports = {
    mongoose
}