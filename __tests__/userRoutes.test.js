const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


describe("User Routes Test", function () {

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

        const m1 = await Message.create({ from_username: "test1", to_username: "test2", body: "1 to 2" });
        const m2 = await Message.create({ from_username: "test2", to_username: "test1", body: "2 to 1" });
    });

    /** GET /users/ => {users: [{username, first_name, last_name, phone}, ...]}  */

    describe("GET /users/", function () {
        test("gets full list of users", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/").send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                users: [
                    {
                        username: "test1",
                        first_name: "Test1",
                        last_name: "Testy1",
                        phone: "+14155550000"
                    },
                    {
                        username: "test2",
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155550000"
                    }]
            });
        });

        test("responds unauthorized if jwt not included", async function () {
            const response = await request(app).get("/users/");
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });

    /** GET /users/:username => {user: {username, first_name, last_name, phone, join_at, last_login_at}}  */

    describe("GET /users/:username", function () {
        test("get user details", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test1").send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                user: {
                    username: "test1",
                    first_name: "Test1",
                    last_name: "Testy1",
                    phone: "+14155550000",
                    join_at: expect.any(String),
                    last_login_at: expect.any(String)
                }
            });
        });

        test("responds unauthorized if token not included", async function () {
            const response = await request(app).get("/users/test1");
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });

        test("responds unauthorized if token does not belong to the requested user", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test2").send({ _token: token });
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

    /** GET /users/:username/from => {messages: [{id,
     *                                          body,
     *                                          sent_at,
     *                                          read_at,
     *                                          to_user: {username, first_name, last_name, phone}}, ...]}  */

    describe("GET /users/:username/from", function () {
        test("get user's sent messages", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test1/from").send({ _token: token });
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                messages: [
                    {
                        id: expect.any(Number),
                        body: "1 to 2",
                        sent_at: expect.any(String),
                        read_at: null,
                        to_user: { username: "test2", first_name: "Test2", last_name: "Testy2", phone: "+14155550000" }
                    }
                ]
            })
        });

        test("responds unauthorized if token not included", async function () {
            const response = await request(app).get("/users/test1/from");
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });

        test("responds unauthorized if token does not belong to the requested user", async function () {
            const loginResponse = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            const token = loginResponse.body.token;

            const response = await request(app).get("/users/test2/from").send({ _token: token });
            expect(response.statusCode).toBe(401);
            expect(response.body.error.message).toBe("Unauthorized");
        });
    });
});

afterAll(async function () {
    await db.end();
});
