const http = require('http');
const fetch = require('node-fetch');
const fs = require("fs");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 5000;
const separator = ';';
const path = "users.txt";

async function getRate() {
    const yourKey = 'a12a6085d711f1ba33a55dff3a6e11b6';
    const url = `http://api.coinlayer.com/api/live?access_key=${yourKey}`;
    const options = {method: 'GET', headers: {Accept: 'application/json'}};
    let allRates;
    await fetch(url, options)
        .then(res => res.json())
        .then(json => {
            allRates = json;
        })
        .catch(err => {
             console.error('error:' + err);
             res.writeHead(400, {});
             return res.end('Invalid status value');
        });
    return allRates.rates.BTC.toFixed(2);
}

const server = http.createServer(async (req, res) =>  {
    if (req.url == '/rate' && req.method == 'GET') {
        let rateUsdToBtc = await getRate();
        res.writeHead(200, {
            'Content-type': 'application/json; charset=utf-8'
        });
        return res.end(rateUsdToBtc);
    } else if (req.url == '/subscribe' && req.method == 'POST') {
        let email = '';
        req.on('data', function (data) {
            email = data.toString().split('=')[1];
            let errText = '';
            let emails;
            let dataInFile = fs.readFileSync(path, { encoding: 'utf8' });
            emails = dataInFile.split(separator);
            emails.forEach(x => {
                if (x == email) {
                    errText = 'Email already exists';
                    return;                
                }
            });
            if (errText) {
                res.writeHead(409, {
                    'Content-type': 'application/json; charset=utf8'
                });
                return res.end(errText);
            }
            emails.push(email);
            let dataToFile = emails.join(separator);
            fs.writeFileSync(path, dataToFile, { encoding: 'utf8', flag: 'w' });
            res.writeHead(200, {
                'Content-type': 'application/json; charset=utf8'
            });
            res.end();
        });
    } else if (req.url == '/sendEmails' && req.method == 'POST') {
        let dataInConfig = fs.readFileSync('config.txt', { encoding: 'utf-8' });
        let config = dataInConfig.split(' ');
        console.log(config)
        let emailFrom = config[0];
        let password = config[1];
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            auth: {
                user: emailFrom,
                pass: password
            }
        });
        let rateUsdToBtc = await getRate();
        let dataInFile = fs.readFileSync(path, { encoding: 'utf8' });
        let emails = dataInFile.split(separator);
        let message = {
            from: emailFrom,
            to: '',
            subject: 'Rate',
            text: rateUsdToBtc
        };
        emails.forEach(email => {
            message.to = email;
            transporter.sendMail(message, (err, info) => {
                if (err) {
                    console.error(err)
                } else {
                    console.log(info);
                }
            });
        });
        res.writeHead(200, {
            'Content-type': 'text/html; charset=utf-8'
        });
        res.end();
    } else {
        res.writeHead(404, {
            'Content-type': 'text/html; charset=utf-8'
        });
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});
