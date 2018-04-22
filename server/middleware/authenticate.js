const User = require('../models/user').User

//middleware that authenticates user and assigns user to req.user
let authenticate = (req, res, next) => {
    let token = req.cookies['x-auth']
    //if token doesn't exist then return 401 for unauthorized user
    if(!token){
        res.status(401).send()
        return
    }
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