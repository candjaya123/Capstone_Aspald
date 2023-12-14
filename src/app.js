const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors');
const db = require('./api/v1/models');
dotenv.config()

const app = express()


// middleware
app.use(express.json())
app.use(cors())

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) =>{
    res.json({ message: "Server On "})
})

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
    syncDb()
})