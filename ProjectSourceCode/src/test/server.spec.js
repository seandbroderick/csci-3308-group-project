// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

describe('Testing Register API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'Ethan Meli', password: 'ethantest123'})
      .end((err, res) => {
        res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/);
        done();
      });
  });

  it('Negative : /register. Invalid parameter', done => {
    chai
      .request(server)
      .post('/register')
      .send({name: 10, password: 'ethantest123'})
      .end((err, res) => {
        res.should.redirectTo(/^.*127\.0\.0\.1.*\/register$/);
        done();
      });
  });
});

describe('Testing Login', () => {
  it('Get /login', done => {
    chai
      .request(server)
      .get('/login')
      .end((err, res) => {
        res.should.be.html;
        done();
      });
  });

  it('Negative : /login. Invalid parameter', done => {
    chai
      .request(server)
      .post('/login')
      .send({name: '123', password: 'ethantest'})
      .end((err, res) => {
        res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/);
        done();
      });
  });
});