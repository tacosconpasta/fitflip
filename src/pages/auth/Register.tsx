import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonAvatar,
  IonBackButton,
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
import {
  arrowBackOutline,
  cameraOutline,
  leafOutline,
  person,
} from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { getUsuarioByCorreo, insertUsuario } from "../../lib/BaseDatos";
import { useAuth, homeForRol } from "../../auth/AuthContext";
import "./Auth.css";

const Register: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const seleccionarFoto = async () => {
    try {
      const foto = await Camera.getPhoto({
        quality: 80,
        width: 512,
        height: 512,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });
      if (foto.dataUrl) setImage(foto.dataUrl);
    } catch {
      // El usuario canceló la cámara o el selector de imágenes.
    }
  };

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
        image,
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
      <IonContent className="auth-content">
        <div className="auth-shell">
          <IonBackButton
            className="auth-back"
            defaultHref="/login"
            text=""
            icon={arrowBackOutline}
            aria-label="Volver al inicio de sesión"
          />

          <header className="auth-brand auth-brand--compact">
            <h1>Registrar Cuenta</h1>
            <p className="auth-subtitle">
              Crea tu perfil y comienza a registrar tus comidas!
            </p>
          </header>

          <IonCard className="auth-card">
            <IonCardContent>
              <button
                type="button"
                className="auth-avatar-button"
                onClick={seleccionarFoto}
                aria-label="Añadir foto de perfil"
              >
                <IonAvatar className="auth-avatar">
                  {image ? (
                    <img src={image} alt="Foto de perfil" />
                  ) : (
                    <IonIcon icon={person} />
                  )}
                </IonAvatar>
                <span className="auth-camera-badge">
                  <IonIcon icon={cameraOutline} />
                </span>
              </button>
              <p className="auth-avatar-caption">
                {image ? "Cambiar foto" : "Añadir foto (opcional)"}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
              >
                <IonItem className="auth-field" lines="none">
                  <IonInput
                    label="Nombre"
                    labelPlacement="floating"
                    value={name}
                    onIonInput={(e) => setName(e.detail.value ?? "")}
                  />
                </IonItem>
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
                <IonItem className="auth-field" lines="none">
                  <IonInput
                    label="Confirmar contraseña"
                    labelPlacement="floating"
                    type="password"
                    value={confirmar}
                    onIonInput={(e) => setConfirmar(e.detail.value ?? "")}
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
                  Crear Cuenta
                </IonButton>
              </form>

              <div className="auth-switch">
                <span>¿Ya tienes cuenta?</span>
                <IonButton fill="clear" size="small" routerLink="/login">
                  Iniciar sesión
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonLoading isOpen={submitting} message="Creando cuenta…" />
      </IonContent>
    </IonPage>
  );
};

export default Register;
