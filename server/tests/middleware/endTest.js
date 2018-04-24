const endTest = (err, res, done) => {
    if(err){
        done(err)
        return
    }

    done()
}

module.exports = {
    endTest
}