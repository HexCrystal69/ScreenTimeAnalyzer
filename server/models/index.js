// Model associations and central export
const sequelize = require('../config/database');
const User = require('./User');
const ScreenTimeEntry = require('./ScreenTimeEntry');
const DistractingApp = require('./DistractingApp');
const UserTask = require('./UserTask');
const Alert = require('./Alert');
const Settings = require('./Settings');
const Report = require('./Report');

// Define associations — every model scoped to a user
User.hasMany(ScreenTimeEntry, { foreignKey: 'userId', onDelete: 'CASCADE' });
ScreenTimeEntry.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DistractingApp, { foreignKey: 'userId', onDelete: 'CASCADE' });
DistractingApp.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserTask, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserTask.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Settings, { foreignKey: 'userId', onDelete: 'CASCADE' });
Settings.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Report, { foreignKey: 'userId', onDelete: 'CASCADE' });
Report.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    ScreenTimeEntry,
    DistractingApp,
    UserTask,
    Alert,
    Settings,
    Report
};
