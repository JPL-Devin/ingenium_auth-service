'use strict';

describe('env_config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses default values when env vars are not set', () => {
    delete process.env.NODE_ENV;
    delete process.env.MYSQL_USERNAME;
    delete process.env.MYSQL_ROOT_PASSWORD;
    delete process.env.MYSQL_DATABASE;
    delete process.env.MYSQL_HOST;
    delete process.env.PUBLIC_PEM;
    delete process.env.PRIVATE_PEM;
    delete process.env.USERNAME;
    delete process.env.PASSWORD;
    delete process.env.LONG_EXPIRE;
    delete process.env.AUTH_METHOD;
    delete process.env.LDAP_URL;
    delete process.env.RSA_URL;
    delete process.env.RSA_CLIENT_ID;
    delete process.env.RSA_CLIENT_KEY;

    const env_config = require('../../env_config.js');

    expect(env_config.env).toBe('development');
    expect(env_config.db_username).toBe('root');
    expect(env_config.db_password).toBe('');
    expect(env_config.db_name).toBe('auth');
    expect(env_config.db_host).toBe('auth_service_mysql');
    expect(env_config.PUBLIC_PEM).toBe('');
    expect(env_config.PRIVATE_PEM).toBe('');
    expect(env_config.AUTH_METHOD).toBe('password');
    expect(env_config.ACCESS_TOKEN_TIMEOUT).toBe('3410s');
    expect(env_config.TEN_SEC_OFFSET).toBe(10);
    expect(env_config.PORT).toBe(8080);
    expect(env_config.LOG_LEVEL).toBe('DEBUG');
  });

  test('uses env var values when they are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.MYSQL_USERNAME = 'admin';
    process.env.MYSQL_ROOT_PASSWORD = 'secret123';
    process.env.MYSQL_DATABASE = 'mydb';
    process.env.MYSQL_HOST = 'db.example.com';
    process.env.PUBLIC_PEM = 'my-public-pem';
    process.env.PRIVATE_PEM = 'my-private-pem';
    process.env.AUTH_METHOD = 'ldap';
    process.env.LDAP_URL = 'ldap://ldap.example.com';
    process.env.RSA_URL = 'https://rsa.example.com';
    process.env.RSA_CLIENT_ID = 'client1';
    process.env.RSA_CLIENT_KEY = 'key123';
    process.env.LONG_EXPIRE = '86400';

    const env_config = require('../../env_config.js');

    expect(env_config.env).toBe('production');
    expect(env_config.db_username).toBe('admin');
    expect(env_config.db_password).toBe('secret123');
    expect(env_config.db_name).toBe('mydb');
    expect(env_config.db_host).toBe('db.example.com');
    expect(env_config.PUBLIC_PEM).toBe('my-public-pem');
    expect(env_config.PRIVATE_PEM).toBe('my-private-pem');
    expect(env_config.AUTH_METHOD).toBe('ldap');
    expect(env_config.ldap_url).toBe('ldap://ldap.example.com');
    expect(env_config.RSA_URL).toBe('https://rsa.example.com');
    expect(env_config.RSA_CLIENT_ID).toBe('client1');
    expect(env_config.RSA_CLIENT_KEY).toBe('key123');
    expect(env_config.long_expire).toBe('86400');
  });
});
