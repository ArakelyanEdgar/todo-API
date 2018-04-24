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
app.post('/todos', authenticate,  async (req, res) => {
    let todo = new Todo({
        text: req.body.text,
        owner: req.user._id
    })

    try{
        todo = await todo.save()
        res.status(200).send(todo)
    }catch(err){
        res.status(400).send(err)
    }
})

//GET /todos | returns all todos for the authenticated user
app.get('/todos',authenticate, async (req, res) => {
    try{
        let todos = await Todo.find({owner:req.user._id})
        if(todos.length === 0){
            res.status(200).send('Sorry, you have no todos!')
            return
        }
        res.status(200).send(todos)
    }catch(err){
        res.status(400).send(err)
    }
})

//GET /todos/:id | returns todo of passed id
app.get('/todos/:id', async (req, res) => {
    //check if id is invalid
    let id = req.params.id
    if (!ObjectID.isValid(id)){
        res.status(404).send('INVALID id')
        return
    }

    try{
        let todo = await Todo.findById(id)
        if (todo === null){
            res.status(404).send(`todo with id: ${id} does not exist`)
            return
        }
        res.status(200).send(todo)
    }catch(err){
        res.status(400).send('Error retrieving todo')
    }
})

//DELETE /todos/:id | deletes a todo by its id if user is authenticated
app.delete('/todos/:id', authenticate, async (req, res) => {
    let id = req.params.id
    //validate id
    if (!ObjectID.isValid(id)){
        res.status(404).send(`INVALID id`)
        return
    }

    try{
        let todo = await Todo.findById(id)
        //if todo === null implies todo didn't exist in db
        if (todo === null){
            res.status(404).send(`todo with id: ${id} does not exist`)
            return
        }

        //todo.owner must be user
        if (todo.owner.toHexString() != req.user._id.toHexString()){
            res.status(401).send()
            return
        }
        todo = await todo.remove()
        res.status(200).send(`todo ${todo} has been deleted`)
    }catch(err){
        res.status(400).send('Error deleting todo')
    }
})

//PATCH /todos/:id | updates a todo by its id by authorized users only
app.patch('/todos/:id', authenticate, async (req, res) => {
    let todo_id = req.params.id

    //determine if id is valid
    if (!ObjectID.isValid(todo_id)){
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

    try{
        let todo = await Todo.findById(todo_id)
        if (!todo){
            res.status(400).send(`todo with id: ${id} does not exist`)
            return
        }

        //user must be owner of the todo
        if (todo.owner.toHexString() !== req.user._id.toHexString()){
            res.status(401).send()
            return
        }
        
        todo = await todo.update(body)
        res.status(200).send()
    }catch(err){
        res.status(400).send(err)
    }
})

//POST /users | creates a user if user is authenticated
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
app.post('/users/login', async (req, res) => {
    let body = _.pick(req.body, 'email', 'password')

     try{
         let user = await User.findOne({email: body.email})
         if (!user)
             throw new Error()
         try{
             user = await user.verifyPassword(body.password)
             res.cookie('x-auth', user.tokens[0].token).status(200).send()
         }catch(err){
             res.status(401).send('Invalid email or password')
         }
     }catch(err){
         res.status(404).send(err)
     }
})



//GET /users/me | accesses signed in user's private route
app.get('/users/me', authenticate, (req, res) => {
    res.status(200).send(req.user)
})

//DELETE /users/me/token | removes cookie 
app.delete('/users/me/logout', authenticate, (req, res) => {
    //clear cookie
    res.clearCookie('x-auth')
    res.status(200).send()
})

//PATCH /users/me/update | allows users to update their information
app.patch('/users/me/update', authenticate, async (req, res) => {
    let body = _.pick(req.body, 'description')
    //if description doesn't exist we should send bad request error
    if(!body.description){
        res.status(400).send()
        return
    }

    let id = req.user._id

    try{
        let user = await User.findByIdAndUpdate(id, body, {new: true})
        res.status(200).send(user)
    }catch(err){
        res.status(400).send('Error updating')
    }
})

//POST /users/me/addfriend | adds a friend to the authenticated user
app.post('/users/me/friends', authenticate, async (req, res) => {
    let body = _.pick(req.body, 'email')

    //if email isn't provided then bad request
    if (!body.email){
        res.status(400).send()
        return
    }

    try{
        //check if user with email exists
        let user = await User.findOne(body)
        if (!user){
            throw new Error()
        }
        //add friend to the user's friends list
        await req.user.addFriend(body.email)
        res.status(200).send(`${body.email} has been added to your friend's list`)
    }catch(err){
        res.status(400).send('Error friending user :(')
    }
}) 



let port = process.env.PORT
app.listen(port, () => {
    console.log(`Server deployed on port ${port}`)
})

module.exports = {
    app
}