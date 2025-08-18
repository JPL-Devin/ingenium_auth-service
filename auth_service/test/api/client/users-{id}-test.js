'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var customFormats = module.exports = function(zSchema) {
  // Placeholder file for all custom-formats in known to swagger.json
  // as found on
  // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#dataTypeFormat

  var decimalPattern = /^\d{0,8}.?\d{0,4}[0]+$/;

  /** Validates floating point as decimal / money (i.e: 12345678.123400..) */
  zSchema.registerFormat('double', function(val) {
    return !decimalPattern.test(val.toString());
  });

  /** Validates value is a 32bit integer */
  zSchema.registerFormat('int32', function(val) {
    // the 32bit shift (>>) truncates any bits beyond max of 32
    return Number.isInteger(val) && ((val >> 0) === val);
  });

  zSchema.registerFormat('int64', function(val) {
    return Number.isInteger(val);
  });

  zSchema.registerFormat('float', function(val) {
    // should parse
    return Number.isInteger(val);
  });

  zSchema.registerFormat('date', function(val) {
    // should parse a a date
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('dateTime', function(val) {
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('password', function(val) {
    // should parse as a string
    return typeof val === 'string';
  });
};

customFormats(ZSchema);

var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('https://100.64.153.9'); // supertest init;
var expect = chai.expect;

require('dotenv').load();

describe('/users/{id}', function() {
  describe('get', function() {
    it('should respond with 200 Success. The name, id, and...', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "username": {
            "type": "string"
          },
          "display_name": {
            "type": [
              "string",
              "null"
            ]
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with 401 Unauthorized (credentials...', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect(401)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with 403 Forbidden (improper or no...', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect(403)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with 404 Not found', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with default General Error', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect('DEFAULT RESPONSE CODE HERE')
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

  });

  describe('put', function() {
    it('should respond with 200 user edited successfully...', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "username": {
            "type": "string"
          },
          "display_name": {
            "type": [
              "string",
              "null"
            ]
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.put('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .send({
        data: 'DATA GOES HERE'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with 401 Unauthorized (credentials...', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.put('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .send({
        data: 'DATA GOES HERE'
      })
      .expect(401)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with 403 Forbidden (improper or no...', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.put('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .send({
        data: 'DATA GOES HERE'
      })
      .expect(403)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with default Error', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.put('/users/{id PARAM GOES HERE}')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .send({
        data: 'DATA GOES HERE'
      })
      .expect('DEFAULT RESPONSE CODE HERE')
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

  });

});
