var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var senderID;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is a WolframBot server v1.1');
});

app.get('/privacypolicy', function (req, res) {
    res.send("We have access your Facebook user ID in order to reply to your messages. We in no way store that. This app uses the Wolfram Alpha API, so your message is sent on to their API. This is just a small bot developed by one guy, I'm not selling your data!");
});

// Facebook authenticator
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
        console.log('E: Attempted and failed to verify')
    }
});


// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            console.log('Recieved: ', event.message.text);
            senderID = event.sender.id;

            var messageworking = event.message.text;

            wolfram(event.message.text);

        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    console.log('Sent: ', message);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

//function to deal with wolfram api
function wolfram(question) {
    request({
        url: 'http://api.wolframalpha.com/v2/query',
        qs: {
            appid: '64JGGE-9WJEWGU34J',
            input: question,
            format: 'image,plaintext',
        },
        method: 'GET'
    }, function(error, response, body){
        var match = body.match(/<plaintext>(.*?)<\/plaintext>/g);
        var length;
        try {
          for(i = 0; i < match.length; i++)
          {
              var answerINT = match[i].replace("<plaintext>", "");
              var answer = answerINT.replace("</plaintext>", "");
              sendMessage(senderID, {text: answer});
          }
        }
        catch(e){
          sendMessage(senderID, {text: "Wolfram alpha could not intepret your request"});
          sendMessage(senderID, {text: e.message});
        }


        return 'done';
        });
};
