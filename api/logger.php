<?php
/**
 * Security Event Logger
 * Logs security-related events for monitoring and auditing
 */

require_once __DIR__ . '/config.php';

function logSecurityEvent($event_type, $details = []) {
    $log_dir = __DIR__ . '/../logs';
    
    // Create logs directory if it doesn't exist
    if (!is_dir($log_dir)) {
        @mkdir($log_dir, 0755, true);
    }
    
    $log_file = $log_dir . '/security-' . date('Y-m-d') . '.log';
    
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event_type,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'details' => $details
    ];
    
    $log_line = json_encode($log_entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    
    // Write to log file
    @file_put_contents($log_file, $log_line, FILE_APPEND | LOCK_EX);
    
    // Also log to PHP error log in production
    if (IS_PRODUCTION) {
        error_log("Security Event [{$event_type}]: " . json_encode($details));
    }
}

function logDatabaseError($error_message, $query = null) {
    $log_dir = __DIR__ . '/../logs';
    
    if (!is_dir($log_dir)) {
        @mkdir($log_dir, 0755, true);
    }
    
    $log_file = $log_dir . '/database-' . date('Y-m-d') . '.log';
    
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => $error_message,
        'query' => $query,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $log_line = json_encode($log_entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    
    @file_put_contents($log_file, $log_line, FILE_APPEND | LOCK_EX);
    error_log("Database Error: " . $error_message);
}

