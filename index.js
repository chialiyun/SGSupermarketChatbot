 // Reference the packages we require so that we can use them in creating the bot
 const restify = require('restify');
 const { BotFrameworkAdapter, MemoryStorage, ConversationState } = require('botbuilder');
 const { SGSuperMartBot } = require('./bot');
  
 // Create HTTP server.
 let server = restify.createServer();
 server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\n${server.name} listening to ${server.url}`);
 });
  
 // Create bot adapter, which defines how the bot sends and receives messages.
 const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
   });

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let conversationState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);

//TO BE CONSIDERED
// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });
// conversationState = new ConversationState(blobStorage);

// Create the sgSuperMartBot.
const sgSuperMartBot = new SGSuperMartBot(conversationState);

 // Listen for incoming requests at /api/messages.
 server.post('/api/messages', (req, res) => {
  // Use the adapter to process the incoming web request into a TurnContext object.
  adapter.processActivity(req, res, async (turnContext) => {
    await sgSuperMartBot.onTurn(turnContext);
  });
 });

 // Catch-all for errors.
 adapter.onTurnError = async (turnContext, error) => {
    // This check writes out errors to console log v.s. Application Insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user.
    await turnContext.sendActivity(`Oops. Something went wrong!`);
};