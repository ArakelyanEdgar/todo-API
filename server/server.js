require('./config/config')

const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')

//MONGOOSE/MONGODB related libraries
const mongoose = require('./db/mongoose.js').mongoose
const User = require('./models/user').User
const Todo = require('./models/todo').Todo
const ObjectID = require('mongodb').ObjectID

const app = express()

//MIDDLEWARE LIBRARIES
const authenticate = require('./middleware/authenticate').authenticate


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

        res.status(200).send(`todo ${todo} has been deleted`)
    }).catch(err => {
        res.status(400).send('Error deleting todo')
    })
})

//PATCH /todos/:id | updates a todo by its id
app.patch('/todos/:id', (req, res) => {
    let id = req.params.id

    //determine if id is valid
    if (!ObjectID.isValid(id)){
        res.status(404).send('INVALID id')
        return
    }

    //Only allowing users to change text and completed properties of todo
    let body = _.pick(req.body, ['text', 'completed'])
    
    //check if completed is boolean
    if (!_.isBoolean(body.completed) && body.completed){
        res.status(400).send('completed must be a boolean')
        return
    }
    else if (body.completed)
        body.completedAt = Date.now()

    //updating todo and promise success passes the updated todo b/c of new:true
    Todo.findByIdAndUpdate(id, body, {new: true}).then(todo => {
        if (todo === null){
            res.status(404).send(`todo with id: ${id} does not exist`)
            return
        }

        res.status(200).send(`todo updated to: ${todo}`)
    }).catch(err => {
        res.status(400).send(err)
    })

})

//POST /users | creates a user
app.post('/users', (req, res) => {
    let body = _.pick(req.body, 'email', 'password')
    let user = new User(body)

    user.save().then(user => {
        return user.generateAuthToken()
        // res.status(200).send(doc)
    }).then(token => {
        //x-auth will allow us to verify for GET and PATCH easily
        //note we do not want to send password back to user
        res.header('x-auth', token).status(200).send(_.pick(user, '_id', 'email'))
    })
    .catch(err => {
        res.status(400).send(err)
    })
})

app.use(authenticate)

//GET /users/me | accesses signed in user's private route
app.get('/users/me', (req, res) => {
    if (!req.user){
        res.status(401).send()
        return
    }

    res.status(200).send(req.user)
})

let port = process.env.PORT
app.listen(port, () => {
    console.log(`Server deployed on port ${port}`)
})

module.exports = {
    app
}