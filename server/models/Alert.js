// Alert model - Usage alerts and notification rules
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Display name like "Instagram Daily Limit"'
    },
    triggerType: {
        type: DataTypes.ENUM('usage_limit', 'distraction_spike', 'goal_missed', 'custom'),
        allowNull: false,
        defaultValue: 'usage_limit'
    },
    appOrCategory: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'App name or category to monitor'
    },
    thresholdMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Usage threshold in minutes to trigger the alert'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notificationMethod: {
        type: DataTypes.ENUM('in_app', 'email', 'both'),
        defaultValue: 'in_app'
    },
    severity: {
        type: DataTypes.ENUM('info', 'warning', 'critical'),
        defaultValue: 'warning'
    },
    lastTriggered: {
        type: DataTypes.DATE,
        allowNull: true
    },
    triggerCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dismissed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'alerts',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'active'] }
    ]
});

module.exports = Alert;
