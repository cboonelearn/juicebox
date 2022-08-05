const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");

    next();
});

tagsRouter.get('/', async (req, res, next) => {
    const tags = await getAllTags();

    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    // read the tagname from the params
    const { tagName } = req.params;

    try {
        // use our method to get posts by tag name from the db
        const allPostsWithTag = await getPostsByTagName(tagName);
        const postsWithTag = allPostsWithTag.filter(post => {
            // the post is active, does not matter whom it belongs to
            if (post.active) {
                return true;
            }

            // the post is not active, but it belongs to the current user
            if (req.user && post.author.id === req.user.id) {
                return true;
            }

            // none of the above are true
            return false;
        });

        // send out an object to the client { posts: // the posts }
        res.send({ posts: postsWithTag })
    } catch ({ name, message }) {
        // forward the naem and message to the error handler
        next({ name, message })
    }
});

module.exports = tagsRouter;