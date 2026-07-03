import express, { Request, Response } from 'express';
import routes from './routes/questionRoutes'
import path from "path";
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/audio", express.static(path.join(__dirname, "audio")));
app.use("/api", routes);

// Start server
app.listen(3003, () => {
  console.log('🚀 Server ready at http://localhost:3003');
});