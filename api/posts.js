const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const { requireUser } = require('./utils');

postsRouter.use((req, res, next) => {
    console.log("A request is being made to /posts");

    next();
});

postsRouter.get('/', async (req, res, next) => {
    try {
        const allPosts = await getAllPosts();

        const posts = allPosts.filter(post => {
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

        res.send({
            posts
        });
    } catch ({ name, message }) {
        next({ name, message })
    }
});

postsRouter.post('/', requireUser, async (req, res, next) => {
    // res.send({ message: 'under construction'}) // For Testing purposes

    const { title, content, tags = "" } = req.body;

    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    // only send the tags if there are some to send
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        // add authorId, title, content to postData object
        const authorId = req.user.id
        postData.authorId = authorId;
        postData.content = content;
        postData.title = title;

        const post = await createPost(postData);
        // this will create the post and the tags for us
        
        // if the post comes back, res.send({ post });
        if (post) {
            res.send({ post });
        } else {
            next({
                name: "PostNotCreated",
                message: "Post must include Title and Content"
            })
        }
        // otherwise, next an appropriate error ojbect
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const updateFields = {};

    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
        updateFields.title = title;
    }

    if (content) {
        updateFields.content = content;
    }

    try {
        const originalPost = await getPostById(postId);

        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost })
        } else {
            next({
                name: 'UnauthorizedUserError',
                message: 'You cannot update a post that is not yours'
            })
        }
    } catch ({ name, message }) {
        next({ name, message })
    }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const { postId } = req.params;
        // console.log(postId);
        const post = await getPostById(postId);
        // console.log(post);

        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });

            res.send({ post: updatedPost});
        } else {
            // if there was a post, throw UnauthorizedUserError, otherwise thow PostNotFoundError
            next(post ? {
                name: "UnauthorizedUserError",
                message: "You cannot delete a post which is not yours"
            } : {
                name: "PostNotFoundError",
                message: "That post does not exist"
            });
        }

    } catch ({ name, message }) {
        next({ name, message })
    }
});

module.exports = postsRouter;