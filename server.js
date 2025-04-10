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

// to read data
// const isi = await db.collection('users').doc('aturing').get();
// console.log(isi.data()); => .data() read only the data not additional data

// write data
// const aTuringRef = db.collection('users').doc('aturing');

// await aTuringRef.set({
// 'first': 'Alan',
// 'middle': 'Mathison',
// 'last': 'Turing',
// 'born': 1912
// });

async function generate(prompt) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${prompt}`,
    });
    return response;
}

app.use(bodyParser.urlencoded({extended: true}));

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
    const prompt = content  + "\n Buatkan beberapa flashcard dari materi berikut. Setiap flashcard punya nomor soal (id), pertanyaan (question), jawaban (answer), dan penjelasan (explanation). Formatkan dalam bentuk clean JSON array tanpa markdown dan tanpa formatting";
    const response = await generate(prompt);
    const id = 0;
    
    let raw = response.text
    raw = raw.replace(/```json|```/g, '');
    raw = raw.trim();
    const flashcard = JSON.parse(raw);
    // res.json({output: file});
    // const flashcard = JSON.stringify(response.text);

    const data =  db.collection("users").doc("materials");

    data.set({
      materials: req.body.content,
      flashcard: {flashcard}
    });
});

app.listen(port, () => {
    console.log(`You are connected in port ${port}`);
});