const express = require("express");

const User = require("../models/user");
const Message = require("../models/message");

const router = new express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (request, response, next) => {
    try {

    } catch (err) {
        return next(err);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (request, response, next) => {
    try {
        // const userInfo = request.body;
        // const result = await User.authenticate(userInfo.username, userInfo.password);
        const result = await User.get('yeet');
        return response.json(result);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;