const emoji = require('node-emoji')
const { ActivityTypes,
    CardFactory,
    MessageFactory,
    ConversationState,
    TurnContext } = require('botbuilder');
const { ChoicePrompt,
    DialogSet,
    DialogTurnResult,
    DialogTurnStatus,
    ListStyle } = require('botbuilder-dialogs');

const { getPromo,
    getNTUCProduct,
    getColdStorageProduct,
    getShengSiongProduct,
    getGiantProduct,
    resultKey } = require('./APICall');
const { LuisRecognizer } = require('botbuilder-ai');

const GREETING_INTENT = 'Greeting';
const GETSUPERMARKET_INTENT = 'GetSupermarket';
const GETPROMOTION_INTENT = 'GetPromotions';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';
const PROMPT_ID = 'cardPrompt';

// For result dictionary
const STORE_TYPE = "STORE";
const PRODUCT_TYPE = "PRODUCT";
const RESULT_TYPE = "TYPE";
const RESULT_VALUE = "VALUE";

const FAIRPRICE = "Fairprice";
const GIANT = "Giant";
const COLDSTORAGE = "Cold Storage";
const SHENG_SIONG = "Sheng Siong";

const FAIRPRICE_ENTITY = ['Fairprice'];
const FAIRPRICE_XTRA_ENTITY = ['Fairprice_Xtra'];
const FAIRPRICE_FINEST_ENTITY = ['Fairprice_Finest'];
const GIANT_ENTITY = ['Giant'];
const COLDSTORAGE_ENTITY = ['Cold_Storage'];
const PRIME_ENTITY = ['Prime'];
const SHENG_SIONG_ENTITY = ['Sheng_Siong']

/**
 * A bot that sends SGSuperMarket Promotions to the user when it receives a message.
 */
var isPrompt = false;

class SGSuperMartBot {
    /**
     * Constructs the three pieces necessary for this bot to operate:
     * 1. StatePropertyAccessor
     * 2. DialogSet
     * 3. ChoicePrompt
     *
     * The only argument taken (and required!) by this constructor is a
     * ConversationState instance.
     * The ConversationState is used to create a BotStatePropertyAccessor
     * which is needed to create a DialogSet that houses the ChoicePrompt.
     * @param {ConversationState} conversationState The state that will contain the DialogState BotStatePropertyAccessor.
     */
    constructor(conversationState) {

        // Add the LUIS recognizer.
        this.luisRecognizer = new LuisRecognizer({
            //Best Practice is to use application settings and not hardcode.
            applicationId: '5f42832363b2497197f0afb2ed1e3302',
            endpoint: 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/9a0561ef-c191-4ff7-8700-f1561385462f?subscription-key=5f42832363b2497197f0afb2ed1e3302&timezoneOffset=-360&q=',
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: '5f42832363b2497197f0afb2ed1e3302'
            // //Best Practice is to use application settings and not hardcode.
            // applicationId: process.env.LuisAppId,
            // endpoint: process.env.LuisEndpoint,
            // // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            // endpointKey: process.env.LuisEndpointKey

        });

        // Store the conversationState to be able to save state changes.
        this.conversationState = conversationState;
        // Create a DialogState StatePropertyAccessor which is used to
        // persist state using dialogs.
        this.dialogState = conversationState.createProperty('dialogState');

        // Create a DialogSet that contains the ChoicePrompt.
        this.dialogs = new DialogSet(this.dialogState);

        // Create the ChoicePrompt with a unique id of 'cardPrompt' which is
        // used to call the dialog in the bot's onTurn logic.
        const prompt = new ChoicePrompt('cardPrompt');

        // Set the choice rendering to list and then add it to the bot's DialogSet.
        prompt.style = ListStyle.buttons;
        this.dialogs.add(prompt);
    }

    /**
     * Driver code that does one of the following:
     * 1. Prompts the user if the user is not in the middle of a dialog.
     * 2. Reprompts a user when an invalid input is received.
     * 3. Sends back to the user a Rich Card response after a valid prompt reply.
     *
     * These three scenarios are preceeded by an Activity type check.
     * This check ensures that the bot only responds to Activities that
     * are of the "Message" type.
     *
     * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
     */
    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            let dialogResult;
            // Construct a DialogContext instance which is used to resume any
            // existing Dialogs and prompt users.
            const dc = await this.dialogs.createContext(turnContext);

            const results = await this.luisRecognizer.recognize(turnContext);
            const topIntent = LuisRecognizer.topIntent(results);

