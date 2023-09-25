import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;
const URL = process.env.URL;

const Connection = async (req, res) => {
  const client = new MongoClient(URL);
  client.connect();
  console.log("Monogo Connected successfully.....!");
  return client;
};
const Client = await Connection();
app.get("/", async (req, res) => {
  const data = await Client.db("studentMentor")
    .collection("mentor")
    .find({})
    .toArray();
  const data2 = await Client.db("studentMentor")
    .collection("students")
    .find({})
    .toArray();
  const data3 = await Client.db("studentMentor")
    .collection("studentsWithMentorList")
    .find({})
    .toArray();
  res.send(data, data2, data3);
});
// Q1. API to create Mentor
app.post("/create-mentor", async (req, res) => {
  // In postman body we have to pass object like {"mentorName":"Rakesh A","studentsAssigned":[]}
  const data = req.body;
  await Client.db("studentMentor").collection("mentor").insertOne(data);
  res.send("Mentor creation successful!");
});

// Q2 API to create Students
app.post("/create-student", async (req, res) => {
  // In postman body we have to pass object like {"name":"John Doe","batch":"A","id":123456}}

  const data = req.body;
  await Client.db("studentMentor").collection("students").insertOne(data);
  // students mentor list updating as well
  await Client.db("studentMentor")
    .collection("studentsWithMentorsList")
    .insertOne({
      name: data.name,
      previousMentor: [],
      currentMentor: "",
    });
  res.send("student creation successful!");
});
// Q3.API to assign a student to mentor
app.put("/assign-student/:mentor", async (req, res) => {
  const { name } = req.params;
  const data = req.body;
  await Client.db("studentMentor").collection("mentor").updateOne(
    // In postman body we have to pass object like {"mentorName":"Rakesh A","studentsAssigned":["Rakesh","John Doe","punith","nithin","amith","maala"],"size":6}
    { name: name },
    {
      $set: data,
    }
  );
  //    // deleting students in list  who have been assigned mentor
  for (let i = 0; i < data.size; i++) {
    await Client.db("studentMentor")
      .collection("students")
      .deleteOne({ name: req.body.studentsAssigned[i] });
  }

  res.send("students assigned successfully!");
});

//  Q.4 API to assign or change a mentor for a perticular student.
app.put("/assignoreditmentor/:student", async (req, res) => {
  const { name } = req.params;
  const data = req.body;
  await Client.db("studentMentor")
    .collection("studentsWithMentorsList")
    .updateOne({ name: name }, { $set: data });
  // after assigning deleting student in students list
  for (let i = 0; i < data.size; i++) {
    await Client.db("studentMentor")
      .collection("students")
      .deleteOne({ name: name });
  }
  res.send("data sent success");
});

// api to show all the students for perticular mentor
app.get("/:mentor", async (req, res) => {
  let { name } = req.params;
  let data = await Client.db("studentMentor")
    .collection("mentor")
    .find({ mentorName: name })
    .toArray();
  res.send(data.studentsAssigned);
});

app.listen(PORT, () =>
  console.log(`Server Connected successfully on the Port Number ${PORT}`)
);
