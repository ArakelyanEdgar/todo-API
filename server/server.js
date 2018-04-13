let express = require('express')
let bodyParser = require('body-parser')

let mongoose = require('./db/mongoose.js').mongoose
let User = require('./models/user').User
let Todo = require('./models/todo').Todo
let ObjectID = require('mongodb').ObjectID

let app = express()

//parse json requests
app.use(bodyParser.json())

//POST /todos | saves todo in body to todos db
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

//GET /todos | returns all todos
app.get('/todos', (req, res) => {

    Todo.find().then((todos) => {
        res.status(200).send(todos)
    }, (err) => {
        res.status(400).send(err)
    })
})

//GET /todos/:id | returns todo of passed id
app.get('/todos/:id', (req, res) => {
    let id = req.params.id
    if (!ObjectID.isValid(id)){
        res.status(404).send('INVALID id')
        return
    }

    Todo.findById(id).then((todo) => {
        if (todo === null){
            res.status(404).send(`todo with id: ${id} does not exist`)
            return
        }

        res.status(200).send(todo)
    }).catch((err) => {
        res.status(400).send('Error retrieving todo')
    })
})

//DELETE /todos/:id | deletes a todo by its id
app.delete('/todos/:id', (req, res) => {
    let id = req.params.id
    //validate id
    if (!ObjectID.isValid(id)){
        res.status(404).send(`INVALID id`)
        return
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        //if todo === null implies todo didn't exist in db
        if (todo === null){
            res.status(404).send(`todo with id: ${id} does not exist`)
            return
        }

        res.status(200).send(`todo with id: ${id} has been deleted`)
    }).catch(err => {
        res.status(400).send('Error deleting todo')
    })
})




let port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server deployed on port ${port}`)
})

module.exports = {
    app
}