            await this.isTurnInterrupted(dc, results);

            dialogResult = await dc.continueDialog();

            console.log(dialogResult.status);
            console.log(dc.context.responded);
            console.log(dc.activeDialog);
            if (dc.activeDialog !== undefined) {
                console.log(dc.activeDialog.id === PROMPT_ID);
            }
            // If no active dialog or no active dialog has responded,
            if (!dc.context.responded) {
                // Switch on return results from any active dialog.
                switch (dialogResult.status) {
                    // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                    case DialogTurnStatus.empty:
                        // Determine what we should do based on the top intent from LUIS.
                        switch (topIntent) {
                            case GREETING_INTENT:
                                await turnContext.sendActivity('Hello ' + emoji.get(':wave:') +
                                    ' Wanna save some money ' + emoji.get(':moneybag:') + ' and find out the promotions for the supermarkets in Singapore?\n' +
                                    'Come on and send a name of a product and I will find out all the offers!! ' + emoji.get(':wink:'));
                                // Create the PromptOptions which contain the prompt and reprompt messages.
                                // PromptOptions also contains the list of choices available to the user.
                                const promptOptions = {
                                    prompt: 'Please select a Supermarket:',
                                    reprompt: 'That was not a valid choice, please select a Supermarket or number from 1 to 5.',
                                    choices: this.getChoices()
                                };
                                // Prompt the user with the configured PromptOptions.
                                await dc.prompt(PROMPT_ID, promptOptions);
                                // The bot parsed a valid response from user's prompt response and so it must respond.

                                break;
                            case GETSUPERMARKET_INTENT:
                                var supermarket = await this.getEntity(results, turnContext);

                                await turnContext.sendActivity('We are getting promotions from ' + supermarket + '...');

                                // Send supermarket promotions
                                await this.sendPromo(turnContext, supermarket)

                                break;
                            case GETPROMOTION_INTENT:
                                var result = await this.getPromoEntity(results, turnContext);
                                console.log(result);

                                // To send store adverstisement
                                if (result[RESULT_TYPE] == STORE_TYPE)
                                    // Send supermarket promotions
                                    await this.sendPromo(turnContext, result[RESULT_VALUE])
                                else if (result[RESULT_TYPE] == PRODUCT_TYPE) {
                                    // To send product list
                                    await turnContext.sendActivity('We are getting promotions for ' + result[RESULT_VALUE] + ' from ' + FAIRPRICE + '...');
                                    await this.sendProductPromo(turnContext, FAIRPRICE, result[RESULT_VALUE]);
                                    await turnContext.sendActivity('We are getting promotions for ' + result[RESULT_VALUE] + ' from ' + COLDSTORAGE + '...');
                                    await this.sendProductPromo(turnContext, COLDSTORAGE, result[RESULT_VALUE]);
                                    await turnContext.sendActivity('We are getting promotions for ' + result[RESULT_VALUE] + ' from ' + SHENG_SIONG + '...');
                                    await this.sendProductPromo(turnContext, SHENG_SIONG, result[RESULT_VALUE]);
                                    await turnContext.sendActivity('We are getting promotions for ' + result[RESULT_VALUE] + ' from ' + GIANT + '...');
                                    await this.sendProductPromo(turnContext, GIANT, result[RESULT_VALUE]);
                                }
                                break;
                            case HELP_INTENT:
                                await turnContext.sendActivity('I can show you the offer for products in SG Supermarkets! ' + emoji.get(':smile:') +
                                    '\nSimply send me a product name e.g. promo for milo, promo for cake' +
                                    "\nIf you want to see the supermarket's promotional advertisements, send me the supermarket's name e.g. promo for NTUC" +
                                    "\n\n Try now! Send me 'promo for milo'");
                                break;
                            case NONE_INTENT:
                            default:
                                // None or no intent identified, either way, let's provide some help
                                // to the user
                                await dc.context.sendActivity(`Sorry, I didn't understand what you just said to me.`);
                                break;
                        }
                        break;
                    case DialogTurnStatus.waiting:
                        // The active dialog is waiting for a response from the user, so do nothing.
                        break;
                    case DialogTurnStatus.complete:
                        // All child dialogs have ended. so do nothing.
                        await this.createCardResponse(turnContext, dialogResult);
                        break;
                    default:
                        // Unrecognized status from child dialog. Cancel all dialogs.
                        await dc.cancelAllDialogs();
                        break;
                }
            }
        }
        else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // Handle ConversationUpdate activity type, which is used to indicates new members add to
            // the conversation.
            // see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

            // Do we have any new members added to the conversation?
            if (turnContext.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (var idx in turnContext.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message
                    // the 'bot' is the recipient for events from the channel,
                    // context.activity.membersAdded == context.activity.recipient.Id indicates the
                    // bot was added to the conversation.
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        await turnContext.sendActivity('Welcome to the Sg Supermarket Bot!');
                    }
                }
            }
        }

        await this.conversationState.saveChanges(turnContext);
    }

    /**
     * Look at the LUIS results and determine if we need to handle
     * an interruptions due to a Help or Cancel intent
     *
     * @param {DialogContext} dc - dialog context
     * @param {LuisResults} luisResults - LUIS recognizer results
     */
    async isTurnInterrupted(dc, luisResults) {
        const topIntent = LuisRecognizer.topIntent(luisResults, 'None', 0.6);
        // see if there are anh conversation interrupts we need to handle
        if (topIntent === CANCEL_INTENT) {
            if (dc.activeDialog) {
                // cancel all active dialog (clean the stack)
                await dc.cancelAllDialogs();
                await dc.context.sendActivity(`Ok.  I've cancelled our last activity.`);
            } else {
                await dc.context.sendActivity(`I don't have anything to cancel.`);
            }
            return true; // this is an interruption
        }

        // if (topIntent === HELP_INTENT) {
        //     await dc.context.sendActivity(`Let me try to provide some help.`);
        //     await dc.context.sendActivity(`I understand greetings, being asked for help, or being asked to cancel what I am doing.`);
        //     return true; // this is an interruption
        // }
        return false; // this is not an interruption
    }

    /**
     * Create the choices with synonyms to render for the user during the ChoicePrompt.
     */
    getChoices() {
        const cardOptions = [
            {
                value: 'FairPrice',
                synonyms: ['1', 'fairprice', 'fairprice xtra', 'fairprice finest', 'fair price']
            },
            {
                value: 'Sheng Siong',
                synonyms: ['2', 'sheng siong', 'shengsiong']
            },
            {
                value: 'Giant',
                synonyms: ['3', 'giant']
            },
            {
                value: 'Cold Storage',
                synonyms: ['4', 'coldstorage', 'cold storage']
            },
            {
                value: 'Prime',
                synonyms: ['5', 'prime']
            }
        ];

        return cardOptions;
    }

    async sendPromo(turnContext, supermarket) {
        let response = await getPromo();
        let cardList = [];
        let url;
        let imgLink;
        let title;
        let store;
        // console.log(response); //for debugging
        response.forEach(data => {
            store = data.store;
            if (store.includes(supermarket)) {
                title = data.title;
                imgLink = data.imgLink;

                if (data.pdfLink !== null) {
                    url = data.pdfLink;
                }
                else {
                    url = imgLink;
                }

                let promoCard;

                if (turnContext.activity.channelId === 'facebook') {
                    promoCard = {
                        "title": title,
                        "subtitle": "",
                        "image_url": imgLink,
                        "default_action": {
                            "type": "web_url",
                            "url": url
                        },
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": url,
                                "title": "View Details"
                            },
                            {
                                "type": "element_share",
                                "share_contents": {
                                    "attachment": {
                                        "type": "template",
                                        "payload": {
                                            "template_type": "generic",
                                            "elements": [
                                                {
                                                    "title": title,
                                                    "subtitle": "",
                                                    "image_url": imgLink,
                                                    "default_action": {
                                                        "type": "web_url",
                                                        "url": url
                                                    },
                                                    "buttons": [
                                                        {
                                                            "type": "web_url",
                                                            "url": url,
                                                            "title": "View Details"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                } else
                    promoCard = CardFactory.heroCard(
                        title,
                        CardFactory.images([imgLink]),
                        CardFactory.actions([
                            {
                                type: 'openUrl',
                                title: 'View Details',
                                value: url
                            },
                            {
                                type: 'showImage',
                                title: 'Share',
                                value: url
                            }
                        ])
                    );
                cardList.push(promoCard);
            }
        });


        if (turnContext.activity.channelId === 'facebook') {
            await turnContext.sendActivity("There are " + cardList.length + " promotion from " + supermarket)

            // Facebook's carousell card limitation
            if (cardList.length > 10) {
                let size = 10;
                for (let i = 0; i < cardList.length / 10; i++) {
                    let count = i * 10;
                    let items = cardList.slice(count, count + size)
                    await turnContext.sendActivity({
                        "channelData": {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "generic",
                                    "elements": items
                                }
                            }
                        }
                    });
                }
            } else {
                await turnContext.sendActivity({
                    "channelData": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": cardList
                            }
                        }
                    }
                });
            }
        } else {
            await turnContext.sendActivity({
                "type": "message",
                "text": "There are " + cardList.length + " promotion from " + supermarket,
                "attachmentLayout": "carousel",
                "attachments": cardList
            })
        }
    }

    async sendProductPromo(turnContext, store, product) {
        let response;
        switch (store) {
            case FAIRPRICE:
                response = await getNTUCProduct(product);
                break;
            case COLDSTORAGE:
                response = await getColdStorageProduct(product);
                break;
            case SHENG_SIONG:
                response = await getShengSiongProduct(product);
                break;
            case GIANT:
                response = await getGiantProduct(product);
                break;
        }
        console.log(response);
        let cardList = [];

        response.forEach(data => {
            var text = "";

            if (data[resultKey.PRODUCT_ORIGINAL_PRICE] !== "")
                text += "ORIGINAL PRICE IS " + data[resultKey.PRODUCT_ORIGINAL_PRICE];
            if (data[resultKey.PRODUCT_DISCOUNTED_PRICE] !== "")
                text += "\nNOW IS " + data[resultKey.PRODUCT_DISCOUNTED_PRICE]
            if (data[resultKey.PRODUCT_ADDITIONAL_PROMO] !== "")
                text += "\n\n" + data[resultKey.PRODUCT_ADDITIONAL_PROMO]
            if (data[resultKey.PRODUCT_PROMO_EXPIRY] !== "")
                text += "\n\n Promotion Till:\n" + data[resultKey.PRODUCT_PROMO_EXPIRY]

            console.log(text);


            let promoCard;
            if (turnContext.activity.channelId === 'facebook') {
                promoCard = {
                    "title": data[resultKey.PRODUCT_NAME],
                    "subtitle": text,
                    "image_url": [data[resultKey.PRODUCT_IMAGE_URL]],
                    "default_action": {
                        "type": "web_url",
                        "url": [data[resultKey.PRODUCT_URL]]
                    },
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": [data[resultKey.PRODUCT_URL]],
                            "title": "View Details"
                        },
                        {
                            "type": "element_share",
                            "share_contents": {
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "generic",
                                        "elements": [
                                            {
                                                "title": data[resultKey.PRODUCT_NAME],
                                                "subtitle": "",
                                                "image_url": [data[resultKey.PRODUCT_IMAGE_URL]],
                                                "default_action": {
                                                    "type": "web_url",
                                                    "url": [data[resultKey.PRODUCT_URL]]
                                                },
                                                "buttons": [
                                                    {
                                                        "type": "web_url",
                                                        "url": [data[resultKey.PRODUCT_URL]],
                                                        "title": "View Details"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            } else
                promoCard = CardFactory.heroCard(
                    data[resultKey.PRODUCT_NAME],
                    text,
                    CardFactory.images([data[resultKey.PRODUCT_IMAGE_URL]]),
                    CardFactory.actions([
                        {
                            type: 'openUrl',
                            title: 'View details',
                            value: data[resultKey.PRODUCT_URL],
                        }
                    ]),
                );

            cardList.push(promoCard);
        });

        if (cardList.length == 0)
            await turnContext.sendActivity("Sorry, we do not see any promotions for " + product + " in " + store + ". " + emoji.get(':disappointed:'))
        else {
            if (turnContext.activity.channelId === 'facebook') {
                await turnContext.sendActivity("There are " + cardList.length + " " + product + " promotions from " + store)

                // Facebook's carousell card limitation
                if (cardList.length > 10) {
                    let size = 10;
                    for (let i = 0; i < cardList.length / 10; i++) {
                        let count = i * 10;
                        let items = cardList.slice(count, count + size)
                        await turnContext.sendActivity({
                            "channelData": {
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "generic",
                                        "elements": items
                                    }
                                }
                            }
                        });
                    }
                } else {
                    await turnContext.sendActivity({
                        "channelData": {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "generic",
                                    "elements": cardList
                                }
                            }
                        }
                    });
                }
            } else {
                await turnContext.sendActivity({
                    "type": "message",
                    "text": "There are " + cardList.length + " " + product + " promotion from " + store,
                    "attachmentLayout": "carousel",
                    "attachments": cardList
                })
            }

        }

    }

    async getPromoEntity(luisResult, context) {
        console.log("Result: ");
        console.log(luisResult);
        let result = {};
        let type;
        let value;
        console.log("Entities: ");
        console.log(luisResult.entities);
        //Check if entities contains either stores or products.
        if (luisResult.entities.stores) {
            type = "store";
            value = luisResult.entities.stores[0][0];
            result[RESULT_TYPE] = STORE_TYPE;
            result[RESULT_VALUE] = value;
            await context.sendActivity('We are getting promotions from ' + value + '...');
        }
        else if (luisResult.entities.products) {
            type = "product";
            value = luisResult.entities.products[0];
            result[RESULT_TYPE] = PRODUCT_TYPE;
            result[RESULT_VALUE] = value;
            await context.sendActivity('We are getting promotions for ' + value + '...');
        }
        else
            await context.sendActivity('Sorry, I do not understand what you are saying.');

        return result;
    }

    async createCardResponse(turnContext, dialogTurnResult) {
        let supermarket;
        switch (dialogTurnResult.result.value) {
            case 'FairPrice':
                supermarket = dialogTurnResult.result.value;
                break;
            case 'Sheng Siong':
                supermarket = dialogTurnResult.result.value;
                break;
            case 'Giant':
                supermarket = dialogTurnResult.result.value;
                break;
            case 'Cold Storage':
                supermarket = dialogTurnResult.result.value;
                break;
            case 'Prime':
                supermarket = dialogTurnResult.result.value;
                break;
            default:
                await turnContext.sendActivity('An invalid selection was parsed. No corresponding Supermarkets were found.');
        }

        await this.sendPromo(turnContext, supermarket)
        // let response = await getPromo();
        // // console.log(response); //for debugging
        // let cardList = [];
        // let url;
        // let imgLink;
        // let title;
        // let store;
        // response.forEach(data => {
        //     store = data.store;
        //     if (store.includes(supermarket)) {
        //         title = data.title;
        //         imgLink = data.imgLink;
        //         if (data.pdfLink !== "null") {
        //             url = data.pdfLink;
        //         }
        //         else {
        //             url = imgLink;
        //         }
        //         // console.log(imgLink);
        //         let promoCard = CardFactory.heroCard(
        //             "",
        //             CardFactory.images([imgLink]),
        //             CardFactory.actions([
        //                 {
        //                     type: 'showImage',
        //                     title: title,
        //                     value: url
        //                 }
        //             ])
        //         );
        //         cardList.push(promoCard);
        //     }
        // });


        // await turnContext.sendActivity({
        //     "type": "message",
        //     "text": "Here are the list of promotion from " + supermarket,
        //     "attachmentLayout": "carousel",
        //     "attachments": cardList
        // })
    }

    /**
     * Helper function to update user profile with entities returned by LUIS.
     *
     * @param {LuisResults} luisResults - LUIS recognizer results
     * @param {DialogContext} dc - dialog context
     */
    async getEntity(luisResult, context) {
        console.log(luisResult)
        var supermarket;
        // Check if entity exist
        if (Object.keys(luisResult.entities).length !== 1) {
            // see if we have any supermarket entities
            SHENG_SIONG_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "Sheng Siong"
                }
            });
            FAIRPRICE_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "FairPrice"
                }
            });
            FAIRPRICE_FINEST_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "FairPrice Finest"
                }
            });
            FAIRPRICE_XTRA_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "FairPrice Xtra"
                }
            });
            GIANT_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "Giant"
                }
            });
            COLDSTORAGE_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "Cold Storage"
                }
            });
            PRIME_ENTITY.forEach(name => {
                if (luisResult.entities[name] !== undefined) {
                    supermarket = "Prime"
                }
            });
        }

        return supermarket;
    }

}
exports.SGSuperMartBot = SGSuperMartBot;

// CardFactory.heroCard(
//     'BotFramework Hero Card',
//     CardFactory.images(['https://coldstorage.com.sg/media/weeklydeals/1178/guutezhn7cy6yjqkcesjva44sqw5upwqkq-min-20181005111805.jpg']),
//     CardFactory.actions([
//         {
//             type: 'showImage',
//             title: 'Baby Fair Specials',
//             value: 'https://coldstorage.com.sg/media/uploads/images/a417d3d3bf1c1a838e48b3b5e81c73c2.jpg'
//         }
//     ])
// );