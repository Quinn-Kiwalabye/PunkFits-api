const express = require('express');
const app = express();

app.get('/',(req,res) => {
    res.send("Welcome to the app")
});

app.listen(4000, () => {
    console.log("listening to port 400")
});