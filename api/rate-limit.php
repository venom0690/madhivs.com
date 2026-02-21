<?php
/**
 * Rate Limiting Implementation
 * Prevents brute force attacks
 */

require_once __DIR__ . '/config.php';

class RateLimiter {
    private $pdo;
    private $maxAttempts;
    private $lockoutTime;
    
    public function __construct($pdo, $maxAttempts = MAX_LOGIN_ATTEMPTS, $lockoutTime = LOGIN_LOCKOUT_TIME) {
        $this->pdo = $pdo;
        $this->maxAttempts = $maxAttempts;
        $this->lockoutTime = $lockoutTime;
        $this->createTableIfNotExists();
    }
    
    private function createTableIfNotExists() {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    identifier VARCHAR(255) NOT NULL,
                    attempts INT DEFAULT 1,
                    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    locked_until TIMESTAMP NULL,
                    INDEX idx_identifier (identifier),
                    INDEX idx_locked_until (locked_until)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
        } catch (PDOException $e) {
            error_log('Failed to create rate_limits table: ' . $e->getMessage());
        }
    }
    
    public function checkLimit($identifier) {
        // Clean old records
        $this->pdo->prepare("DELETE FROM rate_limits WHERE last_attempt < DATE_SUB(NOW(), INTERVAL 1 HOUR)")->execute();
        
        $stmt = $this->pdo->prepare("SELECT attempts, locked_until FROM rate_limits WHERE identifier = ?");
        $stmt->execute([$identifier]);
        $record = $stmt->fetch();
        
        if (!$record) {
            return ['allowed' => true, 'remaining' => $this->maxAttempts];
        }
        
        // Check if locked
        if ($record['locked_until'] && strtotime($record['locked_until']) > time()) {
            $remainingTime = strtotime($record['locked_until']) - time();
            return [
                'allowed' => false,
                'remaining' => 0,
                'retry_after' => $remainingTime,
                'message' => "Too many attempts. Please try again in " . ceil($remainingTime / 60) . " minutes."
            ];
        }
        
        // Check attempts
        if ($record['attempts'] >= $this->maxAttempts) {
            // Lock the account
            $lockedUntil = date('Y-m-d H:i:s', time() + $this->lockoutTime);
            $this->pdo->prepare("UPDATE rate_limits SET locked_until = ? WHERE identifier = ?")
                ->execute([$lockedUntil, $identifier]);
            
            return [
                'allowed' => false,
                'remaining' => 0,
                'retry_after' => $this->lockoutTime,
                'message' => "Too many attempts. Account locked for " . ($this->lockoutTime / 60) . " minutes."
            ];
        }
        
        return [
            'allowed' => true,
            'remaining' => $this->maxAttempts - $record['attempts']
        ];
    }
    
    public function recordAttempt($identifier, $success = false) {
        if ($success) {
            // Clear on successful login
            $this->pdo->prepare("DELETE FROM rate_limits WHERE identifier = ?")->execute([$identifier]);
            return;
        }
        
        // Increment failed attempts
        $stmt = $this->pdo->prepare("SELECT id FROM rate_limits WHERE identifier = ?");
        $stmt->execute([$identifier]);
        
        if ($stmt->fetch()) {
            $this->pdo->prepare("UPDATE rate_limits SET attempts = attempts + 1, last_attempt = NOW() WHERE identifier = ?")
                ->execute([$identifier]);
        } else {
            $this->pdo->prepare("INSERT INTO rate_limits (identifier, attempts) VALUES (?, 1)")
                ->execute([$identifier]);
        }
    }
    
    public function getRemainingAttempts($identifier) {
        $stmt = $this->pdo->prepare("SELECT attempts FROM rate_limits WHERE identifier = ?");
        $stmt->execute([$identifier]);
        $record = $stmt->fetch();
        
        if (!$record) {
            return $this->maxAttempts;
        }
        
        return max(0, $this->maxAttempts - $record['attempts']);
    }
}

// Helper function
function getRateLimiter($pdo) {
    static $limiter = null;
    if ($limiter === null) {
        $limiter = new RateLimiter($pdo);
    }
    return $limiter;
}

