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


const port = process.env.PORT || 3000

const appId = 'FB_APP_ID'
const appSecret = 'FB_APP_SECRET'

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//setup public folder
app.use(express.static('./public'));


const apiUrl = 'https://graph.facebook.com/v9.0/';


app.get('/', async (req, res) => {

  if (req.session.access_token) {
    const accessToken = req.session.access_token;
    const user = await db.User.findOne({ where: { user_id: req.session.user_id }});
    const adAccounts = await db.Account.findAll({
      where: {
        user_id: `${user.id}`
      }
    });
    res.render('index', {adaccounts: adAccounts, user: user, accessToken: accessToken})
    
  } else {
    res.redirect('/login');
  }
  
});

app.get('/login', (req, res) => {
  res.render('login')
});

app.get('/login/callback', async (req, res) => {
  const accessToken = req.query.access_token;
  const config = {
    method: 'get',
    url: `${apiUrl}oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`,
    headers: { }
  };
  axios(config)
      .then(async function (response1) {
        const data1 = response1.data;
        // res.send(JSON.stringify(data1));
        const longAccessToken = data1.access_token;
        req.session.access_token = longAccessToken;
        req.session.save(function(err) {
          // session saved
          if(!err) {
              //Data get lost here
              // res.redirect('/');
          }
          console.log('error', err)
          
        })
        const config = {
          method: 'get',
          url: `${apiUrl}me?fields=adaccounts.limit(25)%7Bid%2Cname%2Caccount_id%2Caccount_status%7D%2Cname%2Cid%2Cemail&access_token=${longAccessToken}`,
          headers: { }
        };
        
        axios(config)
        .then(async function (response) {
          
          const data = response.data;
          let user = await db.User.findOne({where: {user_id: `${data.id}`}});
          if (!user) {
            user = await db.User.create({user_id: `${data.id}`, name: data.name, email: data.email, access_token: longAccessToken});
          } else {
            user = await db.User.update({name: data.name, email: data.email, access_token: longAccessToken}, {
              where: {user_id: `${data.id}`}
            });
          }
          
          console.log(longAccessToken);
          req.session.user_id = data.id;
          req.session.save(function(err) {
            // session saved
            if(!err) {
                //Data get lost here
                // res.redirect('/');
            }
            console.log('error', err)
            
          })
          const userData = await db.User.findOne({where: {user_id: `${data.id}`}});
          console.log('user', userData);
          const adaccounts = data.adaccounts.data;
          adaccounts.map(async function(ad, index) {
            const [adAccount, accountCreated] = await db.Account.findOrCreate({where: {user_id: `${userData.id}`, account_id: ad.account_id}, defaults: {name: ad.name, act_id: ad.id}});
            // console.log(adAccount);
            const url = `${apiUrl}act_${ad.account_id}/campaigns?fields=id%2Cname%2Cstatus%2Cstart_time&limit=25&access_token=${longAccessToken}`;
            await getCampaigns(url);
            async function getCampaigns(apiURL) {
              const config1 = {
                method: 'get',
                url: apiURL,
                headers: { }
              };
              axios(config1)
              .then(async function (response2) {
                  response2.data.data.map(async (campaign, ii) => {
                    // console.log(campaign);
                    if (campaign.status === 'ACTIVE') {
                      const [camp, campCreated] = await db.Campaign.findOrCreate({where: {account_id: `${ad.account_id}`, campaign_id: campaign.id}, defaults: {name: campaign.name, campaign_start_date: campaign.start_time, campaign_status: campaign.status}});
                    }
                    if (response2.data.data.length == (ii +1)) {
                      if (response2.data.paging.hasOwnProperty('next')) {
                        await getCampaigns(response2.data.paging.next);
                      }
                    }
                  });
              })
              .catch(function (error) {
                console.log(error);
              });
              
            }
            return adAccount;
          });
          res.send(JSON.stringify(longAccessToken));
          // res.render('index', {adaccounts: adAccountsData, user: user, accessToken: accessToken})
    
        })
        .catch(function (error) {
          res.send(error);
        });
      })
      .catch(function (error) {
        console.log(error);
      });
});

app.get('/save-campaigns', async (req, res) => {
  const accessToken = req.query.access_token;
  const accountId = req.query.account_id;
  const url = `${apiUrl}act_${accountId}/campaigns?fields=id%2Cname%2Cstatus%2Cstart_time&limit=25&access_token=${accessToken}`;
  await getCampaigns(url);
  async function getCampaigns(apiURL) {
    const config1 = {
      method: 'get',
      url: apiURL,
      headers: { }
    };
    axios(config1)
    .then(async function (response2) {
        response2.data.data.map(async (campaign, ii) => {
          console.log(campaign);
          const [camp, campCreated] = await db.Campaign.findOrCreate({where: {account_id: `${ad.account_id}`, campaign_id: campaign.id}, defaults: {name: campaign.name, campaign_start_date: campaign.start_time, campaign_status: campaign.status}});
          if (response2.data.data.length == (ii +1)) {
            if (response2.data.paging.hasOwnProperty('next')) {
              await getCampaigns(response2.data.paging.next);
            }
          }
        });
        
      
    })
    .catch(function (error) {
      console.log(error);
    });
    
  }
});

app.get('/campaigns', async (req, res) => {
  if (req.session.access_token) {
    const accountId = req.query.account_id;
    const campaigns = await db.Campaign.findAll({
      where: {
        account_id: accountId,
      }
    });
    res.render('campaigns', {campaigns: campaigns})
    // res.send(JSON.stringify(campaigns));

    
  } else {
    res.redirect('/login');
  }

});

app.get('/campaigns/insights', async (req, res) => {
  if (req.session.access_token) {
    const campaignId = req.query.campaign_id;
    const campaign = await db.Campaign.findOne({
      where: {
        campaign_id: `${campaignId}`
      }
    });
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
    if (daysDiff > 2) {
      if (parseFloat(totalROAS) < 1 && parseFloat(totalSpend) > 50) {
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
    // res.send(JSON.stringify(insightsData));
    res.render('insight', {campaign: campaign, insightsData: insightsData, action: action})
    // res.send(JSON.stringify(insightsData));
  } else {
    res.redirect('/login');
  }
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})