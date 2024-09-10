import axios from "axios";
const apiInstance = axios.create({
    baseURL: "https://5cde-2400-adc5-13c-9000-b134-e62a-487b-1c0b.ngrok-free.app",
    headers: { "Content-Type": "application/json" }
});

// Sending code to the backend
function authSend(data) {
    const payload = {
        code: data.code
    };

    apiInstance
        .post("/auth", payload)
        .then(function(response) {
            console.log(response.data);
            botList();

            document.getElementById("livechat-login-button").style.display = "none";
            document.querySelector(".authorization").innerHTML = "Authorized!";
            document.getElementById("livechat-authorization-done").style.display = "block";
            document.querySelector(".authorization-done").innerHTML = "Your email address: " + data.entity_id;
        })
        .catch(function(error) {
            console.log(error);
        });
}

// Getting list of bots
function botList() {
    debugger
    const payload = {};

    apiInstance
        .post("/bot_list", payload)
        .then(function(response) {
            console.log(response.data);
            const bot_list = response.data;

            const listArray = bot_list;
            const list = document.querySelector(".bot-list");
            const listItems = listArray.map(function(element) {
                return `
          <li id='${element.id}' class='listItem' style="display: flex; margin-bottom: 10px;align-items: center;">
              <img src="${element.avatar}" style="width: 48px; height: 48px; border-radius: 50%;"/>

              <div style="display: flex; flex-direction: column; padding: 10px; width: 280px;">
                  <strong>${element.name}</strong>
                  <span>${element.id}</span>
              </div>

              <div>
                  <button id='${element.id}' class="lc-btn lc-btn--compact btn-select" onclick="botSelect('${element.id}')">Select</button>
                  <button class="lc-btn lc-btn--destructive lc-btn--compact" onclick="botRemove('${element.id}')">&times;</button>
              </div>
          </li>`;
            });

            list.innerHTML = listItems.join("");
        })
        .catch(function(error) {
            console.log(error);
        });
}

// Creating new bot
function botCreate() {
    const botName = document.getElementsByName("BotName")[0].value;

    const payload = {
        botName
    };

    apiInstance
        .post("/bot_create", payload)
        .then(function(response) {
            console.log(response.data);
            botList();
        })
        .catch(function(error) {
            console.log(error);
        });
}


function botRemove(data) {
    const payload = {
        botNumber: data
    };

    apiInstance
        .post("/bot_remove", payload)
        .then(function(response) {
            console.log(response.data);
            botList();
        })
        .catch(function(error) {
            console.log(error);
        });
}
