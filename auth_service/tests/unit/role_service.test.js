'use strict';

jest.mock('../../server/models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
  },
  Group: {
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
const RoleService = require('../../api/controllers/RoleService.js');

describe('RoleService', () => {
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('get_all_roles', () => {
    test('returns list of roles with 200 status', async () => {
      const mockRoles = {
        count: 2,
        rows: [
          { id: 1, name: 'admin', description: 'Admin role', venue_group_id: null },
          { id: 2, name: 'user', description: 'User role', venue_group_id: 'vg1' },
        ],
      };
      models.Role.findAndCountAll.mockResolvedValue(mockRoles);

      const args = {
        name: { value: undefined },
        venue_group_id: { value: undefined },
        offset: { value: undefined },
        limit: { value: undefined },
        order: { value: 'ASC' },
      };

      await RoleService.get_all_roles(args, mockRes, jest.fn());

      // Wait for promise chain
      await new Promise(resolve => setImmediate(resolve));

      expect(models.Role.findAndCountAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        total: 2,
        results: mockRoles.rows,
      });
    });

    test('applies name filter when provided', async () => {
      const mockRoles = { count: 1, rows: [{ id: 1, name: 'admin' }] };
      models.Role.findAndCountAll.mockResolvedValue(mockRoles);

      const args = {
        name: { value: 'admin' },
        venue_group_id: { value: undefined },
        offset: { value: undefined },
        limit: { value: undefined },
        order: { value: undefined },
      };

      await RoleService.get_all_roles(args, mockRes, jest.fn());
      await new Promise(resolve => setImmediate(resolve));

      expect(models.Role.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        })
      );
    });
  });

  describe('get_role', () => {
    test('returns role with users, groups, and permissions', async () => {
      const mockRole = {
        id: 1,
        name: 'admin',
        description: 'Admin role',
        venue_group_id: 'vg1',
        getUsers: jest.fn().mockResolvedValue([
          { id: 1, username: 'user1' },
        ]),
        getPermissions: jest.fn().mockResolvedValue([
          { id: 10, name: 'read' },
        ]),
        getGroups: jest.fn().mockResolvedValue([
          { name: 'group1' },
        ]),
      };

      models.Role.findByPk.mockResolvedValue(mockRole);

      const args = { role_id: { value: 1 } };
      RoleService.get_role(args, mockRes, jest.fn());

      // Wait for promise chains
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(models.Role.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'admin',
          description: 'Admin role',
          venue_group_id: 'vg1',
          users: [{ id: 1, username: 'user1' }],
          groups: ['group1'],
          permissions: [10],
        })
      );
    });

    test('returns 400 when role not found', async () => {
      models.Role.findByPk.mockResolvedValue(null);

      const args = { role_id: { value: 999 } };
      RoleService.get_role(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('delete_role', () => {
    test('returns 204 on successful deletion', async () => {
      const mockRole = {
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      models.Role.findByPk.mockResolvedValue(mockRole);

      const args = { role_id: { value: 1 } };
      RoleService.delete_role(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRole.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    test('returns 404 when role not found', async () => {
      models.Role.findByPk.mockResolvedValue(null);

      const args = { role_id: { value: 999 } };
      RoleService.delete_role(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('get_role_permissions', () => {
    test('returns permissions for a role', async () => {
      const mockRole = {
        getPermissions: jest.fn().mockResolvedValue([
          { id: 1, name: 'read' },
          { id: 2, name: 'write' },
        ]),
      };
      models.Role.findByPk.mockResolvedValue(mockRole);

      const args = { role_id: { value: 1 } };
      RoleService.get_role_permissions(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: 1, name: 'read' },
        { id: 2, name: 'write' },
      ]);
    });

    test('returns 404 when role not found', async () => {
      models.Role.findByPk.mockResolvedValue(null);

      const args = { role_id: { value: 999 } };
      RoleService.get_role_permissions(args, mockRes, jest.fn());

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
