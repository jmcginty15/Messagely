const express = require("express");

const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");

const router = new express.Router();

router.get('/:id', ensureLoggedIn, async (request, response, next) => {
    /** GET /:id - get detail of message.
     *
     * => {message: {id,
     *               body,
     *               sent_at,
     *               read_at,
     *               from_user: {username, first_name, last_name, phone},
     *               to_user: {username, first_name, last_name, phone}}
     *
     * Make sure that the currently-logged-in users is either the to or from user.
     *
     **/

    try {
        const message = await Message.get(request.params.id);

        if (request.user.username === message.to_user.username || request.user.username === message.from_user.username) {
            return response.json({ message: message });
        } else {
            throw new ExpressError('Unauthorized', 401);
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/', ensureLoggedIn, async (request, response, next) => {
    /** POST / - post message.
     *
     * {to_username, body} =>
     *   {message: {id, from_username, to_username, body, sent_at}}
     *
     **/

    try {
        const message = request.body;
        message.from_username = request.user.username;
        const sentMessage = await Message.create(message);
        return response.json({ message: sentMessage });
    } catch (err) {
        return next(err);
    }
});

router.post('/:id/read', ensureLoggedIn, async (request, response, next) => {
    /** POST/:id/read - mark message as read:
     *
     *  => {message: {id, read_at}}
     *
     * Make sure that the only the intended recipient can mark as read.
     *
     **/

    try {
        const id = request.params.id;
        const message = await Message.get(id);

        if (request.user.username === message.to_user.username) {
            const readMessage = await Message.markRead(id);
            return response.json({ message: readMessage });
        } else {
            throw new ExpressError('Unauthorized', 401);
        }
    } catch (err) {
        return next(err);
    }
});

module.exports = router;