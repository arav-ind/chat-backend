const mongoose = require('mongoose');

const connectDB = async() => {
    try {
        mongoose.set("strictQuery", false);
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`DB Connected`);
    } catch (err) {
        console.log('Error connecting DB', err);
        process.exit();
    }
}

module.exports = connectDB;