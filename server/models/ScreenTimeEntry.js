// ScreenTimeEntry model - Individual app/website usage records
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScreenTimeEntry = sequelize.define('ScreenTimeEntry', {
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
    app: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Name of the application or website'
    },
    category: {
        type: DataTypes.ENUM('Social', 'Work', 'Entertainment', 'News', 'Communication', 'Education', 'Other'),
        allowNull: false,
        defaultValue: 'Other'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    usageMinutes: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total minutes spent on this app on this date'
    },
    notifications: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of notifications received from this app'
    },
    timesOpened: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times the app was opened/switched to'
    },
    isDistracting: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Auto-flagged if app matches user distraction list'
    },
    hour: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Hour of day (0-23) for hourly breakdown, null for daily aggregates'
    }
}, {
    tableName: 'screen_time_entries',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'date'] },
        { fields: ['userId', 'app'] },
        { fields: ['userId', 'isDistracting'] }
    ]
});

module.exports = ScreenTimeEntry;
