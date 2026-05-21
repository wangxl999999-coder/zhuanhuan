const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'converter.db');
const db = new sqlite3.Database(dbPath);

function initDB(callback) {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS convert_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT NOT NULL,
      original_name TEXT,
      source_format TEXT,
      target_format TEXT,
      file_size INTEGER,
      converted_size INTEGER,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      total_conversions INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS format_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_format TEXT,
      target_format TEXT,
      count INTEGER DEFAULT 0,
      UNIQUE(source_format, target_format)
    )`);

    console.log('数据库初始化完成');
    if (callback) callback();
  });
}

function insertConvertRecord(record, callback) {
  const stmt = db.prepare(`
    INSERT INTO convert_records (file_id, original_name, source_format, target_format, file_size, converted_size, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    record.file_id,
    record.original_name,
    record.source_format,
    record.target_format,
    record.file_size,
    record.converted_size,
    record.status,
    record.error_message,
    function(err) {
      if (err) {
        console.error('插入记录失败', err);
      }
      
      const today = new Date().toISOString().split('T')[0];
      db.run(`
        INSERT INTO daily_stats (date, total_conversions, success_count, failed_count)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          total_conversions = total_conversions + 1,
          success_count = success_count + ?,
          failed_count = failed_count + ?
      `, today, record.status === 'success' ? 1 : 0, record.status !== 'success' ? 1 : 0,
        record.status === 'success' ? 1 : 0, record.status !== 'success' ? 1 : 0);

      db.run(`
        INSERT INTO format_stats (source_format, target_format, count)
        VALUES (?, ?, 1)
        ON CONFLICT(source_format, target_format) DO UPDATE SET
          count = count + 1
      `, record.source_format, record.target_format);

      if (callback) callback(err, this.lastID);
    }
  );
  stmt.finalize();
}

function getConvertHistory(page, pageSize, callback) {
  const offset = (page - 1) * pageSize;
  db.all(`
    SELECT * FROM convert_records
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [pageSize, offset], callback);
}

function getStatistics(callback) {
  db.serialize(() => {
    const stats = {};

    db.get('SELECT COUNT(*) as total FROM convert_records', (err, row) => {
      stats.totalConversions = row ? row.total : 0;
    });

    db.get("SELECT COUNT(*) as today FROM convert_records WHERE DATE(created_at) = DATE('now')", (err, row) => {
      stats.todayConversions = row ? row.today : 0;
    });

    db.get("SELECT COUNT(*) as success FROM convert_records WHERE status = 'success'", (err, row) => {
      stats.successCount = row ? row.success : 0;
    });

    db.get("SELECT COUNT(*) as failed FROM convert_records WHERE status = 'failed'", (err, row) => {
      stats.failedCount = row ? row.failed : 0;
    });

    db.all('SELECT * FROM format_stats ORDER BY count DESC LIMIT 10', (err, rows) => {
      stats.popularFormats = rows || [];
    });

    db.all("SELECT DATE(created_at) as date, COUNT(*) as count FROM convert_records WHERE created_at >= DATE('now', '-7 days') GROUP BY DATE(created_at) ORDER BY date", (err, rows) => {
      stats.weekData = rows || [];
      
      setTimeout(() => {
        callback(null, stats);
      }, 100);
    });
  });
}

module.exports = {
  initDB,
  insertConvertRecord,
  getConvertHistory,
  getStatistics
};
