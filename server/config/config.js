//by changing env we can differentiate between production,development and test databases
//note that heroku sets node_env to production and MONGODB_URI and by default node_env is undefined
//note that test is activated on the test script in npm test seen in package.json

let env = process.env.NODE_ENV || 'development'
let config = require('./config.json')

//for local databases
if (env === 'development' || env === 'test'){
    let envConfig = config[env]
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key]
    })
}

//for production databases note that PORT and mongodb_uri are set by HEROKU
if (env === 'production'){
    process.env.JWT_SECRET = config.production.JWT_SECRET
}

