'use strict';

jest.mock('../../server/models/index.js', () => ({
  User: {
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
  },
  Group: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
  },
  Role: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../../auth_service/api/helpers/ldap_helper.js', () => ({
  getGroupsForUser: jest.fn(),
  get_user_info: jest.fn(),
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
}));

const models = require('../../server/models/index.js');
const login_helper = require('../../api/helpers/login_helper.js');

describe('login_helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensure_users', () => {
    test('creates users that do not exist and returns them', async () => {
      const mockUser1 = { id: 1, username: 'user1' };
      const mockUser2 = { id: 2, username: 'user2' };

      models.User.findOrCreate
        .mockResolvedValueOnce([mockUser1, true])
        .mockResolvedValueOnce([mockUser2, true]);

      const result = await login_helper.ensure_users(['user1', 'user2']);

      expect(models.User.findOrCreate).toHaveBeenCalledTimes(2);
      expect(models.User.findOrCreate).toHaveBeenCalledWith({ where: { username: 'user1' } });
      expect(models.User.findOrCreate).toHaveBeenCalledWith({ where: { username: 'user2' } });
      expect(result).toEqual([mockUser1, mockUser2]);
    });

    test('returns existing users without creating new ones', async () => {
      const mockUser = { id: 1, username: 'existing_user' };

      models.User.findOrCreate.mockResolvedValueOnce([mockUser, false]);

      const result = await login_helper.ensure_users(['existing_user']);

      expect(models.User.findOrCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockUser]);
    });

    test('handles empty array', async () => {
      const result = await login_helper.ensure_users([]);

      expect(models.User.findOrCreate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('ensure_groups', () => {
    test('creates groups that do not exist and returns them', async () => {
      const mockGroup1 = { id: 1, name: 'group1' };
      const mockGroup2 = { id: 2, name: 'group2' };

      models.Group.findOrCreate
        .mockResolvedValueOnce([mockGroup1, true])
        .mockResolvedValueOnce([mockGroup2, true]);

      const result = await login_helper.ensure_groups(['group1', 'group2']);

      expect(models.Group.findOrCreate).toHaveBeenCalledTimes(2);
      expect(models.Group.findOrCreate).toHaveBeenCalledWith({ where: { name: 'group1' } });
      expect(models.Group.findOrCreate).toHaveBeenCalledWith({ where: { name: 'group2' } });
      expect(result).toEqual([mockGroup1, mockGroup2]);
    });

    test('returns existing groups without creating new ones', async () => {
      const mockGroup = { id: 1, name: 'existing_group' };

      models.Group.findOrCreate.mockResolvedValueOnce([mockGroup, false]);

      const result = await login_helper.ensure_groups(['existing_group']);

      expect(models.Group.findOrCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockGroup]);
    });

    test('handles empty array', async () => {
      const result = await login_helper.ensure_groups([]);

      expect(models.Group.findOrCreate).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
