# SG SuperMarket Bot
SG Supermarket bot allow users to easily access SG Supermarket promotions through this bot.
![Banner](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Banner.png)

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 
See [Wiki](https://github.com/chialiyun/SGSupermarketChatbot/wiki) for more details on how to deploy the project on a live system and other sample codes.

### Architecture Diagram
Here is how the different services are used and connected in my solution.
![Architecture diagram](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Architecture%20Diagram.png)

1. The developer creates the chatbot using Microsoft Bot Framework (Bot Builder SDK) and deploy the code into GitHub for version control.
2. Azure Cloud Services is used to host the Chatbot. An Azure Web App is created to provide the endpoint for the web service that will be used to point at to access the chatbot and connect to Bot Service for publication of the Chatbot to other channels (Facebook Messenger in particular for SG Supermarket Chatbot). It get access to the codes via GitHub repository. Language Understanding Intelligent Service (LUIS) is used and connected to the Web App to bring intelligence to the chatbot to behave just like like human.
3. Having published the application to the platform, end-users can then interact with the chatbot

### Prerequisites:
1. Install [NodeJS](https://nodejs.org/dist/v8.12.0/node-v8.12.0-x64.msi) - Programming Language used for SG Supermarket 
2. Install [Visual Studio Code*](https://code.visualstudio.com/) - You may use this code editor to edit your codes
3. Install [Git](https://git-scm.com/download/win) - Git for version control of your codes
4. Install [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/download/v4.0.0-preview.40025/botframework-emulator-setup-4.0.0-preview.40025.exe) - For Local testing of the chatbot before deployment
5. [Azure Subscription](https://azure.microsoft.com/en-us/free/?ref=microsoft.com&utm_source=microsoft.com&utm_medium=docs&utm_campaign=visualstudio) - Required to publish the chatbot for public usage in the various platform (e.g. embed in webpage, Facebook Messenger, Telegram, Slack, etc.)

## Local Deployment:
### Steps
1. [Clone the repo](https://github.com/chialiyun/SGSupermarketChatbot#clone-the-repo)
2. [Run the application](https://github.com/chialiyun/SGSupermarketChatbot#run-the-application)
3. [Test the application](https://github.com/chialiyun/SGSupermarketChatbot#test-the-application)

#### Clone the repo
1. Create new project folder and change directory into it.
```
mkdir testChatbot
cd testChatbot
```
2. Clone the `SG Supermarket chatbot` locally. In a terminal, run:
```
$ git clone https://github.com/chialiyun/SGSupermarketChatbot.git
```
3. Change the directory in `SGSupermarketChatbot`
```
cd SGSupermarketChatbot
```

4. Install all required packages
```
$ npm install
```

#### Run the application
1. In the same terminal, run:
```
$ node index.js
```

This should show you:
```
$ restify listening to http://[::]:3978
```

#### Test the application
1. Launch the `Microsoft Bot Framework Emulator`. You can read more about it [here](https://github.com/microsoft/botframework-emulator/wiki/Getting-Started)

2. Create a new bot configuration
    Bot configuration is a file that keeps your settings that reaches out to your chatbot. Just by doing this step, you no longer have to always type your end point.
   1. Click on 'create a new bot configuration' in the Welcome page or File -> New Bot Configuration. 
   ![1. create bot configuration.png](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Documentation/Microsoft%20Bot%20Framework%20Emulator/1.%20create%20bot%20configuration.png)
   2. Fill in the required fields and click save and connect:
     Currently, for a local chatbot we only need to fill in:
        1. Bot Name (Give it any name that will be easy for you to identify next time)
        2. End Point URL ("http://localhost:3978/api/messages")
        As we are building the chatbot locally, our endpoint now will be pointing to the localhost (our computer)
        ![2. Fill in the configuration.png](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Documentation/Microsoft%20Bot%20Framework%20Emulator/2.%20Fill%20in%20the%20configuration.png)
    3. Start Testing
    ![3. start testing.png](https://github.com/chialiyun/SGSupermarketChatbot/blob/master/image/Documentation/Microsoft%20Bot%20Framework%20Emulator/3.%20start%20testing.png)

## Built With
* Microsoft Bot Builder SDK

## Additional Reference Links
1. [Microsoft Bot Framework](https://docs.microsoft.com/en-us/azure/bot-service/javascript/bot-builder-javascript-quickstart?view=azure-bot-service-4.0)
2. [Bot Samples for NodeJS](https://github.com/Microsoft/BotBuilder-Samples)

## License
![](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)

SG Supermarket by Chia is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).
