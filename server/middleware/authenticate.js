const User = require('../models/user').User

//middleware that authenticates user and assigns user to req.user
let authenticate = (req, res, next) => {
    let token = req.header('x-auth')

    User.findByToken(token).then(user => {
        if (user === null){
            next()
        }

        //attach user to req
        req.user = user
        next()
    }).catch(err => {
        next()
    })
}

module.exports = {
    authenticate
}