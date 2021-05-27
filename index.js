"use strict";
// モジュール呼び出し
const crypto = require("crypto");
const line = require("@line/bot-sdk");
const stripe = require('stripe')(process.env.STRIPETOKEN)

// インスタンス生成
const client = new line.Client({ channelAccessToken: process.env.ACCESSTOKEN });

exports.handler = async (event) => {
  let responseMessage;
  switch (event.path) {
    case "/checkout":
      responseMessage = "checkout";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Stubborn Attachments",
                images: ["https://i.imgur.com/EHyR2nP.png"],
              },
              unit_amount: 2000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `https://thirsty-leavitt-d1a90d.netlify.app/success.html`,
        cancel_url: `https://thirsty-leavitt-d1a90d.netlify.app/cancel.html`,
      });
      console.log(session)
      break;
    case "/linebot":
      let signature = crypto
        .createHmac("sha256", process.env.CHANNELSECRET)
        .update(event.body)
        .digest("base64");
      let checkHeader = (event.headers || {})["X-Line-Signature"];
      if (!checkHeader) {
        checkHeader = (event.headers || {})["x-line-signature"];
      }
      const body = JSON.parse(event.body);
      const events = body.events;
      console.log(events);
      responseMessage = "linebot!";
      // 署名検証が成功した場合
      if (signature === checkHeader) {
        events.forEach(async (event) => {
          let message;
          switch (event.type) {
            case "message":
              message = await messageFunc(event);
              break;
            case "postback":
              message = await postbackFunc(event);
              break;
            case "follow":
              message = { type: "text", text: "追加ありがとうございます！" };
              break;
          }
          // メッセージを返信
          if (message != undefined) {
            await sendFunc(body.events[0].replyToken, message);
            // .then(console.log)
            // .catch(console.log);
            return;
          }
        });
      }
      // 署名検証に失敗した場合
      else {
        console.log("署名認証エラー");
      }
      break;
  }
  return {
    statusCode: 200,
    body: JSON.stringify(responseMessage),
  };
};

async function sendFunc(replyToken, mes) {
  const result = new Promise(function (resolve, reject) {
    client.replyMessage(replyToken, mes).then((response) => {
      resolve("送信完了");
    });
  });
  return result;
}

async function messageFunc(event) {
  let message = "";
  message = { type: "text", text: `メッセージイベント` };
  return message;
}
const postbackFunc = async function (event) {
  let message = "";
  message = { type: "text", text: "ポストバックイベント" };
  return message;
};
