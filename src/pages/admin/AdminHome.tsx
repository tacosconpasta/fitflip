import React, { useEffect, useState, useCallback } from "react";
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonToast,
} from "@ionic/react";
import { add, peopleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Guard } from "../../auth/Guard";
import { useAuth } from "../../auth/AuthContext";
import { getNonAdminUsuarios, deleteUsuario } from "../../lib/BaseDatos";
import type { Usuario } from "../../models/Usuario";
import UserCard from "../../components/UserCard";
import "./AdminHome.css";

// Pantalla principal del panel de administración. Lista todos los usuarios con
// rol "user", permite buscar por nombre/correo, y ofrece acciones de crear,
// editar y eliminar usuarios. Protegida con <Guard rol="admin">.
const AdminHome: React.FC = () => {
  const { logout } = useAuth();
  const history = useHistory();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  // Carga la lista de usuarios no-admin desde la base de datos.
  const cargar = useCallback(async () => {
    setLoading(true);
    const lista = await getNonAdminUsuarios();
    setUsuarios(lista);
    setLoading(false);
  }, []);

  // Carga al montar.
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Recarga al volver de las pantallas de crear/editar.
  useEffect(() => {
    return history.listen(() => cargar());
  }, [history, cargar]);

  // Filtra la lista por nombre o correo (case-insensitive).
  const filtrados = usuarios.filter((u) => {
    const q = filtro.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
  });

  // Confirma y ejecuta la eliminación del usuario seleccionado.
  const confirmarEliminar = async () => {
    if (usuarioAEliminar) {
      await deleteUsuario(usuarioAEliminar.id);
      setUsuarioAEliminar(null);
      setToast(`"${usuarioAEliminar.name}" eliminado`);
      await cargar();
    }
  };

  return (
    <Guard rol="admin">
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Gestión de usuarios</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={logout}>Salir</IonButton>
            </IonButtons>
          </IonToolbar>
          {/* Barra de búsqueda debajo del toolbar. */}
          <IonToolbar>
            <IonSearchbar
              placeholder="Buscar por nombre o correo…"
              debounce={250}
              value={filtro}
              onIonInput={(e) => setFiltro(e.detail.value ?? "")}
            />
          </IonToolbar>
        </IonHeader>

        <IonContent scrollY={false}>
          <div className="admin-layout">
            {loading ? (
              <div className="admin-loading">
                <IonSpinner />
              </div>
            ) : (
              <>
                {/* Encabezado con conteo. */}
                <p className="admin-section-header">
                  {filtrados.length}{" "}
                  {filtrados.length === 1 ? "usuario" : "usuarios"}
                </p>

                {filtrados.length === 0 ? (
                  <div className="admin-empty">
                    <IonIcon icon={peopleOutline} />
                    <p>No hay usuarios registrados.</p>
                    <p>Toca + para crear uno.</p>
                  </div>
                ) : (
                  <div className="admin-list-wrap">
                    <IonList className="admin-list">
                      {filtrados.map((u) => (
                        <UserCard
                          key={u.id}
                          usuario={u}
                          onEdit={(id) =>
                            history.push(`/admin/usuarios/${id}/editar`)
                          }
                          onDelete={() => setUsuarioAEliminar(u)}
                        />
                      ))}
                    </IonList>
                    <div className="admin-fade" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* FAB para crear un nuevo usuario. */}
          <IonFab
            vertical="bottom"
            horizontal="end"
            slot="fixed"
            className="admin-fab-wrap"
          >
            <IonFabButton
              className="admin-fab"
              onClick={() => history.push("/admin/usuarios/nuevo")}
            >
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          {/* Confirmación de eliminación. */}
          <IonAlert
            isOpen={usuarioAEliminar != null}
            header="¿Eliminar usuario?"
            message={`Se eliminará a "${usuarioAEliminar?.name}" y todos sus datos. Esta acción no se puede deshacer.`}
            buttons={[
              {
                text: "Cancelar",
                role: "cancel",
                handler: () => setUsuarioAEliminar(null),
              },
              {
                text: "Eliminar",
                role: "destructive",
                handler: confirmarEliminar,
              },
            ]}
            onDidDismiss={() => setUsuarioAEliminar(null)}
          />

          {/* Toast de feedback. */}
          <IonToast
            isOpen={toast != null}
            message={toast ?? ""}
            duration={2000}
            onDidDismiss={() => setToast(null)}
          />
        </IonContent>
      </IonPage>
    </Guard>
  );
};

export default AdminHome;
