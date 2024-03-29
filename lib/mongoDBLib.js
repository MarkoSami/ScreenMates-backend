const mongoose = require('mongoose');


const connectToMongo = async () => {
    // Replace <mongodb_connection_string> with your MongoDB connection string
    const connectionString = process.env.MONGO_CONNECTION_STRING;
    mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => {
            console.log('Connected to MongoDB');
            // Start your application or perform other operations
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
        });
};

const db = mongoose.connection;

db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

db.once('open', () => {
    // console.log('Connected to MongoDB');
    // Start your application or perform other operations
});

db.on('close', () => {
    console.log('MongoDB connection closed');
});


module.exports = {
    connectToMongo
}
