const redis = require('redis')

const client = redis.createClient(process.env.REDIS_URL)

client.on('error', err => console.log(`Error ${err}`));

const rateLimiter = (req, res, next) => {
    const token = req.connection.remoteAddress // get the unique identifier for the user here
    // I am using ip address here but it can be token, API_KEY, etc
    client
        .multi() // starting a transaction
        .set([token, 0, 'EX', 60, 'NX']) // SET UUID 0 EX 60 NX
        .incr(token) // INCR UUID
        .exec((err, replies) => {
            if (err) {
                return res.status(500).send(err.message)
            }
            const reqCount = replies[1]
            if (reqCount > 20) {
                return res
                    .status(403)
                    .send(`Quota of ${20} per ${60}sec exceeded`)
            }
            return next()
        })
}

module.exports = { rateLimiter }