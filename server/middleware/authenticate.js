const User = require('../models/user').User

//middleware that authenticates user and assigns user to req.user
let authenticate = async (req, res, next) => {
    let token = req.cookies['x-auth']
    //if token doesn't exist then return 401 for unauthorized user
    if(!token){
        res.status(401).send()
        return
    }
    try{
        let user = await User.findByToken(token)
        if (!user){
            throw new Error('User not found')
        }
        req.user = user
        next()
    }catch(err){
        res.status(404).send()
    }
}

module.exports = {
    authenticate
}