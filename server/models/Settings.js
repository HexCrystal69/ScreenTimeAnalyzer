// Settings model - Per-user configuration
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' }
    },
    productiveStart: {
        type: DataTypes.STRING(5),
        defaultValue: '09:00',
        comment: 'Start of productive hours (HH:MM format)'
    },
    productiveEnd: {
        type: DataTypes.STRING(5),
        defaultValue: '17:00',
        comment: 'End of productive hours (HH:MM format)'
    },
    productiveDays: {
        type: DataTypes.JSON,
        defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        comment: 'Days of the week for productive hours'
    },
    career: {
        type: DataTypes.STRING(100),
        defaultValue: null,
        allowNull: true,
        comment: 'User career/profession for context'
    },
    hourlyRate: {
        type: DataTypes.FLOAT,
        defaultValue: null,
        allowNull: true,
        comment: 'User hourly value rate (₹) for opportunity cost calculations'
    },
    dailyGoalMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 360,
        comment: 'Daily productive hours goal in minutes (default 6h)'
    },
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'Asia/Kolkata'
    },
    theme: {
        type: DataTypes.ENUM('dark', 'light', 'system'),
        defaultValue: 'dark'
    },
    dateFormat: {
        type: DataTypes.STRING(20),
        defaultValue: 'MM/DD/YYYY'
    },
    weeklyReportEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifications: {
        type: DataTypes.JSON,
        defaultValue: {
            limitReached: true,
            dailySummary: true,
            weeklyReport: true,
            distractionSpike: true,
            streakMilestone: false
        }
    }
}, {
    tableName: 'settings',
    timestamps: true
});

module.exports = Settings;
