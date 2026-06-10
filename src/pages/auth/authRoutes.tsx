import { Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";

// Auth area (owner: login/registration). Base paths: /login, /register.
export const authRoutes = [
  <Route key="login" exact path="/login">
    <Login />
  </Route>,
  <Route key="register" exact path="/register">
    <Register />
  </Route>,
];
