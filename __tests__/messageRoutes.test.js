const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


describe("Message Routes Test", function () {

    beforeAll(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

        const u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000"
        });

        const u2 = await User.register({
            username: "test2",
            password: "password2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550000"
        });

        const u3 = await User.register({
            username: "test3",
            password: "password3",
            first_name: "Test3",
            last_name: "Testy3",
            phone: "+14155550000"
        });

        const m1 = await Message.create({ from_username: "test1", to_username: "test2", body: "1 to 2" });
        const m2 = await Message.create({ from_username: "test2", to_username: "test1", body: "2 to 1" });
    });

    /** GET /messages/:id => {message: {id,
     *                                  body,
     *                                  sent_at,
     *                                  read_at,
     *                                  from_user: {username, first_name, last_name, phone},
     *                                  to_user: {username, first_name, last_name, phone}}  */

    describe("GET /messages/:id", function () {
        test("gets message by id if logged in user is sender", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;
            const messageResponse = await db.query(`SELECT id FROM messages
                WHERE from_username = $1`,
                ["test1"]);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).get(`/messages/${messageId}`).send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                message: {
                    id: expect.any(Number),
                    body: "1 to 2",
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: { username: "test1", first_name: "Test1", last_name: "Testy1", phone: "+14155550000" },
                    to_user: { username: "test2", first_name: "Test2", last_name: "Testy2", phone: "+14155550000" }
                }
            });
        });

        test("gets message by id if logged in user is recipient", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;
            const messageResponse = await db.query(`SELECT id FROM messages
                WHERE to_username = $1`,
                ["test1"]);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).get(`/messages/${messageId}`).send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                message: {
                    id: expect.any(Number),
                    body: "2 to 1",
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: { username: "test2", first_name: "Test2", last_name: "Testy2", phone: "+14155550000" },
                    to_user: { username: "test1", first_name: "Test1", last_name: "Testy1", phone: "+14155550000" }
                }
            });
        });

        test("responds unauthorized if jwt not included", async function () {
            const messageResponse = await db.query(`SELECT id FROM messages`);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).get(`/messages/${messageId}`);
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });

        test("responds unauthorized if logged in user is neither sender nor recipient", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test3", password: "password3" });
            const token = loginResponse.body.token;
            const messageResponse = await db.query(`SELECT id FROM messages`);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).get(`/messages/${messageId}`).send({ _token: token });
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });

    /** POST /messages/ => {message: {id, from_username, to_username, body, sent_at}}  */

    describe("POST /messages/", function () {
        test("post a message", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).post("/messages/").send({
                _token: token,
                to_username: "test3",
                body: "1 to 3"
            });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                message: {
                    id: expect.any(Number),
                    from_username: "test1",
                    to_username: "test3",
                    body: "1 to 3",
                    sent_at: expect.any(String)
                }
            });
        });

        test("responds unauthorized if token not included", async function () {
            const response = await request(app).post("/messages/").send({
                to_username: "test3",
                body: "1 to 3"
            });
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });

    /** GET /users/:username/to => {messages: [{id,
     *                                          body,
     *                                          sent_at,
     *                                          read_at,
     *                                          from_user: {username, first_name, last_name, phone}}, ...]}  */

    describe("GET /users/:username/to", function () {
        test("get user's received messages", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test1/to").send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                messages: [
                    {
                        id: expect.any(Number),
                        body: "2 to 1",
                        sent_at: expect.any(String),
                        read_at: null,
                        from_user: { username: "test2", first_name: "Test2", last_name: "Testy2", phone: "+14155550000" }
                    }
                ]
            })
        });

        test("responds unauthorized if token not included", async function () {
            const response = await request(app).get("/users/test1/to");
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });

        test("responds unauthorized if token does not belong to the requested user", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test2/to").send({ _token: token });
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });

    /** POST /messages/:id/read => {message: {id, read_at}}  */

    describe("POST /messages/:id/read", function () {
        test("mark message read", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;
            const messageResponse = await db.query(`SELECT id FROM messages
                WHERE to_username = $1`,
                ["test1"]);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).post(`/messages/${messageId}/read`).send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                message: {
                    id: expect.any(Number),
                    read_at: expect.any(String)
                }
            })
        });

        test("responds unauthorized if token not included", async function () {
            const messageResponse = await db.query(`SELECT id FROM messages`);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).post(`/messages/${messageId}/read`);
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });

        test("responds unauthorized if logged in user is not recipient", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test3", password: "password3" });
            const token = loginResponse.body.token;
            const messageResponse = await db.query(`SELECT id FROM messages
                WHERE to_username = $1`,
                ["test1"]);
            const messageId = messageResponse.rows[0].id;

            const response = await request(app).post(`/messages/${messageId}/read`).send({ _token: token });
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });
});

afterAll(async function () {
    await db.end();
});
