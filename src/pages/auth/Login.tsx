import { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import {
  IonButton,
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
import { useAuth, homeForRol } from "../../auth/AuthContext";

const Login: React.FC = () => {
  const history = useHistory();
  const { usuario, login } = useAuth();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validar = (): string | null => {
    if (!correo.trim() || !contrasena) {
      return "Completa el correo y la contraseña";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      return "El correo no tiene un formato válido";
    }
    return null;
  };

  const handleLogin = async () => {
    setError(null);
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setSubmitting(true);
    try {
      const usuario = await login(correo, contrasena);
      history.replace(homeForRol(usuario.rol));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // Already authenticated (e.g. persisted session) → skip the form.
  if (usuario) {
    return <Redirect to={homeForRol(usuario.rol)} />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <IonList>
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
            Entrar
          </IonButton>
          <IonButton
            expand="block"
            fill="clear"
            routerLink="/register"
          >
            Crear una cuenta
          </IonButton>
        </form>

        <IonLoading isOpen={submitting} message="Verificando…" />
      </IonContent>
    </IonPage>
  );
};

export default Login;
