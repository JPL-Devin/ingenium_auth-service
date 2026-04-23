'use strict';

jest.mock('../../server/models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    update: jest.fn(),
  },
  Group: {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
  },
  Role: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../redis.js', () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../node_funcs.js', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
    trace: jest.fn(),
    critical: jest.fn(),
  },
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

jest.mock('../../api/helpers/jwt_helper.js', () => ({
  create_access_token: jest.fn(),
  decode_jwt: jest.fn(),
  refresh_token: jest.fn(),
  updateLoggedInStatus: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../api/helpers/login_helper.js', () => ({
  getPermission: jest.fn(),
  ensure_user: jest.fn(),
  ensure_users: jest.fn(),
  ensure_groups: jest.fn(),
}));

jest.mock('../../api/helpers/ldap_helper.js', () => ({
  getGroupsForUser: jest.fn(),
  get_user_info: jest.fn(),
}));

const AuthenticationService = require('../../api/controllers/AuthenticationService.js');
const login_helper = require('../../api/helpers/login_helper.js');
const jwtHelper = require('../../api/helpers/jwt_helper.js');
const redis = require('../../redis.js');

describe('AuthenticationService', () => {
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    test('returns 200 with tokens on successful login', async () => {
      const mockPermission = {
        scopes: [{ scope: 'read', venue_group_id: '' }],
        roles: [{ role: 'admin', venue_group_id: '' }],
      };
      const mockTokens = {
        token: 'jwt-token-123',
        access_token_timeout: '3410s',
      };

      login_helper.getPermission.mockResolvedValue(mockPermission);
      jwtHelper.create_access_token.mockResolvedValue(mockTokens);
      login_helper.ensure_user.mockResolvedValue(undefined);

      await AuthenticationService.login({ user: 'testuser' }, mockRes, jest.fn());

      expect(login_helper.getPermission).toHaveBeenCalledWith('testuser');
      expect(jwtHelper.create_access_token).toHaveBeenCalledWith('testuser', mockPermission);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        access_token: 'jwt-token-123',
        access_token_timeout: '3410s',
      });
    });

    test('returns 401 when user has no scopes', async () => {
      const mockPermission = {
        scopes: [],
        roles: [],
      };

      login_helper.getPermission.mockResolvedValue(mockPermission);

      await AuthenticationService.login({ user: 'unauthorized' }, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    test('returns 401 when scopes is undefined', async () => {
      const mockPermission = {
        roles: [],
      };

      login_helper.getPermission.mockResolvedValue(mockPermission);

      await AuthenticationService.login({ user: 'unauthorized' }, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    test('returns 200 and blacklists token in Redis on successful logout', async () => {
      const mockDecoded = {
        jti: 'unique-jti-123',
        username: 'testuser',
      };

      jwtHelper.decode_jwt.mockReturnValue(mockDecoded);
      redis.redisClient.set.mockResolvedValue('OK');
      redis.redisClient.expire.mockResolvedValue(1);

      await AuthenticationService.logout('valid-token', mockRes, jest.fn());

      expect(jwtHelper.decode_jwt).toHaveBeenCalledWith('valid-token');
      expect(redis.redisClient.set).toHaveBeenCalledWith('unique-jti-123', 'unique-jti-123');
      expect(redis.redisClient.expire).toHaveBeenCalledWith('unique-jti-123', expect.any(Number));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('returns 401 when token is null', async () => {
      jwtHelper.decode_jwt.mockReturnValue(null);

      await AuthenticationService.logout(null, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('refresh_token', () => {
    test('returns 200 with new token on successful refresh', async () => {
      const mockNewToken = {
        access_token: 'new-jwt-token',
        access_token_timeout: '3410s',
      };

      jwtHelper.refresh_token.mockResolvedValue(mockNewToken);

      await AuthenticationService.refresh_token('old-token', mockRes, jest.fn());

      expect(jwtHelper.refresh_token).toHaveBeenCalledWith('old-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        access_token: 'new-jwt-token',
        access_token_timeout: '3410s',
      });
    });

    test('returns 401 when refresh token is null', async () => {
      jwtHelper.refresh_token.mockResolvedValue(null);

      await AuthenticationService.refresh_token('expired-token', mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    test('returns 403 when long expire exceeded', async () => {
      jwtHelper.refresh_token.mockResolvedValue({ token: 'error' });

      await AuthenticationService.refresh_token('old-token', mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Long expire, Unauthorized' });
    });
  });
});
