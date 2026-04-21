// DistractingApp model - Per-user list of distracting apps/websites
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DistractingApp = sequelize.define('DistractingApp', {
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
    appName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Display name of the app or website'
    },
    type: {
        type: DataTypes.ENUM('app', 'website'),
        allowNull: false,
        defaultValue: 'app'
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL pattern for website matching (e.g. instagram.com)'
    },
    category: {
        type: DataTypes.ENUM('Social', 'Entertainment', 'News', 'Communication', 'Other'),
        defaultValue: 'Other'
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether to show block warning when detected'
    }
}, {
    tableName: 'distracting_apps',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'appName'], unique: true }
    ]
});

module.exports = DistractingApp;
