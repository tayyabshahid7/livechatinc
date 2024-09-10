import cors from "cors";

let corsOptions = {
  origin: '*',
}

import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
const app = express().use(bodyParser.json()); // creates http server
const secret_key = "token"; // webhooks secret key
const server_url = "https://826d-2400-adc5-13c-9000-b134-e62a-487b-1c0b.ngrok-free.app" // url for webhooks

// Client ID, Secret and RedirectURI from Developer Console app:
// https://developers.livechatinc.com/console/apps/
const client_id = "3e54ea8d51ebd91d4cee9d236bf61b40";
const client_secret = "FAYQSlj0G1X3Oj1EbpMdiGyGrvXWE3j8";
const redirect_uri = "http://localhost:63342/webinar-chatbot-demo/index.html";

// Story ID from URL: https://app.chatbot.com/stories/5de66551341e2d000799a070
const storyId = "66df61b8851ebb000742f1b2";

// Client access token from: https://app.chatbot.com/settings/developers
const cbToken =
    "Bearer sRFmu57JyPVRGorUUvgoGuWZfdIoivJR";

// Globals
// TODO: Move to DB
let accessToken;
let refreshToken;
let botNumber;
let authCode;
let cbResponse;

// APIs client instances
const accountsApi = axios.create({
  baseURL: "https://accounts.livechatinc.com"
});

const restApi = axios.create({
  baseURL: "https://api.livechatinc.com/v3.3"
});

const chatBotApi = axios.create({
  baseURL: "https://api.chatbot.com"
});

// Use CORS to avoid cross-site errors
app.use(cors(corsOptions));

app.listen(3000, () => console.log("Listening for webhooks"));

/// Authorization
app.post("/auth", async (req, res) => {
  authCode = req.body.code;
  /// Exchange code for access token and refresh token
  try {
    const authBody = {
      grant_type: "authorization_code",
      code: authCode,
      client_id: client_id,
      client_secret: client_secret,
    };

    // post to LiveChat
    const authExchange = await axios.post("https://accounts.livechatinc.com/v2/token", authBody, {
      // headers: {
      //   'Authorization': `Bearer NDJjYzM2YzAtMTZmZi00OWFiLWI3OWMtYTE1MTJiYmY3N2FhOmRhbDpyNy1NZVp0V003RlBJUU5CMjZiMV9wbFdDWTg`,
      //   'Content-Type': 'application/json'
      // }
    });

    console.log("Exchange code for access token and refresh token");
    console.log(authExchange);
    refreshToken = authExchange.data.refresh_token;
    accessToken = authExchange.data.access_token;
    console.log("Refresh Token: " + refreshToken);
    console.log("Access Token: " + accessToken);
    console.log("___");
    return res.sendStatus(200);
  } catch (error) {
    console.log("our error1", error);
    return res.sendStatus(401);
  }
});

