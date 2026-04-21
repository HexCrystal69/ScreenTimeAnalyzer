// UserTask model - Tasks/work items with distraction impact tracking
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTask = sequelize.define('UserTask', {
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
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estimatedMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'How many minutes the user thinks this task needs'
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue'),
        defaultValue: 'pending'
    },
    distractionMinutes: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        comment: 'Total distraction minutes accumulated while this task was active'
    },
    actualMinutesSpent: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        comment: 'Actual productive minutes spent on the task'
    },
    completionPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        comment: 'User self-reported or calculated completion percentage'
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_tasks',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['userId', 'status'] }
    ]
});

module.exports = UserTask;
