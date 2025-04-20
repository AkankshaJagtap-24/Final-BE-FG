const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/forum', async (req, res) => {
    try {
        // Get all forum posts with user information
        const [posts] = await db.execute(`
            SELECT 
                CONCAT('post-', f.id) as id,
                f.title,
                f.content,
                f.created_at,
                f.status,
                f.likes,
                u.name as author_name,
                u.email as author_email,
                f.color as author_color,
                (SELECT COUNT(*) FROM forum_comments WHERE post_id = f.id AND status = 'active') as comments_count
            FROM forum_posts f
            JOIN users u ON f.user_id = u.id
            WHERE f.status = 'active'
            ORDER BY f.created_at DESC
        `);

        // Format the response
        const formattedPosts = posts.map(post => {
            const names = post.author_name.split(' ');
            const initials = names.map(name => name[0]).join('').toUpperCase();
            
            return {
                id: post.id,
                author: {
                    name: post.author_name,
                    initials: initials,
                    color: post.author_color || 'cyan'
                },
                time: getTimeAgo(post.created_at),
                title: post.title,
                content: post.content,
                likes: post.likes,
                comments: post.comments_count
            };
        });

        res.status(200).json({ 
            success: true, 
            posts: formattedPosts 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this helper function for time formatting
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

router.post('/add_forum_post', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.userId;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Generate random color if not provided
        const colors = ['cyan', 'blue', 'green', 'purple', 'red', 'orange'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const [result] = await db.execute(
            'INSERT INTO forum_posts (title, content, user_id, status, created_at, color, likes) VALUES (?, ?, ?, "active", NOW(), ?, 0)',
            [title, content, userId, randomColor]
        );

        // Get the created post with formatted response
        const [newPost] = await db.execute(`
            SELECT 
                CONCAT('post-', f.id) as id,
                f.title,
                f.content,
                f.created_at,
                f.likes,
                u.name as author_name,
                f.color as author_color
            FROM forum_posts f
            JOIN users u ON f.user_id = u.id
            WHERE f.id = ?
        `, [result.insertId]);

        const names = newPost[0].author_name.split(' ');
        const initials = names.map(name => name[0]).join('').toUpperCase();

        res.status(201).json({
            success: true,
            message: 'Forum post created successfully',
            post: {
                id: newPost[0].id,
                author: {
                    name: newPost[0].author_name,
                    initials: initials,
                    color: newPost[0].author_color
                },
                time: 'Just now',
                title: newPost[0].title,
                content: newPost[0].content,
                likes: 0,
                comments: 0
            }
        });
    } catch (error) {
        console.error('Create forum post error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

//create a new appi to featch the comments for a post
router.get('/forum/:postId/comments', async (req, res) => {
    try {
        const postId = req.params.postId;
        const [comments] = await db.execute(`
            SELECT
            CONCAT('comment-', fc.id) as id,
            fc.content,
            fc.created_at, 
            u.name as author_name,
            u.email as author_email	 
        FROM forum_comments fc
        JOIN users u ON fc.user_id = u.id
        WHERE fc.post_id = ?
        ORDER BY fc.created_at DESC
        `, [postId]);
        // Format the comments
        const formattedComments = comments.map(comment => {
            const names = comment.author_name.split(' ');
            const initials = names.map(name => name[0]).join('').toUpperCase(); 
        })
        res.status(200).json({
            success: true,
            comments: formattedComments

        })

    } 
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        }) 
    }
})


module.exports = router;