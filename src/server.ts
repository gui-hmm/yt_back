import express from "express";
import { userRoutes } from "./routes/user.routes";
import { videosRoutes } from "./routes/videos.routes";
import { config } from "dotenv";

config();
const app = express();

const cors = require('cors');

app.use(function(req, res, next) {
    const allowedOrigins = ["http://localhost:3000", "https://yt-front.onrender.com"];
    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", 'POST, GET, PATCH, DELETE, OPTIONS');
    next();
});



app.use(cors());

app.use(express.json());
app.use('/user', userRoutes)
app.use('/videos', videosRoutes)


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


