const express = require('express');
const router = express.Router();
const { Report, ScreenTimeEntry, Settings } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op, fn, col } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

router.use(authenticate);

// POST /api/reports/generate
router.post('/generate', async (req, res) => {
    try {
        const { type = 'daily', dateFrom, dateTo, format = 'pdf', sections = [] } = req.body;
        const from = dateFrom || new Date().toISOString().split('T')[0];
        const to = dateTo || from;
        const reportName = `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${from}`;

        // Get data for report
        const entries = await ScreenTimeEntry.findAll({
            where: { userId: req.userId, date: { [Op.between]: [from, to] } },
            order: [['date', 'ASC'], ['usageMinutes', 'DESC']]
        });

        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

        const fileName = `report_${req.userId}_${Date.now()}.${format}`;
        const filePath = path.join(reportsDir, fileName);

        if (format === 'csv') {
            const fields = ['app', 'category', 'date', 'usageMinutes', 'notifications', 'timesOpened', 'isDistracting'];
            const parser = new Parser({ fields });
            const csvData = parser.parse(entries.map(e => e.toJSON()));
            fs.writeFileSync(filePath, csvData);
        } else {
            // PDF generation
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            doc.fontSize(20).text('AttenTrack Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Type: ${type} | Period: ${from} to ${to}`, { align: 'center' });
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            const total = entries.reduce((s, e) => s + e.usageMinutes, 0);
            const distracting = entries.filter(e => e.isDistracting).reduce((s, e) => s + e.usageMinutes, 0);

            doc.fontSize(14).text('Summary');
            doc.fontSize(11).text(`Total Screen Time: ${Math.floor(total / 60)}h ${Math.round(total % 60)}m`);
            doc.text(`Distracting Time: ${Math.floor(distracting / 60)}h ${Math.round(distracting % 60)}m`);
            doc.text(`Productive Time: ${Math.floor((total - distracting) / 60)}h ${Math.round((total - distracting) % 60)}m`);
            doc.text(`Total Apps: ${new Set(entries.map(e => e.app)).size}`);
            doc.moveDown();

            doc.fontSize(14).text('Top Apps');
            const appTotals = entries.reduce((acc, e) => {
                acc[e.app] = (acc[e.app] || 0) + e.usageMinutes;
                return acc;
            }, {});
            Object.entries(appTotals).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([app, mins]) => {
                doc.fontSize(10).text(`  ${app}: ${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`);
            });

            doc.end();
            await new Promise(resolve => stream.on('finish', resolve));
        }

        const report = await Report.create({
            userId: req.userId, name: reportName, type, dateFrom: from,
            dateTo: to, format, sections, filePath: fileName, status: 'generated'
        });

        res.json({ report, message: 'Report generated' });
    } catch (error) {
        console.error('Report generate error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports
router.get('/', async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { userId: req.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ reports });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// GET /api/reports/download/:id
router.get('/download/:id', async (req, res) => {
    try {
        const report = await Report.findOne({ where: { id: req.params.id, userId: req.userId } });
        if (!report) return res.status(404).json({ error: 'Report not found' });

        const filePath = path.join(__dirname, '..', 'reports', report.filePath);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

        res.download(filePath, `attentrack-${report.type}-report.${report.format}`);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

module.exports = router;
