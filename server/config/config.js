//by changing env we can differentiate between production,development and test databases
//note that heroku sets node_env to production and MONGODB_URI and by default node_env is undefined
//note that test is activated on the test script in npm test seen in package.json
let env = process.env.NODE_ENV || 'development'

if (env === 'development'){
    process.env.PORT = 3000
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp'
}
else if (env === 'test'){
    process.env.PORT = 3000
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest'
}