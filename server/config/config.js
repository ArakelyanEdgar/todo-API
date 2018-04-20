//by changing env we can differentiate between production,development and test databases
//note that heroku sets node_env to production and MONGODB_URI and by default node_env is undefined
//note that test is activated on the test script in npm test seen in package.json
let env = process.env.NODE_ENV || 'development'

if (env === 'development' || env === 'test'){
    //in node require('xxxx.json') files automatically parses them
    let config = require('./config.json')
    console.log(config)
    let envConfig = config[env]
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key]
    })
}

