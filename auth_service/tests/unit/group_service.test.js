'use strict';

jest.mock('../../server/models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
  },
  Group: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Role: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
  Permission: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
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
  PUBLIC_PEM: 'test-pem',
  PRIVATE_PEM: 'test-pem',
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

jest.mock('../../redis.js', () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../api/helpers/login_helper.js', () => ({
  getPermission: jest.fn(),
  ensure_user: jest.fn(),
  ensure_users: jest.fn(),
  ensure_groups: jest.fn(),
}));

jest.mock('../../api/helpers/ldap_helper.js', () => ({
  validate_user_exists: jest.fn(),
  validate_ldap_group_exists: jest.fn(),
  validate_ldap_groups_exist: jest.fn(),
  validate_users_exist: jest.fn(),
  getGroupsForUser: jest.fn(),
  get_user_info: jest.fn(),
}));

jest.mock('../../api/helpers/jwt_helper.js', () => ({
  create_access_token: jest.fn(),
  decode_jwt: jest.fn(),
  refresh_token: jest.fn(),
  updateLoggedInStatus: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../api/controllers/UserService.js', () => ({
  get_user_full: jest.fn(),
}));

const models = require('../../server/models/index.js');
const GroupService = require('../../api/controllers/GroupService.js');

describe('GroupService', () => {
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('get_all_groups', () => {
    test('returns list of groups with 200 status', async () => {
      const mockGroup1 = {
        id: 1,
        name: 'devs',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        toJSON: jest.fn().mockReturnValue({ id: 1, name: 'devs', createdAt: '2024-01-01', updatedAt: '2024-01-01' }),
        getRoles: jest.fn().mockResolvedValue([]),
      };
      const mockGroups = {
        count: 1,
        rows: [mockGroup1],
      };

      models.Group.findAndCountAll.mockResolvedValue(mockGroups);

      const args = {
        limit: { value: undefined },
        q: { value: undefined },
        offset: { value: undefined },
        order: { value: 'ASC' },
        rolefilter: { value: undefined },
        userfilter: { value: undefined },
        scopefilter: { value: undefined },
      };

      GroupService.get_all_groups(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(models.Group.findAndCountAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 when no groups found', async () => {
      const mockGroups = { count: 0, rows: [] };
      models.Group.findAndCountAll.mockResolvedValue(mockGroups);

      const args = {
        limit: { value: undefined },
        q: { value: undefined },
        offset: { value: undefined },
        order: { value: 'ASC' },
        rolefilter: { value: undefined },
        userfilter: { value: undefined },
        scopefilter: { value: undefined },
      };

      GroupService.get_all_groups(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('get_group', () => {
    test('returns group with scopes and roles', async () => {
      const mockGroup = {
        id: 1,
        name: 'devs',
        toJSON: jest.fn().mockReturnValue({ id: 1, name: 'devs' }),
        getRoles: jest.fn().mockResolvedValue([
          {
            name: 'admin',
            getPermissions: jest.fn().mockResolvedValue([{ id: 1, name: 'read' }]),
          },
        ]),
      };

      models.Group.findByPk.mockResolvedValue(mockGroup);

      const args = { group_id: { value: 1 } };
      GroupService.get_group(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(models.Group.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 when group not found', async () => {
      models.Group.findByPk.mockResolvedValue(null);

      const args = { group_id: { value: 999 } };
      GroupService.get_group(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not found with ID: 999' });
    });
  });

  describe('delete_group', () => {
    test('returns 200 on successful deletion', async () => {
      const mockGroup = {
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      models.Group.findByPk.mockResolvedValue(mockGroup);

      const args = { id: { value: 1 } };
      GroupService.delete_group(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGroup.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('returns 404 when group not found for deletion', async () => {
      models.Group.findByPk.mockResolvedValue(null);

      const args = { id: { value: 999 } };
      GroupService.delete_group(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not found with ID: 999' });
    });
  });
});
