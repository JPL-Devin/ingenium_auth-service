const path = require('path');
const child_process = require('child_process');
const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const node_funcs = require('../node_funcs.js');

const log = node_funcs.log;

const env_config = require('../env_config.js');
const sequelize = new Sequelize(env_config.db_name, env_config.db_username, env_config.db_password, {
  "database": env_config.db_name,
  "host": env_config.db_host,
  "dialect": "mysql",
  "logging": false,
  "dialectModule": require('mysql2')
});

const umzug = new Umzug({
    migrations: {
        glob: path.join(process.env.PWD, '/server', '/migrations', '*.js'),
        resolve: ({ name, path: migrationPath, context }) => {
            const migration = require(migrationPath);
            return {
                name,
                up: async () => migration.up(context.queryInterface, context.Sequelize),
                down: async () => migration.down(context.queryInterface, context.Sequelize),
            };
        },
    },
    context: {
        queryInterface: sequelize.getQueryInterface(),
        Sequelize: Sequelize,
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
});

function logUmzugEvent(eventName) {
    return function(name, migration) {
        log.debug(`${ name } ${ eventName }`);
    }
}
umzug.on('migrating', logUmzugEvent('migrating'));
umzug.on('migrated',  logUmzugEvent('migrated'));
umzug.on('reverting', logUmzugEvent('reverting'));
umzug.on('reverted',  logUmzugEvent('reverted'));

async function cmdStatus() {
    const executed = await umzug.executed();
    const pending = await umzug.pending();

    const current = executed.length > 0 ? executed[0].name : '<NO_MIGRATIONS>';

    return { executed, pending };
}

function cmdMigrate(){
    log.debug("Umzug up");
    return umzug.up();
}

async function cmdMigrateNext() {
    const { executed, pending } = await cmdStatus();
    if (pending.length === 0) {
        throw new Error('No pending migrations');
    }
    const next = pending[0].name;
    return umzug.up({ to: next });
}

function cmdReset() {
    log.debug("Umzug reset");
    return umzug.down({ to: 0 });
}

async function cmdResetPrev() {
    const { executed, pending } = await cmdStatus();
    if (executed.length === 0) {
        throw new Error('Already at initial state');
    }
    const prev = executed[executed.length - 1].name;
    return umzug.down({ to: prev });
}

function cmdHardReset() {
    log.debug("Umzug hard reset");
    var interface = sequelize.getQueryInterface();
    return interface.dropAllSchemas();
}

// being run as a command line utility
if(process.argv[2] !== undefined){
    const cmd = process.argv[2].trim();
    let executedCmd;

    log.debug(`${ cmd.toUpperCase() } BEGIN`);

    switch(cmd) {
        case 'status':
            executedCmd = cmdStatus();
            break;

        case 'up':
        case 'migrate':
            executedCmd = cmdMigrate();
            break;

        case 'next':
        case 'migrate-next':
            executedCmd = cmdMigrateNext();
            break;

        case 'down':
        case 'reset':
            executedCmd = cmdReset();
            break;

        case 'prev':
        case 'reset-prev':
            executedCmd = cmdResetPrev();
            break;

        case 'reset-hard':
            executedCmd = cmdHardReset();
            break;

        default:
            log.error(`invalid cmd: ${ cmd }`);
            process.exit(1);
    }

    executedCmd
    .then(result => {
        const doneStr = `${ cmd.toUpperCase() } DONE`;
        log.debug(doneStr);
        log.debug("=".repeat(doneStr.length));
    })
    .catch(err => {
        const errorStr = `${ cmd.toUpperCase() } ERROR`;
        log.debug(errorStr);
        log.debug("=".repeat(errorStr.length));
        log.debug(err);
        log.debug("=".repeat(errorStr.length));
    })
    .then(() => {
        if (cmd !== 'status' && cmd !== 'reset-hard') {
            return cmdStatus()
        }
        return Promise.resolve();
    })
    .then(() => process.exit(0));
}

module.exports.cmdMigrate = cmdMigrate;
module.exports.cmdMigrateNext = cmdMigrateNext;
module.exports.cmdReset = cmdReset;
module.exports.cmdResetPrev = cmdResetPrev;
module.exports.cmdHardReset = cmdHardReset;
