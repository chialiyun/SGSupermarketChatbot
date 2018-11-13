# SG SuperMarket Bot
SG Supermarket bot allow users to easily access SG Supermarket promotions through this bot.
![Banner](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Banner.png)

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 
See deployment for notes on how to deploy the project on a live system.
See [Wiki](https://github.com/chialiyun/SGSupermarketChatbot/wiki) for more details.

### Architecture Diagram
![Architecture diagram](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Architecture%20Diagram.png)

### Prerequisites:
1. Install NodeJS (https://nodejs.org/dist/v8.12.0/node-v8.12.0-x64.msi)
2. Install Visual Studio Code* (https://code.visualstudio.com/)
3. Install Git (https://git-scm.com/download/win)
4. Install Bot Framework Emulator (https://github.com/Microsoft/BotFramework-Emulator/releases/download/v4.0.0-preview.40025/botframework-emulator-setup-4.0.0-preview.40025.exe)
5. Azure Subscription (https://azure.microsoft.com/en-us/free/?ref=microsoft.com&utm_source=microsoft.com&utm_medium=docs&utm_campaign=visualstudio)

## Deployment:
### Steps
1. Create new project folder and change directory into it.
```
mkdir getbot
cd getbot
```
2. start nodejs project
```
 npm init
 //You can press enter all the way.
```
3. install required packages
```
 npm install --save botbuilder
 npm install --save restify
```
4. Create a new file named "index.js" and copy the content into it.
```
 // Reference the packages we require so that we can use them in creating the bot
 const restify = require('restify');
 const botbuilder = require('botbuilder');
 
 // Create bot adapter, which defines how the bot sends and receives messages.
 var adapter = new botbuilder.BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
 });
  
 // Create HTTP server.
 let server = restify.createServer();
 server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\n${server.name} listening to ${server.url}`);
 });
  
 // Listen for incoming requests at /api/messages.
 server.post('/api/messages', (req, res) => {
  // Use the adapter to process the incoming web request into a TurnContext object.
  adapter.processActivity(req, res, async (turnContext) => {
   // Do something with this incoming activity!
   if (turnContext.activity.type === 'message') {            
    // Get the user's text
    const utterance = turnContext.activity.text;
  
    // send a reply
    await turnContext.sendActivity(`I heard you say ${ utterance }`);
   }
  });
 });
```
5. Run node index.js to make sure the bot is working
6. Open Bot Framework Emulator and create a bot config pointing to your localhost endpoint
7. Ensure the bot is working

## Built With
* Microsoft Bot Builder SDK

## License
![](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)

SG Supermarket by Chia is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).