const { ActivityTypes,
    CardFactory,
    ConversationState,
    TurnContext } = require('botbuilder');
const { ChoicePrompt,
    DialogSet,
    DialogTurnStatus,
    ListStyle } = require('botbuilder-dialogs');

const { getPromo } = require('./APICall');
const { LuisRecognizer } = require('botbuilder-ai');

const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
// const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';
const PROMPT_ID = 'cardPrompt';

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
            applicationId: process.env.LuisAppId,
            endpoint: process.env.LuisEndpoint,
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: process.env.LuisEndpointKey

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
        prompt.style = ListStyle.list;
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
                                await turnContext.sendActivity('Nice to meet you!');
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
                            case NONE_INTENT:
                            default:
                                // None or no intent identified, either way, let's provide some help
                                // to the user
                                await dc.context.sendActivity(`I didn't understand what you just said to me.`);
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

    // /**
    //  * Send a Rich Card response to the user based on their choice.
    //  *
    //  * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
    //  * @param {TurnContext} turnContext A TurnContext instance containing all the data needed for processing this conversation turn.
    //  * @param {DialogTurnResult} dialogTurnResult Contains the result from any called Dialogs and indicates the status of the DialogStack.
    //  */
    // async sendCardResponse(turnContext, dialogTurnResult) {
    //     switch (dialogTurnResult.result.value) {
    //         case 'Animation Card':
    //             await turnContext.sendActivity({ attachments: [this.createAnimationCard()] });
    //             break;
    //         case 'Audio Card':
    //             await turnContext.sendActivity({ attachments: [this.createAudioCard()] });
    //             break;
    //         case 'Hero Card':
    //             await turnContext.sendActivity({ attachments: [this.createHeroCard()] });
    //             break;
    //         case 'Receipt Card':
    //             await turnContext.sendActivity({ attachments: [this.createReceiptCard()] });
    //             break;
    //         default:
    //             await turnContext.sendActivity('An invalid selection was parsed. No corresponding Rich Cards were found.');
    //     }
    // }

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

        let response = await getPromo();
        console.log(response); //for debugging
        let cardList = [];
        let url;
        let imgLink;
        let title;
        let store;
        response.forEach(data => {
            store = data.store;
            if (store.includes(supermarket)) {
                title = data.title;
                imgLink = data.imgLink;
                if (data.pdfLink !== "null") {
                    url = data.pdfLink;
                }
                else {
                    url = imgLink;
                }
                console.log(imgLink);
                let promoCard = CardFactory.heroCard(
                    store,
                    CardFactory.images([imgLink]),
                    CardFactory.actions([
                        {
                            type: 'showImage',
                            title: title,
                            value: url
                        }
                    ])
                );
                cardList.push(promoCard);
            }
        });

        await turnContext.sendActivity({
            text: 'Here is a promotion from ' + store,
            attachments: cardList
        });

        // for (let i = 0; i < cardList.length; i++) {
        //     await turnContext.sendActivity({
        //         text: 'Here is an Super Market Promotion:',
        //         attachments: [cardList[i]]
        //     });
        // }
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