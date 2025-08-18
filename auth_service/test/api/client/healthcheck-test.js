'use strict';

var chai = require('chai');
var supertest = require('supertest');
var api = supertest('https://100.64.153.9'); // supertest init;
var expect = chai.expect;

describe('/healthcheck', function() {
  describe('get', function() {
    it('should respond with 200 Success.', function(done) {
      api.get('/healthcheck')
      .set('Authorization', 'Bearer ' + process.env.INGENIUM_AUTH)
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.equal(''); // non-json response or no schema
        done();
      });
    });

  });

});
