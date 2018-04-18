require('./config/config')

const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')
const cookieParser = require('cookie-parser')

//MONGOOSE/MONGODB related libraries
const mongoose = require('./db/mongoose.js').mongoose
const User = require('./models/user').User
const Todo = require('./models/todo').Todo
const ObjectID = require('mongodb').ObjectID

const app = express()

//MIDDLEWARE LIBRARIES
const {authenticate} = require('./middleware/authenticate')


//EXPRESS MIDDLEWARE
app.use(bodyParser.json())
app.use(cookieParser())

//POST /todos | saves todo in body to todos db
app.post('/todos', authenticate,  (req, res) => {

    if (!req.user){
        res.status(401).send()
        return
    }

    let todo = new Todo({
        text: req.body.text,
        owner: req.user._id
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
    
    //hashes the user's password and saves it to document and then saves the auth token and if there is no error
    //then it will send a 200
    user.save().then(user => {
        return user.generateAuthToken()
        // res.status(200).send(doc)
    }).then(token => {
        //x-auth will allow us to verify for GET and PATCH, and note we do not want to res.send the password
        res.clearCookie('x-auth')
        res.cookie('x-auth', token).status(200).send(_.pick(user, '_id', 'email'))
    })
    .catch(err => {
        res.status(400).send(err)
    })
})

//POST /users/login | 'logs in' by creating an x-auth cookie
app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, 'email', 'password')

    User.findOne({
        email: body.email
    }).then(user => {
        //we have to compare the hashed password stored in user with password
        user.verifyPassword(body.password).then((user) => {
            //user is verified so we must set a cookie x-auth to user for persistent authentication
            res.cookie('x-auth', user.tokens[0].token)
            res.status(200).send()
        }).catch(() => {
            res.status(401).send()
        })
    })
    .catch(err => {
        res.status(404).send(err)
    })
})



//GET /users/me | accesses signed in user's private route
app.get('/users/me', authenticate, (req, res) => {
    if (!req.user){
        res.status(401).send()
        return
    }
    res.status(200).send(req.user)
})

//DELETE /users/me/token | removes cookie 
app.delete('/users/me/logout', authenticate, (req, res) => {
    if (!req.user){
        res.status(401).send()
        return
    }

    //clear cookie
    res.clearCookie('x-auth')
    res.status(200).send()
})

//PATCH /users/me/update | allows users to update their information
app.patch('/users/me/update', authenticate, (req, res) => {
    //check if user is authorized
    if (!req.user){
        res.status(401).send()
        return
    }

    let body = _.pick(req.body, 'description')
    //if description doesn't exist we should send bad request error
    if(!body.description){
        res.status(400).send()
    }


    let id = req.user._id
    User.findByIdAndUpdate(id, body, {new: true}).then((user) => {
        //note that we do not have to check if user === null because user is authorized
        res.status(200).send(user)
    }).catch(err => {
        res.status(400).send(err)
    })
})


let port = process.env.PORT
app.listen(port, () => {
    console.log(`Server deployed on port ${port}`)
})

module.exports = {
    app
}