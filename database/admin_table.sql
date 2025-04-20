CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin
INSERT INTO admins (name, email, password, phone) 
VALUES ('Admin', 'admin@example.com', 'admin123', '+1234567890');


ALTER TABLE `forum_posts` 
ADD COLUMN `likes` VARCHAR(45) NULL AFTER `updated_at`;

ALTER TABLE `forum_posts` 
ADD COLUMN `color` VARCHAR(45) NULL AFTER `likes`,
CHANGE COLUMN `likes` `likes` VARCHAR(45) NULL DEFAULT NULL AFTER `status`;
