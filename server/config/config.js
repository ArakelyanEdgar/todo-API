//by changing env we can differentiate between production,development and test databases
//note that heroku sets node_env to production and MONGODB_URI and by default node_env is undefined
//note that test is activated on the test script in npm test seen in package.json
let env = process.env.NODE_ENV || 'development'

//for local databases
if (env === 'development' || env === 'test'){
    //requiring json files parses them automatically
    let config = require('./config.json')
    let envConfig = config[env]
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key]
    })
}

//for production databases I set heroku:config jwt_secret=....


