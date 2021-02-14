const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser')
const path = require('path')
const session = require('express-session')
const moment = require('moment')
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const db = require('./models/index.js');
const cors = require('cors')

const app = express()
app.use(cors())
app.use(cookieParser())
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


const port = process.env.PORT || 3001

const appId = '412831599783770'
const appSecret = '62f7f973d42aa78a962344d6f9846db7'

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//setup public folder
app.use(express.static('./public'));

// let accessToken = 'EAADJ2wKgiRsBANntz3IMDnYvNBnGJevFZBTqOqrqPQGGP21ZAqZCx7FHfDk9RXocl8uHTFp07Be1s6O7UxtqgrLZCMtMa0UiCB8Hz9BP23zlHISeOzp5o6bdwWXqYufMCNiZCHk3KjczNqfy3q8xCcwRg9iOLDzyl057BFfyA5XuMzuOQ1ZBrTRAYYYHqODka1OSVbHkF4CTXWokX00xmPz7IeN6GqL4abNu36xWU3ZCgZDZD';
const apiUrl = 'https://graph.facebook.com/v9.0/';
updateInsights();

async function updateInsights() {
    const users = await db.User.findAll();
    users.map(async (user) => {
        console.log(user);
        const accounts = await db.Account.findAll({ where: {user_id: `${user.id}`}});
        accounts.map(async (account) => {
            const campaigns = await db.Campaign.findAll({where: {account_id: `${account.account_id}`}});
            campaigns.map(async (campaign) => {
                const insightsData = await db.Insight.findAll({
                where: {
                    campaign_id: `${campaign.id}`,
                },
                order: [
                    ['createdAt', 'DESC']
                ]
                });
                const now = moment();
                const totalSpend = (insightsData.length > 0) ? insightsData[0].spend: '0';
                const totalRevenue = (insightsData.length > 0) ? insightsData[0].revenue: '0';
                const totalROAS = (insightsData.length > 0) ? insightsData[0].roas: '0';
                const campaignStartDate = moment(campaign.campaign_start_date).format("dddd, MMMM Do YYYY, h:mm:ss a");
                const daysDiff = now.diff(campaign.campaign_start_date, "days");
                let message = '';
                let sendEmail = false;
                if (daysDiff > 2) {
                    if (parseFloat(totalROAS) < 1 && parseFloat(totalSpend) > 50) {
                        sendEmail = true;
                        message = `Your campaign ${campaign.name} has only ${parseFloat(totalROAS).toFixed(2)} ROAS from ${daysDiff} days, total spend ${parseFloat(totalSpend).toFixed(2)}, so you may end this campaign`;
                    }
                }
                let action = {
                    name: campaign.name,
                    spend: parseFloat(totalSpend).toFixed(2),
                    revenue: parseFloat(totalRevenue).toFixed(2),
                    roas: parseFloat(totalROAS).toFixed(2),
                    daysAgo: daysDiff,
                    campaignStart: campaignStartDate,
                    message: message,
                };
                
                if (sendEmail) {
                    // create reusable transporter object using the default SMTP transport
                    let transporter = nodemailer.createTransport({
                        host: "in1.fcomet.com",
                        port: 465,
                        secure: true, // true for 465, false for other ports
                        auth: {
                            user: 'help@microwebstudio.com', // generated ethereal user
                            pass: 'dinesh16061990', // generated ethereal password
                        },
                    });

                    // send mail with defined transport object
                    let info = await transporter.sendMail({
                        from: '"Dinesh Kumar" <help@microwebstudio.com>', // sender address
                        to: "ayoych@gmail.com", // list of receivers
                        subject: `TripleWhale - Action need for campaign Id ${campaign.campaign_id}`, // Subject line
                        text: message, // plain text body
                        // html: "<b>Hello world?</b>", 
                    });

                    console.log("Message sent: %s", info.messageId);
                }
            });
        });
    });
}


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
