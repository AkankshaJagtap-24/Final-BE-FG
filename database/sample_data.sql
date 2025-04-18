-- Sample Users
INSERT INTO users (name, email, password, phone) VALUES
('John Doe', 'john@example.com', 'password123', '+1234567890'),
('Jane Smith', 'jane@example.com', 'password456', '+1987654321'),
('Mike Johnson', 'mike@example.com', 'password789', '+1122334455');

-- Sample Admins
INSERT INTO admins (name, email, phone) VALUES
('Admin User', 'admin@example.com', '+1555666777'),
('Emergency Admin', 'emergency@example.com', '+1777888999');

-- Sample SOS Alerts
INSERT INTO sos_alerts (user_id, location, description, status) VALUES
(1, '123 Emergency St, City', 'Medical emergency needed', 'pending'),
(2, '456 Help Ave, Town', 'Car accident on main road', 'processed'),
(3, '789 Alert Rd, Village', 'Fire emergency', 'completed');

-- Sample Forum Posts
INSERT INTO forum_posts (user_id, title, content) VALUES
(1, 'Safety Tips', 'Here are some important safety tips for everyone...'),
(2, 'Emergency Contact Numbers', 'List of important emergency contact numbers...'),
(3, 'First Aid Guidelines', 'Basic first aid guidelines everyone should know...');

-- Sample Forum Comments
INSERT INTO forum_comments (post_id, user_id, content) VALUES
(1, 2, 'Thanks for sharing these valuable tips!'),
(1, 3, 'Very helpful information'),
(2, 1, 'I suggest adding more emergency numbers'),
(3, 2, 'This is really important information');