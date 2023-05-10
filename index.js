// const express = require("express"); // "type": "commonjs"
import express, { response } from "express"; // "type": "module"
import { MongoClient } from "mongodb";
const app = express();
import * as dotenv from "dotenv";
dotenv.config();
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";



const PORT = process.env.PORT;

// const MONGO_URL = 'mongodb://127.0.0.1';
const MONGO_URL = process.env.MONGO_URL;           //default ip of mongo
const client = new MongoClient(MONGO_URL);         //dial
//Top level await
await client.connect();
console.log("Mongo is Connected!!!");

// xml json text
// middleware - express.json() - JSON -> JS object
// app.use -> Intercepts -> applies express.json()
app.use(express.json());
app.use(cors());

app.get("/", function (request, response) {
response.send("🙋‍♂️, 🌏 🎊✨🤩");
});


// POST - students details
app.post("/students", async (request, response) => {
    const data = request.body;
    const result = await client.db("capstone").collection("students").insertMany(data);
    response.send(result);
});

// GET - data from Mongodb Atlas
app.get("/students", async (request, response) => {
    const result = await client.db("capstone").collection("students").find ({}).toArray();
    response.send(result);
});

// // GET - students details by id
// app.get("/:id", async (request, response) => {
//     const {id} = request.params; 
//     const students = await client.db("capstone").collection("students").findOne({ _id: id });
//     response.send(students);
// });

// DELETE - students by id
app.delete("/students/:id", async (request, response) => {
    const {id} = request.params;
    const result = await client.db("capstone").collection("students").deleteOne({ _id: ObjectId(id) });
    console.log(result);
    result.deletedCount > 0 ? response.send({message : "student deleted successfully"}) : response.status(404).send({message : "student details not found"});
});


//SIGNUP - STUDENTS
app.post("/students/signup", async function(request, response){
    //const data = request.body;
    const { username, password } = request.body;    

    const UserFromDB = await client.db("capstone").collection("signupdetails").findOne({username: username});
    console.log(UserFromDB);
    
    if (UserFromDB){
        response.status(400).send({message:"Username already exists"});
    } else if (password.length < 8){
        response.status(400).send({message:"Password must be atleast 8 characters"});
    } else {
        const hashedPassword = await generateHashedPassword(password);
        const result = await client.db("capstone").collection("signupdetails").insertOne({
        username: username,
        password: hashedPassword,
        });
        response.send(result);
    }
});

//LOGIN - STUDENTS
app.post("/students/login", async function(request, response){
    //const data = request.body;
    const { username, password } = request.body;    

    const UserFromDB = await client.db("capstone").collection("signupdetails").findOne({username: username});
    console.log(UserFromDB);
    
    if (!UserFromDB){
        response.status(401).send({message:"Invalid Credentials"});
    } else {
        const storedDBPassword = UserFromDB.password;
        const isPasswordCheck = await bcrypt.compare(password, storedDBPassword);
        console.log(isPasswordCheck);

        if(isPasswordCheck){
            const token = jwt.sign({ id: UserFromDB._id}, process.env.SECRET_KEY);
            response.send({ message: "Successful login", token: token });
        } else {
            response.status(401).send({ message: "Invalid Credentials"})
        }
    }
});


app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));

async function generateHashedPassword(password) {
    const NO_OF_ROUNDS = 10;
    const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(salt);
    console.log(hashedPassword);
    return hashedPassword;
}


