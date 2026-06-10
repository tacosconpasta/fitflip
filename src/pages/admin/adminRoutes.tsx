import { Route } from "react-router-dom";
import AdminHome from "./AdminHome";

// Admin area (owner: Coworker B). All paths live under /admin so they never
// collide with the user area. Add CRUD-de-usuarios routes here, e.g.:
//   <Route key="admin-usuarios" exact path="/admin/usuarios"><Usuarios /></Route>
// Keep every page wrapped in <Guard rol="admin"> so they stay protected.
export const adminRoutes = [
  <Route key="admin-home" exact path="/admin">
    <AdminHome />
  </Route>,
];
