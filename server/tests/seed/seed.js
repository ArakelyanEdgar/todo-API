const Todo = require('../../models/todo').Todo
const User = require('../../models/user').User
const jwt = require('jsonwebtoken')
const {ObjectID} = require('mongodb')
//SEED.js will create the seed data for testing


//creating dummy users for testing, where userone has an auth token and user two doesnt
let useroneid = new ObjectID()
let usertwoid = new ObjectID()
const users = [{
    _id: useroneid,
    email: 'userone@gmail.com',
    password: 'abracadabra1',
    tokens: [{
        access: 'auth',
        token: jwt.sign({
            _id: useroneid.toHexString(),
            access: 'auth'
        }, process.env.JWT_SECRET).toString()
    }]
},{
    _id: usertwoid,
    email: 'usertwo@yahoo.com',
    password: 'abracadabra2',
}]

//creating dummy todos for testing 
const todos = [{
    text: 'First test todo',
    owner: useroneid
},{
    text: 'Second test todo',
    owner: usertwoid
}]

//resetting test db for todo collection and then storing dummy todos
const createTodos = todos => {
    return new Promise((resolve, reject) => {
        Todo.remove({}).then(() => {
            return Todo.insertMany(todos, (err, docs) => {
                if (err)
                    reject(err)
            })
        }).then(() => {
            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}

//resetting  test db for user collection and then storing dummy users
//createUsers uses .save instead of .insertMany because of mongoose middleware that saves passwords hashed by saving
const createUsers = (users) => {
    return new Promise((resolve, reject) => {
        User.remove({}).then(() => {
            let user = new User(users[0])
            return user.save()
        }).then(user => {
            return user.generateAuthToken()
        }).then(() => {
            let secondUser = new User(users[1])
            return secondUser.save()
        }).then(() => {
            resolve()
        })
        .catch(err => {
            reject(err)
        })
    })
}

module.exports = {
    todos,
    users,
    createTodos,
    createUsers
}