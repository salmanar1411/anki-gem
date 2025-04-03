import express from "express";
import bodyParser from "body-parser";
import "dotenv/config"; // dotenv.config() => to read file from file .env
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = 3000;
const API_KEY = process.env.API_KEY; // process is a global object that save information about process that is running
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function main(prompt) {
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
   
    const response = await main(content);

    // res.json({message: "in generate now", content: response.text});
    res.render("generate.ejs", {content: response.text});
});

app.listen(port, () => {
    console.log(`You are connected in port ${port}`);
});