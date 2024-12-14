import express from 'express';
import eef from './routes/eefPdf.js';
import bangkok from './routes/bangkokPdf.js';
import cors from 'cors';
import https from 'https';
import fs from 'fs';

let https_options = {
    key: fs.readFileSync("ssl/thaijobjob.key"),
    cert: fs.readFileSync("ssl/thaijobjob.crt"),
    ca: fs.readFileSync('ssl/thaijobjob.CA.crt')
};

const app = express();
const httpsServer = https.createServer(https_options, app);
const port = 8011;

app.use(cors({ origin: '*' }));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use('/eef', eef)
app.use('/bangkok', bangkok)


app.get('/', (req, res) => {
    res.send("Running Pay 555");
});

app.listen(port, () => console.log(`Server Run on ${port}`));

// httpsServer.listen(port, () => console.log(`Server Run on ${port}`));