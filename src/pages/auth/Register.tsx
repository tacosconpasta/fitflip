import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonButtons,
  IonBackButton,
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
import { getUsuarioByCorreo, insertUsuario } from "../../lib/BaseDatos";
import { useAuth, homeForRol } from "../../auth/AuthContext";

const Register: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validar = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
    if (!correo.trim()) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      return "El correo no tiene un formato válido";
    }
    if (contrasena.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    if (contrasena !== confirmar) {
      return "Las contraseñas no coinciden";
    }
    return null;
  };

  const handleRegister = async () => {
    setError(null);
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setSubmitting(true);
    try {
      const correoNorm = correo.trim().toLowerCase();
      const existente = await getUsuarioByCorreo(correoNorm);
      if (existente) {
        setError("Ya existe una cuenta con ese correo");
        return;
      }

      // Self-registration always creates a user (rol "user"). Admins are
      // created from the admin panel (Coworker B) or seeded.
      await insertUsuario({
        correo: correoNorm,
        contrasena,
        name: name.trim(),
        image: null,
        rol: "user",
      });

      const usuario = await login(correoNorm, contrasena);
      history.replace(homeForRol(usuario.rol));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Crear cuenta</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
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
                label="Contraseña"
                labelPlacement="floating"
                type="password"
                value={contrasena}
                onIonInput={(e) => setContrasena(e.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Confirmar contraseña"
                labelPlacement="floating"
                type="password"
                value={confirmar}
                onIonInput={(e) => setConfirmar(e.detail.value ?? "")}
              />
            </IonItem>
          </IonList>

          {error && (
            <IonText color="danger">
              <p className="ion-padding-start">{error}</p>
            </IonText>
          )}

          <IonButton
            className="ion-margin-top"
            expand="block"
            type="submit"
            disabled={submitting}
          >
            Registrarme
          </IonButton>
        </form>

        <IonLoading isOpen={submitting} message="Creando cuenta…" />
      </IonContent>
    </IonPage>
  );
};

export default Register;
