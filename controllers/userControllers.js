const asyncHandler = require('express-async-handler');
const generateJWT = require('../config/generateJWT');
const User = require('../models/userModel');
const sharp = require('sharp');
const {PutObjectCommand, S3Client} = require('@aws-sdk/client-s3');

const registerUser = asyncHandler(async(req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        res.status(400).send('Please enter valid info!');
    }

    const userExists = await User.findOne({email});
    if (userExists) {
        res.status(403).send('User already Exists!');
    }

    let imageUrl = undefined;

    if (req.file) {
        // Resize image
        const imageBuffer = await sharp(req.file.buffer)
            .resize({width: 42, height: 42, fit: 'contain'}).toBuffer();

        const imageKey = email.replace('.', 'dot');

        // Push image to S3 bucket
        const bucketRegion = process.env.BUCKET_REGION;
        const accessKey = process.env.ACCESS_KEY;
        const secretAccessKey = process.env.SECRET_ACCESS_KEY;

        const s3Bucket = new S3Client({
            credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretAccessKey,
            },
            region: bucketRegion,
        });

        const bucketName = process.env.BUCKET_NAME;
        const params = {
            Bucket: bucketName,
            Key: imageKey,
            Body: imageBuffer,
            ContentType: req.file.mimetype,
        };

        
        const command = new PutObjectCommand(params);
        try {
            await s3Bucket.send(command);
            imageUrl = `https://chat-app-dps.s3.ap-south-1.amazonaws.com/${imageKey}`
        } catch(err) {
            console.log('Error in image upload', err);
        }
    }

    const user = await User.create({
        name,
        email,
        password,
        pic: imageUrl,
    });

    if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateJWT(user._id),
        })
    } else {
        res.status(400).send('Failed to create user!');
    }
});

const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (user && (await user.matchPassword(password))) {
        const token = generateJWT(user._id)
        res.cookie("token", token)

        //send response to frontend
        const {_id, name, email, pic} = user
        res.json({
            token,
            user: {_id, name, email, pic}
        })
    } else {
        res.status(404).send('User not found!')
    }
});

const allUsers = asyncHandler(async(req, res) => {
    const keyword = req.query.search ? {
        $or: [
            {name: {$regex: req.query.search, $options: 'i'}},
            {email: {$regex: req.query.search, $options: 'i'}},
        ]
    } : {}
    
    const users = await User.find(keyword)
    .select('-password')
    .find({_id: {$ne: req.user._id}})
    res.send(users)
})

module.exports = {registerUser, loginUser, allUsers};