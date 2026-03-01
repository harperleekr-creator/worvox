import { Hono } from 'hono';
import type { Bindings } from '../types';

const modeReports = new Hono<{ Bindings: Bindings }>();

// Save mode report (Timer, Scenario, Exam)
modeReports.post('/save', async (c) => {
  try {
    const { sessionId, userId, modeType, reportData } = await c.req.json();

    if (!sessionId || !userId || !modeType || !reportData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate mode type
    if (!['timer', 'scenario', 'exam'].includes(modeType)) {
      return c.json({ error: 'Invalid mode type' }, 400);
    }

    // Save report
    const result = await c.env.DB.prepare(
      `INSERT INTO mode_reports (session_id, user_id, mode_type, report_data, created_at)
       VALUES (?, ?, ?, ?, datetime('now', '+9 hours'))`
    ).bind(sessionId, userId, modeType, JSON.stringify(reportData)).run();

    // Update session to mark it has a report
    await c.env.DB.prepare(
      'UPDATE sessions SET has_report = 1 WHERE id = ?'
    ).bind(sessionId).run();

    return c.json({
      success: true,
      reportId: result.meta.last_row_id
    });
  } catch (error) {
    console.error('Save mode report error:', error);
    return c.json({
      error: 'Failed to save report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get mode report by session ID
modeReports.get('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    const report = await c.env.DB.prepare(
      'SELECT * FROM mode_reports WHERE session_id = ?'
    ).bind(sessionId).first();

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    const reportData = (report as any).report_data;

    return c.json({
      success: true,
      report: {
        id: (report as any).id,
        sessionId: (report as any).session_id,
        userId: (report as any).user_id,
        modeType: (report as any).mode_type,
        reportData: typeof reportData === 'string' ? JSON.parse(reportData) : reportData,
        createdAt: (report as any).created_at
      }
    });
  } catch (error) {
    console.error('Get mode report error:', error);
    return c.json({
      error: 'Failed to fetch report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all reports for a user
modeReports.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    const reports = await c.env.DB.prepare(
      'SELECT * FROM mode_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all();

    return c.json({
      success: true,
      reports: reports.results?.map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        userId: r.user_id,
        modeType: r.mode_type,
        reportData: typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data,
        createdAt: r.created_at
      })) || []
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    return c.json({
      error: 'Failed to fetch reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default modeReports;
