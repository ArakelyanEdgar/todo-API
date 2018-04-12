let express = require('express')
let bodyParser = require('body-parser')

let mongoose = require('./db/mongoose.js').mongoose
let User = require('./models/user').User
let Todo = require('./models/todo').Todo

let app = express()

//parse json requests
app.use(bodyParser.json())

//post method on todos saves a todo
app.post('/todos', (req, res) => {
    let todo = new Todo({
        text: req.body.text
    })
    todo.save().then((doc) => {
        console.log(doc)
        res.status(200).send(doc)
    }, (err) => {
        res.status(400).send(err)
        console.log(err)
    })
})

//get method on todos returns all todos
app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.status(200).send(todos)
    }, (err) => {
        res.status(400).send(err)
    })
})


let port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server deployed on port ${port}`)
})

module.exports = {
    app
}