import { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLoading,
  IonPage,
  IonText,
} from "@ionic/react";
import { leafOutline, logInOutline } from "ionicons/icons";
import { useAuth, homeForRol } from "../../auth/AuthContext";
import "./Auth.css";

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
      <IonContent className="auth-content">
        <div className="auth-shell auth-shell--login">
          <header className="auth-brand">
            <div className="auth-logo" aria-hidden="true">
              <IonIcon icon={leafOutline} />
            </div>
            <h1>FitFlip</h1>
            <p className="auth-subtitle">
              Contador de calorías para un estilo de vida saludable.
            </p>
          </header>

          <IonCard className="auth-card">
            <IonCardContent>
              <div className="auth-card-heading">
                <h2>Bienvenido de nuevo</h2>
                <p>Inicia sesión para continuar.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                <IonItem className="auth-field" lines="none">
                  <IonInput
                    label="Correo"
                    labelPlacement="floating"
                    type="email"
                    autocomplete="email"
                    value={correo}
                    onIonInput={(e) => setCorreo(e.detail.value ?? "")}
                  />
                </IonItem>
                <IonItem className="auth-field" lines="none">
                  <IonInput
                    label="Contraseña"
                    labelPlacement="floating"
                    type="password"
                    value={contrasena}
                    onIonInput={(e) => setContrasena(e.detail.value ?? "")}
                  />
                </IonItem>

                {error && (
                  <IonText color="danger">
                    <p className="auth-error">{error}</p>
                  </IonText>
                )}

                <IonButton
                  className="auth-primary-button"
                  expand="block"
                  type="submit"
                  disabled={submitting}
                >
                  Iniciar sesión
                </IonButton>
              </form>

              <div className="auth-switch">
                <span>¿Aún no tienes cuenta?</span>
                <IonButton fill="clear" size="small" routerLink="/register">
                  Crear cuenta
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading isOpen={submitting} message="Verificando…" />
      </IonContent>
    </IonPage>
  );
};

export default Login;
