/**
 * PM2 process configuration for CNC Costify Backend on Hostinger VPS.
 *
 * Usage (from /opt/cnc-costify):
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
    apps: [
        {
            name: 'cnc-costify',
            script: './server.js',
            cwd: '/opt/cnc-costify',

            // Environment
            env: {
                NODE_ENV: 'production',
                PORT: '5000',
                // VPS doesn't have Python OCC — skip auto-start of Flask backend.
                SKIP_FLASK: '1',
                // Admin token for /api/feedback/list (rotate periodically).
                // Set via:  pm2 set cnc-costify:FEEDBACK_ADMIN_TOKEN <random>
                FEEDBACK_ADMIN_TOKEN: process.env.FEEDBACK_ADMIN_TOKEN || 'CHANGE_ME_BEFORE_DEPLOY',
            },

            // Process settings
            instances: 1,                // single instance — SQLite is single-writer
            exec_mode: 'fork',           // not cluster (SQLite needs single connection)
            watch: false,                // no auto-reload on file change in production
            max_memory_restart: '512M',  // restart if RSS > 512 MB
            autorestart: true,
            max_restarts: 10,
            min_uptime: '30s',

            // Logs
            out_file: '/var/log/cnc-costify/out.log',
            error_file: '/var/log/cnc-costify/error.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            log_type: 'json',

            // Graceful reload
            wait_ready: false,
            listen_timeout: 8000,
            kill_timeout: 5000,
        },
    ],
};
