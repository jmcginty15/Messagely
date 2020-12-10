/** User class for message.ly */

const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require("../db");


/** User of the site. */

class User {

  static async register({ username, password, first_name, last_name, phone }) {
    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const join_at = new Date();
    const last_login_at = join_at;
    const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone, join_at, last_login_at]);
    return results.rows[0];
  }

  static async authenticate(username, password) {
    /** Authenticate: is this username/password valid? Returns boolean. */

    const results = await db.query(`SELECT password FROM users
        WHERE username = $1`,
      [username]);
    const userPassword = results.rows[0].password;
    const verified = await bcrypt.compare(password, userPassword);
    return verified;
  }

  static async updateLoginTimestamp(username) {
    /** Update last_login_at for user */

    const last_login_at = new Date();
    await db.query(`UPDATE users
        SET last_login_at = $1
        WHERE username = $2`,
      [last_login_at, username]);
  }

  static async all() {
    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return results.rows;
  }

  static async get(username) {
    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
        WHERE username = $1`,
      [username]);
    return results.rows[0];
  }

  static async messagesFrom(username) {
    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    const messageResults = await db.query(`SELECT id, to_username, body, sent_at, read_at FROM messages
        WHERE from_username = $1`,
      [username]);
    const messages = messageResults.rows;

    for (let message of messages) {
      const toUserResults = await db.query(`SELECT username, first_name, last_name, phone FROM users
          WHERE username = $1`,
        [message.to_username]);
      message.to_user = toUserResults.rows[0];
      delete message.to_username;
    }

    return messages;
  }

  static async messagesTo(username) {
    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {id, first_name, last_name, phone}
     */

    const messageResults = await db.query(`SELECT id, from_username, body, sent_at, read_at FROM messages
        WHERE to_username = $1`,
      [username]);
    const messages = messageResults.rows;

    for (let message of messages) {
      const toUserResults = await db.query(`SELECT username, first_name, last_name, phone FROM users
          WHERE username = $1`,
        [message.from_username]);
      message.from_user = toUserResults.rows[0];
      delete message.from_username;
    }

    return messages;
  }
}


module.exports = User;