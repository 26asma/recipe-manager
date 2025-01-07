const express = require("express");
require ("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// MongoDB Setup
const uri = process.env.MONGO_uri;

const dbName = "myDatabase";
const collectionName = "recipes";
const client = new MongoClient(uri);

let collection;

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views3"));
// app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const database = client.db(dbName);
    collection = database.collection(collectionName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

// Route to Display Recipes
app.get("/", async (req, res) => {
  try {
    const recipes = await collection.find().toArray();
    res.render("index", { recipes });
  } catch (error) {
    res.send(error)
    console.log(error)
  }
});

// Route to Render the Add Recipe Form
app.get("/add", (req, res) => {
  res.render("add");
});

// Route to Handle Recipe Creation
app.post("/add", async (req, res) => {
  const { name, ingredients, prepTimeInMinutes } = req.body;
  const recipe = {
    name,
    ingredients: ingredients.split(",").map((item) => item.trim()),
    prepTimeInMinutes: parseInt(prepTimeInMinutes, 10),
  };
  try {
    await collection.insertOne(recipe);
    res.redirect("/");
  } catch (error) {
    res.status(500).send("Error adding recipe");
  }
});

// Route to Render the Edit Form
app.get("/edit/:id", async (req, res) => {
  try {
    const recipe = await collection.findOne({ _id: new ObjectId(req.params.id) });
    res.render("edit", { recipe });
  } catch (error) {
    res.status(500).send("Error fetching recipe for editing");
  }
});

// Route to Handle Recipe Update
app.post("/edit/:id", async (req, res) => {
  const { name, ingredients, prepTimeInMinutes } = req.body;
  const updatedRecipe = {
    name,
    ingredients: ingredients.split(",").map((item) => item.trim()),
    prepTimeInMinutes: parseInt(prepTimeInMinutes, 10),
  };
  try {
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedRecipe }
    );
    res.redirect("/");
  } catch (error) {
    res.status(500).send("Error updating recipe");
  }
});

// Route to Handle Recipe Deletion
app.post("/delete/:id", async (req, res) => {
  try {
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect("/");
  } catch (error) {
    res.status(500).send("Error deleting recipe");
  }
});

// Start the server and connect to the database
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await connectToDatabase();
});
