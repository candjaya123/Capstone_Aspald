const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors');
const db = require('./api/v1/models');
dotenv.config()

const app = express()

const authRouter = require('./api/v1/auth/auth.route');
const userRouter = require('./api/v1/user/user.route');

// middleware
app.use(express.json())
app.use(cors())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) =>{
    res.json({ message: "Server On "})
})


// Error handling
app.use((err, req, res, next) => {
    const errorStatus = err.status || 500
    const errorMessage = err.message || 'Something went wrong'
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        stack: err.stack
    });
});

const syncDb = async () =>{
    try {
        await db.sequelize.sync()
        console.log('Database synced successfully');
    } catch (error) {
        console.log(error);
    }
}

app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
    // syncDb()
})