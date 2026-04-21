// Report model - Generated report records
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
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
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom', 'distraction'),
        allowNull: false
    },
    dateFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    dateTo: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    format: {
        type: DataTypes.ENUM('pdf', 'csv', 'png'),
        defaultValue: 'pdf'
    },
    sections: {
        type: DataTypes.JSON,
        defaultValue: ['attention_score', 'screen_time', 'app_usage', 'categories', 'trends'],
        comment: 'Which sections are included in the report'
    },
    filePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Path to the generated report file'
    },
    status: {
        type: DataTypes.ENUM('pending', 'generated', 'failed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
        { fields: ['userId'] }
    ]
});

module.exports = Report;
