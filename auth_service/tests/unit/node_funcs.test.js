'use strict';

const MESSAGE = Symbol.for('message');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../env_config.js', () => ({
  PUBLIC_PEM: 'test-public-pem',
  PRIVATE_PEM: 'test-private-pem',
  db_name: 'auth',
  db_username: 'root',
  db_password: '',
  db_host: 'localhost',
  ldap_url: '',
  env: 'test',
  test_user: '',
  test_pass: '',
  long_expire: 43200,
  AUTH_METHOD: 'password',
  RSA_URL: '',
  RSA_CLIENT_ID: '',
  RSA_CLIENT_KEY: '',
  ACCESS_TOKEN_TIMEOUT: '3410s',
  TEN_SEC_OFFSET: 10,
  PORT: 8080,
  LOG_LEVEL: 'DEBUG',
}));

describe('node_funcs', () => {
  let node_funcs;
  let jwt;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('jsonwebtoken', () => ({
      verify: jest.fn(),
    }));
    jest.mock('../../env_config.js', () => ({
      PUBLIC_PEM: 'test-public-pem',
      PRIVATE_PEM: 'test-private-pem',
      db_name: 'auth',
      db_username: 'root',
      db_password: '',
      db_host: 'localhost',
      ldap_url: '',
      env: 'test',
      test_user: '',
      test_pass: '',
      long_expire: 43200,
      AUTH_METHOD: 'password',
      RSA_URL: '',
      RSA_CLIENT_ID: '',
      RSA_CLIENT_KEY: '',
      ACCESS_TOKEN_TIMEOUT: '3410s',
      TEN_SEC_OFFSET: 10,
      PORT: 8080,
      LOG_LEVEL: 'DEBUG',
    }));
    node_funcs = require('../../node_funcs.js');
    jwt = require('jsonwebtoken');
  });

  describe('parse_username', () => {
    test('returns username from valid JWT token', () => {
      jwt.verify.mockReturnValue({ username: 'testuser' });
      const result = node_funcs.parse_username('Bearer valid-token');
      expect(result).toBe('testuser');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-public-pem', { algorithms: ['RS256'] });
    });

    test('returns empty string when authorization header is empty', () => {
      const result = node_funcs.parse_username('');
      expect(result).toBe('');
    });

    test('returns empty string when authorization header is undefined', () => {
      const result = node_funcs.parse_username(undefined);
      expect(result).toBe('');
    });
  });

  describe('String.prototype.format', () => {
    test('replaces placeholders with arguments', () => {
      const result = 'Hello {0}, welcome to {1}'.format('user', 'app');
      expect(result).toBe('Hello user, welcome to app');
    });

    test('handles single placeholder', () => {
      const result = 'element id is {0}'.format('elem123');
      expect(result).toBe('element id is elem123');
    });

    test('returns original string with no placeholders', () => {
      const result = 'no placeholders here'.format('arg1');
      expect(result).toBe('no placeholders here');
    });
  });

  describe('logger', () => {
    test('log object is defined', () => {
      expect(node_funcs.log).toBeDefined();
    });

    test('log has expected methods', () => {
      expect(typeof node_funcs.log.info).toBe('function');
      expect(typeof node_funcs.log.error).toBe('function');
      expect(typeof node_funcs.log.debug).toBe('function');
    });

    test('logger uses custom log levels', () => {
      expect(node_funcs.log.levels).toHaveProperty('critical');
      expect(node_funcs.log.levels).toHaveProperty('error');
      expect(node_funcs.log.levels).toHaveProperty('warning');
      expect(node_funcs.log.levels).toHaveProperty('info');
      expect(node_funcs.log.levels).toHaveProperty('debug');
      expect(node_funcs.log.levels).toHaveProperty('trace');
    });

    test('logger creates with default log level debug when LOG_LEVEL not set', () => {
      expect(node_funcs.log.level).toBe('debug');
    });

    test('logger creates with custom LOG_LEVEL env var', () => {
      jest.resetModules();
      process.env.LOG_LEVEL = 'INFO';
      jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
      jest.mock('../../env_config.js', () => ({
        PUBLIC_PEM: 'test-pem',
        db_name: 'auth', db_username: 'root', db_password: '', db_host: 'localhost',
        ldap_url: '', env: 'test', test_user: '', test_pass: '', long_expire: 43200,
        AUTH_METHOD: 'password', RSA_URL: '', RSA_CLIENT_ID: '', RSA_CLIENT_KEY: '',
        ACCESS_TOKEN_TIMEOUT: '3410s', TEN_SEC_OFFSET: 10, PORT: 8080, LOG_LEVEL: 'DEBUG',
      }));
      const nf = require('../../node_funcs.js');
      expect(nf.log.level).toBe('info');
      delete process.env.LOG_LEVEL;
    });
  });

  describe('json_formatter', () => {
    test('formats log entry with string meta', () => {
      const log = node_funcs.log;
      // We can test the formatter indirectly by logging
      expect(() => log.info('test message', 'string meta')).not.toThrow();
    });

    test('formats log entry with array meta', () => {
      const log = node_funcs.log;
      expect(() => log.info('test message', ['item1', 'item2'])).not.toThrow();
    });

    test('formats log entry with object meta', () => {
      const log = node_funcs.log;
      expect(() => log.info('test message', { key: 'value' })).not.toThrow();
    });

    test('formats log entry with no meta', () => {
      const log = node_funcs.log;
      expect(() => log.info('test message')).not.toThrow();
    });
  });
});
