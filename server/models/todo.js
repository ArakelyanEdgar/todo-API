let mongoose = require('mongoose')

let schemaTodo  = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

let Todo = mongoose.model('Todo', schemaTodo)

module.exports = {
    Todo
}