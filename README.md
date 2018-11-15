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

## Local Deployment:
### Steps
1. Clone the repo
2. Run the application
3. Test the application

#### Clone the repo
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
4. Clone the `SG Supermarket chatbot` locally. In a terminal, run:
```
$ git clone https://github.com/chialiyun/SGSupermarketChatbot.git
```

#### Run the application
1. In the same terminal, run:
```
$ node index.js
```

#### Test the application
1. Launch the `Microsoft Bot Framework Emulator`. You can read more about it [here](https://github.com/microsoft/botframework-emulator/wiki/Getting-Started)

2. Create a new bot configuration
    Bot configuration is a file that keeps your settings that reaches out to your chatbot. Just by doing this step, you no longer have to always type your end point.
   1. Click on 'create a new bot configuration' in the Welcome page or File -> New Bot Configuration. 
   2. Fill in the required fields and click save and connect:
     Currently, for a local chatbot we only need to fill in:
     1. Bot Name (Give it any name that will be easy for you to identify next time)
     2. End Point URL ("http://localhost:3978/api/messages")
        As we are building the chatbot locally, our endpoint now will be pointing to the localhost (our computer)

## Built With
* Microsoft Bot Builder SDK

## Additional Reference Links
1. Microsoft Bot Framework
2. Bot Samples for NodeJS

## License
![](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)

SG Supermarket by Chia is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).