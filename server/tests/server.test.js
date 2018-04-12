const expect = require('expect')
const request = require('supertest')
const app = require('../server').app
const Todo = require('../models/todo').Todo
const User = require('../models/user').User

//deleting all docs from Todo before running
beforeEach((done) => {
    Todo.remove({}).then((success) => {
        done()
    }, (err) => {
        console.log(err)
    })
})

describe('POST /todos', () => {

    let text = 'Test todo'

    //sending a post request to app to save doc. 
    //If the db doesn't have exactly one doc in it then there is an error
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
                Todo.find().then((todos) => {
                    expect(todos.length).toBe(1)
                    expect(todos[0].text).toBe(text)
                    done()
                }, (err) => {
                    done(err)
                })
            })
    })

    //sending invalid data and testing if no doc is stored in todos db which is the desired behavior
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
                    expect(todos.length).toBe(0)
                    done()
                }, (err) => {
                    done(err)
                })

            })
    })
})