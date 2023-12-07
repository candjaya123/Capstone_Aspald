const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const app = express()


// middleware
app.use(express.json())
app.use(cors())

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) =>{
    res.json({ message: "Server On "})
})

app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
})