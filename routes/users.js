const express = require("express");

const User = require("../models/user");
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const { messagesFrom } = require("../models/user");

const router = new express.Router();

router.get('/', ensureLoggedIn, async (request, response, next) => {
    /** GET / - get list of users.
     *
     * => {users: [{username, first_name, last_name, phone}, ...]}
     *
     **/

    try {
        const users = await User.all();
        return response.json({ users: users });
    } catch (err) {
        return next(err);
    }
});

router.get('/:username', ensureCorrectUser, async (request, response, next) => {
    /** GET /:username - get detail of users.
     *
     * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
     *
     **/

    try {
        const user = await User.get(request.params.username);
        return response.json({ user: user });
    } catch (err) {
        return next(err);
    }
});

router.get('/:username/to', ensureCorrectUser, async (request, response, next) => {
    /** GET /:username/to - get messages to user
     *
     * => {messages: [{id,
     *                 body,
     *                 sent_at,
     *                 read_at,
     *                 from_user: {username, first_name, last_name, phone}}, ...]}
     *
     **/

    try {
        const messages = await User.messagesTo(request.params.username);
        return response.json({ messages: messages });
    } catch (err) {
        return next(err);
    }
});

router.get('/:username/to', ensureCorrectUser, async (request, response, next) => {
    /** GET /:username/from - get messages from user
     *
     * => {messages: [{id,
     *                 body,
     *                 sent_at,
     *                 read_at,
     *                 to_user: {username, first_name, last_name, phone}}, ...]}
     *
     **/
    try {
        const messages = await User.messagesFrom(request.params.username);
        return response.json({ messages: messages });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;