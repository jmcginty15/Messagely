const express = require("express");
const jwt = require('jsonwebtoken');

const User = require("../models/user");
const ExpressError = require("../expressError");
const { SECRET_KEY } = require('../config');

const router = new express.Router();

router.post('/login', async (request, response, next) => {
    /** POST /login - login: {username, password} => {token}
     *
     * Make sure to update their last-login!
     *
     **/

    try {
        const { username, password } = request.body;
        const user = await User.get(username);

        if (user) {
            const authenticated = await User.authenticate(username, password);

            if (authenticated) {
                await User.updateLoginTimestamp(username);
                const token = jwt.sign(user, SECRET_KEY);
                return response.json({ token: token });
            } else {
                throw new ExpressError('Invalid password', 400);
            }
        } else {
            throw new ExpressError('User not found', 400);
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/register', async (request, response, next) => {
    /** POST /register - register user: registers, logs in, and returns token.
     *
     * {username, password, first_name, last_name, phone} => {token}.
     *
     *  Make sure to update their last-login!
     */

    try {
        const userInfo = request.body;
        const existingUser = await User.get(userInfo.username);

        if (existingUser) {
            throw new ExpressError('Username already taken', 400);
        } else {
            const user = await User.register(userInfo);
            const token = jwt.sign(user, SECRET_KEY);
            return response.json({ token: token });
        }
    } catch (err) {
        return next(err);
    }
});

module.exports = router;