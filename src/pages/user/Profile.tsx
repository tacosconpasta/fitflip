import { useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import {
  IonAlert,
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonLoading,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  cameraOutline,
  logOutOutline,
  person,
  trashOutline,
} from "ionicons/icons";
import {
  Camera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { useAuth } from "../../auth/AuthContext";
import {
  deleteUsuario,
  getUsuarioByCorreo,
  updateUsuarioPerfil,
} from "../../lib/BaseDatos";
import "./Profile.css";

const Profile: React.FC = () => {
  const history = useHistory();
  const { usuario, actualizarSesion, logout } = useAuth();

  const [name, setName] = useState(usuario?.name ?? "");
  const [correo, setCorreo] = useState(usuario?.correo ?? "");
  const [contrasena, setContrasena] = useState(
    usuario?.contrasena ?? "",
  );
  const [image, setImage] = useState<string | null>(
    usuario?.image ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!usuario) {
    return <Redirect to="/login" />;
  }

  const cambiarFoto = async () => {
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

  const guardar = async () => {
    setError(null);
    const nombreLimpio = name.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (!nombreLimpio) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setError("El correo no tiene un formato válido");
      return;
    }
    if (contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const existente = await getUsuarioByCorreo(correoLimpio);
      if (existente && existente.id !== usuario.id) {
        setError("Ya existe una cuenta con ese correo");
        return;
      }

      const actualizado = {
        ...usuario,
        name: nombreLimpio,
        correo: correoLimpio,
        contrasena,
        image,
      };
      await updateUsuarioPerfil(actualizado);
      actualizarSesion(actualizado);
      history.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const eliminarCuenta = async () => {
    await deleteUsuario(usuario.id);
    logout();
    history.replace("/login");
  };

  const cerrarSesion = () => {
    logout();
    history.replace("/login");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Mi perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        <div className="profile-avatar-wrap">
          <button
            type="button"
            className="profile-avatar-button"
            aria-label="Cambiar foto de perfil"
            onClick={cambiarFoto}
          >
            <IonAvatar className="profile-avatar">
              {image ? (
                <img src={image} alt={name || "Foto de perfil"} />
              ) : (
                <IonIcon icon={person} />
              )}
            </IonAvatar>
            <span className="profile-camera-badge">
              <IonIcon icon={cameraOutline} />
            </span>
          </button>

          {image && (
            <IonButton
              fill="clear"
              size="small"
              color="medium"
              onClick={() => setImage(null)}
            >
              Quitar foto
            </IonButton>
          )}
        </div>

        <IonList className="profile-form">
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
        </IonList>

        {error && (
          <IonText color="danger">
            <p className="profile-error">{error}</p>
          </IonText>
        )}

        <IonButton
          className="profile-save"
          expand="block"
          disabled={saving}
          onClick={guardar}
        >
          Guardar cambios
        </IonButton>

        <IonButton
          className="profile-logout"
          expand="block"
          fill="outline"
          onClick={cerrarSesion}
        >
          <IonIcon icon={logOutOutline} slot="start" />
          Cerrar sesión
        </IonButton>

        <div className="profile-delete-wrap">
          <button
            type="button"
            className="profile-delete-link"
            onClick={() => setShowDeleteAlert(true)}
          >
            <IonIcon icon={trashOutline} />
            Borrar cuenta
          </button>
        </div>

        <IonAlert
          isOpen={showDeleteAlert}
          header="¿Borrar cuenta?"
          message="Se eliminarán tu perfil, días y comidas. Esta acción no se puede deshacer."
          buttons={[
            { text: "Cancelar", role: "cancel" },
            {
              text: "Borrar cuenta",
              role: "destructive",
              handler: eliminarCuenta,
            },
          ]}
          onDidDismiss={() => setShowDeleteAlert(false)}
        />

        <IonLoading isOpen={saving} message="Guardando…" />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
