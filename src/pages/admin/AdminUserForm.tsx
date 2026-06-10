import React, { useEffect, useState } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonLoading,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { Guard } from "../../auth/Guard";
import {
  getUsuarioById,
  getUsuarioByCorreo,
  insertUsuario,
  updateUsuario,
} from "../../lib/BaseDatos";
import type { Usuario } from "../../models/Usuario";
import "./AdminUserForm.css";

// Formulario compartido para crear y editar un usuario con rol "user".
// - Si la ruta incluye un :id, se carga el usuario existente (modo edición).
// - Si no hay :id, se asume modo creación.
// Siempre protegido con <Guard rol="admin">.

interface Params {
  id?: string;
}

const AdminUserForm: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();
  const isEditing = id != null;

  const [name, setName] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(isEditing);

  // En modo edición, carga los datos del usuario al montar.
  useEffect(() => {
    if (!isEditing) return;
    const cargar = async () => {
      const usuario = await getUsuarioById(Number(id));
      if (usuario) {
        setName(usuario.name);
        setCorreo(usuario.correo);
        // No se pre-llena la contraseña por seguridad; solo se actualiza si se
        // escribe una nueva.
      }
      setLoadingUser(false);
    };
    cargar();
  }, [id, isEditing]);

  // Validación del formulario (mismas reglas que Register).
  const validar = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
    if (!correo.trim()) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      return "El correo no tiene un formato válido";
    }
    // En creación, la contraseña es obligatoria.
    if (!isEditing) {
      if (contrasena.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres";
      }
      if (contrasena !== confirmar) {
        return "Las contraseñas no coinciden";
      }
    }
    // En edición, si se llena la contraseña debe cumplir las reglas.
    if (isEditing && contrasena) {
      if (contrasena.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres";
      }
      if (contrasena !== confirmar) {
        return "Las contraseñas no coinciden";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setSubmitting(true);
    try {
      const correoNorm = correo.trim().toLowerCase();

      if (isEditing) {
        // Modo edición: actualiza el usuario existente.
        const current = await getUsuarioById(Number(id));
        if (!current) {
          setError("Usuario no encontrado");
          return;
        }

        // Si cambió el correo, verificar que no exista otro usuario con ese correo.
        if (correoNorm !== current.correo) {
          const existente = await getUsuarioByCorreo(correoNorm);
          if (existente) {
            setError("Ya existe una cuenta con ese correo");
            return;
          }
        }

        const updated: Usuario = {
          ...current,
          name: name.trim(),
          correo: correoNorm,
          // Solo actualiza la contraseña si se llenó el campo.
          contrasena: contrasena || current.contrasena,
        };
        await updateUsuario(updated);
      } else {
        // Modo creación: verificar correo único e insertar.
        const existente = await getUsuarioByCorreo(correoNorm);
        if (existente) {
          setError("Ya existe una cuenta con ese correo");
          return;
        }

        await insertUsuario({
          correo: correoNorm,
          contrasena,
          name: name.trim(),
          image: null,
          rol: "user",
        });
      }

      history.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Guard rol="admin">
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/admin" />
            </IonButtons>
            <IonTitle>
              {isEditing ? "Editar usuario" : "Nuevo usuario"}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {loadingUser ? (
            <IonLoading isOpen message="Cargando usuario…" />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <IonList>
                <IonItem>
                  <IonInput
                    label="Nombre"
                    labelPlacement="floating"
                    value={name}
                    onIonInput={(e) => setName(e.detail.value ?? "")}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Correo"
                    labelPlacement="floating"
                    type="email"
                    autocomplete="email"
                    value={correo}
                    onIonInput={(e) => setCorreo(e.detail.value ?? "")}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label={
                      isEditing
                        ? "Nueva contraseña (dejar vacío para no cambiar)"
                        : "Contraseña"
                    }
                    labelPlacement="floating"
                    type="password"
                    value={contrasena}
                    onIonInput={(e) => setContrasena(e.detail.value ?? "")}
                  />
                </IonItem>
                {/* Mostrar confirmación solo si se está llenando la contraseña. */}
                {(!isEditing || contrasena) && (
                  <IonItem>
                    <IonInput
                      label="Confirmar contraseña"
                      labelPlacement="floating"
                      type="password"
                      value={confirmar}
                      onIonInput={(e) => setConfirmar(e.detail.value ?? "")}
                    />
                  </IonItem>
                )}
              </IonList>

              {error && (
                <IonText color="danger">
                  <p className="ion-padding-start">{error}</p>
                </IonText>
              )}

              <div className="admin-form-buttons">
                <IonButton
                  expand="block"
                  type="submit"
                  disabled={submitting}
                >
                  {isEditing ? "Guardar cambios" : "Crear usuario"}
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => history.goBack()}
                  disabled={submitting}
                >
                  Cancelar
                </IonButton>
              </div>
            </form>
          )}

          <IonLoading isOpen={submitting} message="Guardando…" />
        </IonContent>
      </IonPage>
    </Guard>
  );
};

export default AdminUserForm;
