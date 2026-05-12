import { sequelize } from "./config/database";
import app from "./app";

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Unable to connect to database:", err);
  });

  
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});