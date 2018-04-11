let mongoose = require('mongoose')


//use promises instead of callback arguments
mongoose.Promise = global.Promise

mongoose.connect('mongodb://localhost:27017/TodoApp')

module.exports = {
    mongoose
}