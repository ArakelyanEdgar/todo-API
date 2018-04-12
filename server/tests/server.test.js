const expect = require('expect')
const request = require('supertest')
const app = require('../server').app
const Todo = require('../models/todo').Todo
const User = require('../models/user').User

//creating dummy todos for testing GET /todos
const todos = [{
    text: 'First test todo'
},{
    text: 'Second test todo'
}]

//deleting all docs from Todo before running
beforeEach((done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos, (err, docs) => {
            if (err){
                return done(err)
            }
        })
    }).then(() => {
        done()
    }).catch((err) => {
        done(err)
    })
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
                text
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
                Todo.find().then((todos) => {
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