/// Get list of bot_agents
app.post("/bot_list", async (req, res) => {
  console.log("___");
  console.log("Get list of bot agents");

  try {
    const botsBody = {
      all: true
    };


    // post to LiveChat
    const botsList = await restApi.post(
      "/configuration/action/list_bots",
      botsBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log("List of bots");
    console.log(botsList.data);
    console.log("Number of bots: " + botsList.data?.length);
    console.log("___");
    return res.status(200).send(botsList?.data);
  } catch (e) {
    if (e.response.status == 401) {
      await authExchange();
      return res.status(401).send("Authorization error, please try again");
    }
    console.log("our error1a", e);
    return res.status(500).send(e);
  }
});

/// Create new bot
app.post("/bot_create", async (req, res) => {
  console.log("___");
  console.log("Create new bot");
  const botName = req.body.botName;

  try {
    const botCreateBody = {
      name: botName,
      status: "accepting chats",
      avatar: "https://cdn.iconscout.com/icon/free/png-256/bot-136-504893.png",
      webhooks: {
        url: server_url,
        actions: [
          {
            name: "incoming_event",
            filters: {
              author_type: "customer"
            }
          }
        ],
        secret_key: secret_key
      }
    };

    // post to LiveChat
    const botCreate = await restApi.post(
      "/configuration/action/create_bot",
      botCreateBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log("Bot created");
    console.log(botCreate.data);
    console.log("___");
    return res.status(200).send(botCreate.data);
  } catch (e) {
    if (e.response.status == 401) {
      await authExchange();
      return res.status(401).send("Authorization error, please try again");
    }
    console.log("our error1a", e);
    return res.status(500).send(e);
  }
});

/// Select bot
app.post("/bot_select", (req, res) => {
  console.log("___");
  console.log("Select bot");
  botNumber = req.body.botNumber;
  console.log("Selected bot: " + botNumber);
  return res.status(200).send(botNumber + " selected");
});

/// Remove bot
app.post("/bot_remove", async (req, res) => {
  console.log("____");
  console.log("Remove bot");
  const botNumber = req.body.botNumber;
  try {
    const botRemoveBody = {
      bot_agent_id: botNumber
    };

    // post to LiveChat
    const botRemove = await restApi.post(
      "/configuration/action/remove_bot_agent",
      botRemoveBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log("Bot Removed");
    console.log(botRemove.data);
    console.log("___");
    return res.status(200).send(botRemove.data);
  } catch (e) {
    if (e.statusCode == 401) {
      await authExchange();
      return res.status(401).send("Authorization error, please try again");
    }
    console.log("our error1a", e);
    return res.status(500).send(e);
  }
});

/// Get new messages
app.post("/", async (req, res) => {
  try {
    console.log("LiveChat Webhook");
    console.log("Action: " + req.body.action);
    console.log("Chat ID: " + req.body.payload.chat_id);
    console.log("Author: " + req.body.payload.event.author_id);
    console.log("Message: " + req.body.payload.event.text);
    console.log("___");
    let ChatID = req.body.payload.chat_id;

    // Transfer chat to human agent if customer types "transfer"
    if (req.body.payload.event.text == "transfer") {
      transferChat(ChatID);
    }

    try {
      const cbBody = {
        query: req.body.payload.event.text,
        storyId: storyId,
        sessionId: req.body.payload.chat_id
      };

      // post to ChatBot
      const mesCB = await chatBotApi.post(
        "/query",
        cbBody,
        {
          headers: {
            Authorization: cbToken
          }
        }
      );
      console.log(mesCB);
      cbResponse = mesCB.data.result.resolvedQuery
      console.log("Chatbot response");
      console.log(cbResponse);
      console.log("___");
      // Send bot response to the chat
      sendMessage(ChatID);
    } catch (e) {
      console.log("our error4", e);
    }

    return res.sendStatus(200);
  } catch (e) {
    console.log("our error5", e);
    return res.sendStatus(200);
  }
});

/// Use refresh token
async function authExchange() {
  try {
    const authRefreshBody = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: client_id,
      client_secret: client_secret
    };
    console.log(authRefreshBody);
    // post to LiveChat
    const authRefreshExchange = await accountsApi.post(
      "/token",
      authRefreshBody,
    );

    console.log("Exchange refresh token for access token");
    console.log(authRefreshExchange);
    accessToken = authRefreshExchange.data.access_token;
    console.log("Refresh Token: " + authRefresh);
    console.log("Access Token: " + accessToken);
    console.log("___");
    console.log("Retry send message");
  } catch (e) {
    console.log("our error3", e);
  }
}

/// Send message to LiveChat
async function sendMessage(ChatID) {
  try {
    const lcBody = {
      chat_id: ChatID,
      event: {
        type: "message",
        text: cbResponse,
        recipients: "all"
      }
    };
    console.log(accessToken);
    // post to LiveChat

    const mesLC = await axios.post("https://api.livechatinc.com/v3.5/agent/action/send_event", lcBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    console.log("LiveChat response");
    console.log("Event ID: " + mesLC.data.event_id);
    console.log("___");
  } catch (e) {
    console.log("our error2", e);
    if (e.response.status == 401) {
      await authExchange();
      await sendMessage(ChatID);
      // todo: add 3 tries limit
    }
  }
}

/// Transfer chat to General group
async function transferChat(ChatID) {
  try {
    const lcBody = {
      chat_id: ChatID,
      target: {
        type: "group",
        ids: [0]
      }
    };

    // post to LiveChat
    const transferLC = await restApi.post(
      "/agent/action/transfer_chat",
      lcBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Author-Id": botNumber
        }
      }
    );

    console.log("Chat transferred");
    console.log(transferLC.data);
    console.log("___");
  } catch (e) {
    console.log("our error2", e);
    if (e.response.status == 401) {
      await authExchange();
      await transferChat(ChatID);
      // todo: add 3 tries limit
    }
  }
}
