import { Route } from "react-router-dom";
import Home from "./Home";
import AddFood from "./addFood";
import FoodDetail from "./FoodDetail";

// User area (owner: Coworker A). Landing base path: /home.
// Add VerDia / CRUD de Comidas routes here, e.g.:
//   <Route key="ver-dia" exact path="/dia/:id"><VerDia /></Route>
// Keep every page wrapped in <Guard rol="user"> so they stay protected.
export const userRoutes = [
  <Route key="home" exact path="/home">
    <Home />
  </Route>,
  <Route key="add-food" exact path="/dia/:diaId/comida">
    <AddFood />
  </Route>,
  <Route key="food-detail" exact path="/food-detail/:id">
    <FoodDetail />
  </Route>
];
