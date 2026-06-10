import { Route } from "react-router-dom";
import AdminHome from "./AdminHome";
import AdminUserForm from "./AdminUserForm";

// Admin area. All paths live under /admin so they never collide with the user
// area. Every page is wrapped in <Guard rol="admin"> internally.
export const adminRoutes = [
  <Route key="admin-home" exact path="/admin">
    <AdminHome />
  </Route>,
  <Route key="admin-user-new" exact path="/admin/usuarios/nuevo">
    <AdminUserForm />
  </Route>,
  <Route key="admin-user-edit" exact path="/admin/usuarios/:id/editar">
    <AdminUserForm />
  </Route>,
];
