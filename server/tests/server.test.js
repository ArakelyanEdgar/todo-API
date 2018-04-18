const expect = require('expect')
const request = require('supertest')
const app = require('../server').app
const Todo = require('../models/todo').Todo
const User = require('../models/user').User
const {todos, users, createTodos, createUsers} = require('./seed/seed')
const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')

//deleting all docs from Todo before running
beforeEach((done) => {
    createTodos(todos)
        .then(() => {
            return createUsers(users)
        })
        .then(() => done())
        .catch(done => done(err))
})

describe('POST /todos', () => {
    let text = 'Test todo'

    //sending a post request to app to save doc. 
    //If the db doesn't have exactly one doc with the ascribed text then there is an error
    //if db has a single doc then it's text field must be the doc's text
    it('Responds with saved todo', (done) => {
        request(app)
            .post('/todos')
            .send({
                text,
                owner: new ObjectID()
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1)
                    expect(todos[0].text).toBe(text)
                    done()
                }, (err) => {
                    done(err)
                })
            })
    })

    //sending invalid data and testing if no doc is stored in todos db which is the desired behavior, not there are 2 dummy todos
    it('Should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send({
            })
            .expect(400)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2)
                    done()
                }, (err) => {
                    done(err)
                })

            })
    })
})

//testing GET, should only return 2 docs whose text are equivalent to the dummy todos
describe('GET /todos', () => {

    it('Should only return dummy todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) =>{
                expect(res.body.length).toBe(2)
            })
            .end((err,res) => {
                
                if (err){
                    done(err)
                    return
                }
                //checking only dummy todos exist
                Todo.find().then(todos => {
                    expect(todos[0].text).toBe('First test todo')
                    expect(todos[1].text).toBe('Second test todo')
                    done()
                }, (err) => {
                    done(err)
                })
            })      
    })

})

describe('GET /todos/:id', () => {

    it('Should return 404 for invalid id', (done) => {
        request(app)
            .get('/todos/1')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should return 404 for nonexistent id', (done) => {
        request(app)
            .get('/todos/5acef7987b2c8628fcb56a67')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should return 200 for id that exists in Todo db', (done) => {
        let id = ""
        Todo.findOne().then((doc) => {
            id = doc._id
        }).then(() => {
            request(app)
                .get(`/todos/${id}`)
                .expect(200)
                .end((err, res) => {
                    if (err){
                        done(err)
                        return
                    }
    
                    done()
                })
        }).catch(err => {
            done(err)
        })
    })
})

describe('DELETE /todos/:id', () => {
    it('Should respond with status 404 for invalid id', (done) => {
        request(app)
            .delete('/todos/1')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should respond with status 404 for id that does not exist in db', (done) => {
        request(app)
            .delete('/todos/5ad01e3843b4bb0d0c9de6c9')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should respond with status 200 for deleting id', (done) => {
        Todo.findOne().then(doc => {
            let id = doc._id
            request(app)
                .delete(`/todos/${id}`)
                .expect(200)
                .end((err, res) => {
                    if (err){
                        done(err)
                        return
                    }
    
                    done()
                })
        }).catch(err => {
            done(err)
        })
    })
})

describe('PATCH /todos/:id', () => {
    it('Should respond with 404 status for invalid id', (done) => {
        request(app)
            .patch('/todos/1')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should respond with 404 status for id that is not in todo db', (done) => {
        request(app)
            .patch('/todos/00000000bcf86cd799439011')
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should respond with 200 status for id that is in todo', (done) => {
        Todo.findOne().then(todo => {
            let id = todo._id
            let text = 'Updated text test'
            let completed = true
            request(app)
            .patch(`/todos/${id}`)
            .send({
                text,
                completed
            })
            .expect(200)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
        }).catch(err => {
            done(err)
        })
    })
})

describe('POST /users', () => {

    it('Should return STATUS 200 for user posting', (done) => {
        let userID = new ObjectID()
        let user = {
            _id: userID,
            email: 'userPostTest@gmail.com',
            password: 'passwordtest',
            tokens: [{
                access: 'auth',
                token: jwt.sign({
                    _id: userID.toHexString(),
                    access: 'auth'
                }, 'secret').toString()
            }]
        }

        request(app)
            .post('/users')
            .send(user)
            .expect(200)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })
})

describe('GET /users/me', () => {

    it('Should return STATUS 401 for user without auth', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .end((err,res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    //user is authorized because req.header is set to auth token
    it('Should return STATUS 200 for user with auth', (done) => {
        let token = users[0].tokens[0].token
        request(app)
            .get('/users/me')
            .set('x-auth', token)
            .set('Cookie', [`x-auth=${token}`])
            .expect(200)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })
})

describe('POST /users/login', () => {
    it('should return STATUS 404 for user that does not exist', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: 'bobfromidaho@gmail.com'
            })
            .expect(404)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should return STATUS 401 for user that is unauthorized with invalid password', (done) => {
        User.findOne().then(user => {
            let email = user.email
            let password = 'notrealpassword'

            request(app)
                .post('/users/login')
                .send({email, password})
                .expect(401)
                .end((err, res) => {
                    if (err){
                        done(err)
                        return
                    }
    
                    done()
                })
        }).catch(err => done(err))
    })

    it('should return STATUS 200 for user that is authorized with valid password', (done) => {
        let user = {
            email: 'testemail@gmail.com',
            password: 'password'
        }

        request(app)
            .post('/users')
            .send(user)
            .end((err, res) => {
                request(app)
                    .post('/users/login')
                    .send({
                        email: 'testemail@gmail.com',
                        password: 'password'
                    })
                    .expect(200)
                    .end((err, res) => {
                        if (err){
                            done(err)
                            return
                        }

                        done()
                    })
            })
    })
})

describe('DELETE /users/me/logout', () => {
    //will always be 401 since we are not setting cookies
    it('Should return STATUS 401 for unauthorized user', (done) => {
        request(app)
            .delete('/users/me/logout')
            .expect(401)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })

    it('Should return STATUS 200 for authorized user', (done) => {
        let token = users[0].tokens[0].token
        request(app)
            .delete('/users/me/logout')
            .set('Cookie', [`x-auth=${token}`])
            .expect(200)
            .end((err, res) => {
                if (err){
                    done(err)
                    return
                }

                done()
            })
    })
})