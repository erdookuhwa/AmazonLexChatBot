const AWS = require('aws-sdk');

// Route the incoming request based on intent.
const accounts = [
  {
    type: 'regular',
    username: 'eve',
    password: '12345678',
    order: 'Apple iPhone 14 Plus'
  },
  {
    type: 'prime',
    username: 'eve',
    password: '12345678',
    order: 'Herman Miller Embody Ergonomic Office Chair'
  },
];

// Check to see if an account matches for the account type and also that the username and password for that account matches the array
const getAccount = (type, username, password) => {
  const result = accounts.find(account => account.type.toLowerCase() === type.toLowerCase()
  && account.username === username && account.password === password);
  return result;
};

const orderIntent = (intentRequest, callback) => {
  const { slots } = intentRequest.currentIntent;
  const sessionAttributes = { ...intentRequest.sessionAttributes, ...slots };
  const account = getAccount(slots.TypeOfAccount, slots.UserName, slots.Password);

  if (!account) {
    callback(elicitSlot(sessionAttributes, 'GetOrderDetails', slots, 'UserName', 'Password', {
      contentType: 'PlainText',
      content: 'No accounts have been found with this username and password please try again',
    }));
  } else {
    callback(close(sessionAttributes, 'Fulfilled', {
      contentType: 'PlainText',
      content: `Your account has ${account.order} orders`,
    }));
  }
};

const orderIntentError = (intentRequest, callback) => {
  const { slots } = intentRequest.currentIntent;
  const sessionAttributes = { ...intentRequest.sessionAttributes, ...slots };
  const account = getAccount(slots.TypeOfAccount, slots.UserName, slots.Password);
  callback(close(sessionAttributes, 'Fulfilled', {
    contentType: 'PlainText',
    content: `You have ${account.order} orders in your account, what would you like to do?`,
  }));
};

// This a simple example to demonstrate how lambda can work with the flow
const simpleResponse = (intentRequest, callback) => {
  const { slots } = intentRequest.currentIntent;
  const $msg = `Thank you for using the lambda function.
  You entered the following values TypeOfAccount:${slots.TypeOfAccount} 
  UserName ${slots.UserName} Password ${slots.Password}.`;
  callback(close({}, 'Fulfilled', {
    contentType: 'PlainText',
    content: $msg,
  }));
};

// Called when the user specifies an intent for this skill.
const dispatch = (intentRequest, callback) => {
  console.log(JSON.stringify(intentRequest, null, 2));
  console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
  const intentName = intentRequest.currentIntent.name;

  if (intentName === 'GetOrderDetails') {
    return simpleResponse(intentRequest, callback);
    // return orderIntentError(intentRequest, callback);
    // return orderIntent(intentRequest, callback);
  }
  return {};
};

const loggingCallback = (response, originalCallback) => {
  console.log('lambda response:\n', JSON.stringify(response, null, 2));
  originalCallback(null, response);
};

// The handler function is the one that gets called by lambda as it is invoked
exports.handler = (event, context, callback) => {
  try {
    console.log(`event.bot.name=${event.bot.name}`);
    dispatch(event, response => loggingCallback(response, callback));
  } catch (err) {
    callback(err);
  }
};


// --------------- Helpers that build all of the responses -----------------------
// continue dialog with the customer, expressing that the user will select another intent after this response
const nextIntent = (sessionAttributes, message) => {
  console.log(`nextIntent:  ${JSON.stringify(message)}`);
  return {
    sessionAttributes,
    dialogAction: {
      type: 'ElicitIntent',
      message,
    },
  };
};

const elicitSlot = (sessionAttributes, intentName, slots, slotToElicit, message) => ({
  sessionAttributes,
  dialogAction: {
    type: 'ElicitSlot',
    intentName,
    slots,
    slotToElicit,
    message,
  },
});


const confirmIntent = (sessionAttributes, intentName, slots, message) => ({
  sessionAttributes,
  dialogAction: {
    type: 'ConfirmIntent',
    intentName,
    slots,
    message,
  },
});


const close = (sessionAttributes, fulfillmentState, message) => ({
  sessionAttributes,
  dialogAction: {
    type: 'Close',
    fulfillmentState,
    message,
  },
});

const delegate = (sessionAttributes, slots) => ({
  sessionAttributes,
  dialogAction: {
    type: 'Delegate',
    slots,
  },
});
