const cookieSession = require("cookie-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const knex = require("../db/knex");
const bcrypt = require("bcrypt");

module.exports = function (app) {
  app.use(
    cookieSession({
      name: "session",
      keys: ["secret-key"],
      maxAge: 24 * 60 * 60 * 1000,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      function (username, password, done) {
        knex("users")
          .where({ name: username })
          .select("*")
          .then(async function (results) {
            if (results.length === 0) {
              return done(null, false, { message: "ユーザ名が存在しません" });
            } else if (await bcrypt.compare(password, results[0].password)) {
              return done(null, results[0]);
            } else {
              return done(null, false, { message: "パスワードが一致しません" });
            }
          })
          .catch(function (err) {
            console.error(err);
            return done(null, false, { message: err.toString() });
          });
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    knex("users")
      .where({ id: id })
      .select("*")
      .then(function (results) {
        done(null, results[0]);
      })
      .catch(function (err) {
        done(err, null);
      });
  });
};