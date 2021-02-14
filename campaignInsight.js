const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser')
const path = require('path')
const session = require('express-session')
const moment = require('moment')
const { Op } = require("sequelize");
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

const appId = 'FB_APP_ID'
const appSecret = 'FB_APP_SECRET'

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
                const TODAY_START = new Date().setHours(0, 0, 0, 0);
                const NOW = new Date();
                const accessToken = user.access_token;
                const campaignId = campaign.campaign_id;
                let timeRange = `{'since':'${moment(campaign.campaign_start_date).format('YYYY-MM-DD')}','until':'${moment().format('YYYY-MM-DD')}'}`;
                const insightsCounts = await db.Insight.count({
                    where: {
                    campaign_id: `${campaign.id}`
                    }
                });

                if (insightsCounts > 0) {
                    timeRange = `{'since':'${moment(campaign.campaign_start_date).format('YYYY-MM-DD')}','until':'${moment().format('YYYY-MM-DD')}'}`;
                }
                const config = {
                    method: 'get',
                    url: `${apiUrl}${campaignId}/insights?fields=account_id%2Ccampaign_id%2Ccampaign_name%2Cdate_start%2Cdate_stop%2Cimpressions%2Cspend%2Ccpc%2Ccpm%2Cconversions%2Cpurchase_roas&access_token=${accessToken}&time_range=${timeRange}`,
                    headers: { }
                };
                axios(config)
                .then(async function (response) {
                    const data = response.data;
                    const spend = data.data[0].spend;
                    const impressions = data.data[0].impressions;
                    const cpc = data.data[0].cpc;
                    const cpm = data.data[0].cpm;
                    let roas = '0';
                    if (data.data[0].hasOwnProperty('purchase_roas')) {
                    data.data[0].purchase_roas.map((r) => {
                        if (r.action_type === 'omni_purchase') {
                        roas = r.value;
                        }
                    });
                    }
                    const revenue = parseFloat(spend) * parseFloat(roas);
                    
                    const insight = await db.Insight.create({campaign_id: `${campaign.id}`, roas: roas, spend: spend, impressions: impressions, cpc: cpc, cpm: cpm, revenue: revenue});
                })
                .catch(function (error) {
                    console.log(error);
                });
            });
        });
    });
}


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
