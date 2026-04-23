'use strict';

const { DataTypes } = require('sequelize');

function createMockSequelize() {
  const models = {};
  const mockDefine = jest.fn((name, fields, options) => {
    const model = { name, fields, options, associate: null };
    models[name] = model;
    return model;
  });
  return { define: mockDefine, models };
}

describe('Sequelize Models', () => {
  describe('User model', () => {
    test('exports a function that takes (sequelize, DataTypes)', () => {
      const userModel = require('../../server/models/user.js');
      expect(typeof userModel).toBe('function');
    });

    test('defines expected fields', () => {
      const userModel = require('../../server/models/user.js');
      const mockSequelize = createMockSequelize();
      const User = userModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('User', expect.objectContaining({
        display_name: DataTypes.STRING,
        username: expect.objectContaining({ type: DataTypes.STRING, unique: true, allowNull: false }),
        login_expire: expect.objectContaining({ type: DataTypes.DATE }),
      }));
      expect(User.name).toBe('User');
    });

    test('defines associations', () => {
      const userModel = require('../../server/models/user.js');
      const mockSequelize = createMockSequelize();
      const User = userModel(mockSequelize, DataTypes);

      expect(User.associate).toBeDefined();
      expect(typeof User.associate).toBe('function');
    });
  });

  describe('Group model', () => {
    test('exports a function that takes (sequelize, DataTypes)', () => {
      const groupModel = require('../../server/models/group.js');
      expect(typeof groupModel).toBe('function');
    });

    test('defines expected fields', () => {
      const groupModel = require('../../server/models/group.js');
      const mockSequelize = createMockSequelize();
      const Group = groupModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('Group', expect.objectContaining({
        name: expect.objectContaining({ type: DataTypes.STRING, unique: true, allowNull: false }),
      }));
      expect(Group.name).toBe('Group');
    });

    test('defines associations', () => {
      const groupModel = require('../../server/models/group.js');
      const mockSequelize = createMockSequelize();
      const Group = groupModel(mockSequelize, DataTypes);

      expect(Group.associate).toBeDefined();
      expect(typeof Group.associate).toBe('function');
    });
  });

  describe('Role model', () => {
    test('exports a function that takes (sequelize, DataTypes)', () => {
      const roleModel = require('../../server/models/role.js');
      expect(typeof roleModel).toBe('function');
    });

    test('defines expected fields', () => {
      const roleModel = require('../../server/models/role.js');
      const mockSequelize = createMockSequelize();
      const Role = roleModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('Role', expect.objectContaining({
        name: expect.objectContaining({ type: DataTypes.STRING, unique: true, allowNull: false }),
        description: DataTypes.TEXT,
        venue_group_id: expect.objectContaining({ type: DataTypes.STRING }),
      }));
      expect(Role.name).toBe('Role');
    });

    test('defines associations', () => {
      const roleModel = require('../../server/models/role.js');
      const mockSequelize = createMockSequelize();
      const Role = roleModel(mockSequelize, DataTypes);

      expect(Role.associate).toBeDefined();
      expect(typeof Role.associate).toBe('function');
    });
  });

  describe('Permission model', () => {
    test('exports a function that takes (sequelize, DataTypes)', () => {
      const permModel = require('../../server/models/permission.js');
      expect(typeof permModel).toBe('function');
    });

    test('defines expected fields', () => {
      const permModel = require('../../server/models/permission.js');
      const mockSequelize = createMockSequelize();
      const Permission = permModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('Permission', expect.objectContaining({
        name: expect.objectContaining({ type: DataTypes.STRING, unique: true, allowNull: false }),
        for_venue_group: expect.objectContaining({ type: DataTypes.BOOLEAN, defaultValue: false }),
      }));
      expect(Permission.name).toBe('Permission');
    });

    test('defines associations', () => {
      const permModel = require('../../server/models/permission.js');
      const mockSequelize = createMockSequelize();
      const Permission = permModel(mockSequelize, DataTypes);

      expect(Permission.associate).toBeDefined();
      expect(typeof Permission.associate).toBe('function');
    });
  });

  describe('RoleGroup model', () => {
    test('defines as junction table with no extra fields', () => {
      const rgModel = require('../../server/models/role_group.js');
      const mockSequelize = createMockSequelize();
      const RoleGroup = rgModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('RoleGroup', {});
      expect(RoleGroup.name).toBe('RoleGroup');
    });
  });

  describe('RolePermission model', () => {
    test('defines as junction table with no extra fields', () => {
      const rpModel = require('../../server/models/role_permission.js');
      const mockSequelize = createMockSequelize();
      const RolePermission = rpModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('RolePermission', {});
      expect(RolePermission.name).toBe('RolePermission');
    });
  });

  describe('RoleUser model', () => {
    test('defines as junction table with no extra fields', () => {
      const ruModel = require('../../server/models/role_user.js');
      const mockSequelize = createMockSequelize();
      const RoleUser = ruModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('RoleUser', {});
      expect(RoleUser.name).toBe('RoleUser');
    });
  });

  describe('UserGroup model', () => {
    test('defines as junction table with no extra fields', () => {
      const ugModel = require('../../server/models/user_group.js');
      const mockSequelize = createMockSequelize();
      const UserGroup = ugModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('UserGroup', {});
      expect(UserGroup.name).toBe('UserGroup');
    });
  });

  describe('UserPermission model', () => {
    test('defines as junction table with no extra fields', () => {
      const upModel = require('../../server/models/user_permission.js');
      const mockSequelize = createMockSequelize();
      const UserPermission = upModel(mockSequelize, DataTypes);

      expect(mockSequelize.define).toHaveBeenCalledWith('UserPermission', {});
      expect(UserPermission.name).toBe('UserPermission');
    });
  });
});
