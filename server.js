import express from "express";
import bodyParser from "body-parser";
import "dotenv/config"; // dotenv.config() => to read file from file .env
import { GoogleGenAI } from "@google/genai";
import admin from 'firebase-admin';

const app = express();
const port = 3000;
const API_KEY = process.env.API_KEY; // process is a global object that save information about process that is running
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const serviceAccount = 'credentials/serviceAccount.json'; // Get refresh token from OAuth2 flow

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function generate(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `${prompt}`,
  });

  const text = await response.text();
  return text;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/generate", async (req, res) => {
  const content = req.body.input;
  
  const response = await generate(content);

  const data =  db.collection("users").doc("materials");

  data.set({
    title: content
  });

  // res.json({message: "in generate now", content: response.text});
  res.render("generate.ejs", {content: response.text});
});

app.post("/generate/create", async (req, res) => {
  const content = req.body.content;
  const prompt = content  + "\n Buatkan beberapa flashcard dari materi berikut. Setiap flashcard punya pertanyaan (question), jawaban (answer), dan penjelasan (explanation). Formatkan dalam bentuk clean JSON array tanpa markdown dan tanpa formatting";
  const response = await generate(prompt);
  
  let raw = response;
  raw = raw.replace(/```json|```/g, '').trim();
  const flashcard = JSON.parse(raw);
  // res.json({output: file});
  // const flashcard = JSON.stringify(response.text);

  const data = db.collection("users").doc("materials");

  data.set({
    materials: req.body.content,
    flashcard: {flashcard}
  });

  // why we need to use await
  const isi = await db.collection("users").doc("materials").get(); 
  // const data = isi.docs.map(doc => doc.data());
  const card = isi.data().flashcard.flashcard;
  console.log(card[0]);
  res.render("flashcard.ejs", {flashcard: card})
});

app.post("/generate/finish", async (req, res) => {
  const value = req.body.flashcardValue;

  const docRef = db.collection("users").doc("materials"); 
  const get = await docRef.get();
  const card = get.data().flashcard.flashcard;

  value.forEach((element, index) => {
    card[index].status = element;
  });

  await docRef.set({
    flashcard: {
      flashcard: card
    }
  });

  res.json({message: "update success"});
});

app.listen(port, () => {
    console.log(`You are connected in port ${port}`);
});