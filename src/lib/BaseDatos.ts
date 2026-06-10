import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import type { NewUsuario, Usuario } from "../models/Usuario";
import type { NewDia, Dia, DiaConComidas } from "../models/Dia";
import type {
  NewComida,
  Comida,
  ComidaFrecuente,
  ComidaDelDia,
  TipoComida,
} from "../models/Comida";

const DB_NAME = "fitflip";

const CREATE_TABLES = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS usuario (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    correo      TEXT    NOT NULL UNIQUE,
    contrasena  TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    image       TEXT,
    rol         TEXT    NOT NULL DEFAULT 'user' CHECK (rol IN ('user', 'admin'))
  );

  CREATE TABLE IF NOT EXISTS dia (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha               TEXT    NOT NULL,
    descripcion         TEXT    NOT NULL DEFAULT '',
    calorias_meta       REAL    NOT NULL DEFAULT 0,
    calorias_obtenidas  REAL    NOT NULL DEFAULT 0,
    user_id             INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comida (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
    descripcion  TEXT    NOT NULL DEFAULT '',
    calorias     REAL    NOT NULL DEFAULT 0 CHECK (calorias >= 0),
    tipo         TEXT    NOT NULL DEFAULT 'Almuerzo' CHECK (tipo IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack')),
    image        TEXT,
    user_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_comida_usuario_nombre
    ON comida (user_id, nombre COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS dia_comida (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_id     INTEGER NOT NULL REFERENCES dia(id) ON DELETE CASCADE,
    comida_id  INTEGER NOT NULL REFERENCES comida(id) ON DELETE CASCADE,
    cantidad   REAL    NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    UNIQUE (dia_id, comida_id)
  );
`;

const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbPromise: Promise<SQLiteDBConnection> | null = null;

async function openDb(): Promise<SQLiteDBConnection> {
  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  let conn: SQLiteDBConnection;
  if (consistency.result && isConn) {
    conn = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    conn = await sqlite.createConnection(
      DB_NAME,
      false,
      "no-encryption",
      1,
      false
    );
  }

  await conn.open();
  // La migracion corre antes de CREATE_TABLES por si hay que reiniciar el
  // esquema viejo (CREATE_TABLES asume ya la estructura nueva).
  await migrate(conn);
  await conn.execute(CREATE_TABLES);
  return conn;
}

// El esquema cambio de 1:N (comida con dia_id) a N:M (comida en un catalogo y
// dia_comida como tabla intermedia con la cantidad de porciones). Como es una
// reestructura grande, en desarrollo se detecta el esquema viejo y se reinicia
// la base; CREATE_TABLES y seedExampleData la vuelven a poblar.
async function migrate(conn: SQLiteDBConnection): Promise<void> {
  const info = await conn.query("PRAGMA table_info(comida)");
  const columnas = (info.values ?? []).map((c: { name: string }) => c.name);

  if (columnas.includes("dia_id")) {
    await conn.execute(`
      DROP TABLE IF EXISTS dia_comida;
      DROP TABLE IF EXISTS comida;
      DROP TABLE IF EXISTS dia;
      DROP TABLE IF EXISTS usuario;
    `);
  } else if (columnas.length > 0 && !columnas.includes("tipo")) {
    // Base ya en N:M pero anterior al campo tipo: se agrega la columna.
    await conn.execute(
      "ALTER TABLE comida ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Almuerzo' CHECK (tipo IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack'))"
    );
  }
}

function getDb(): Promise<SQLiteDBConnection> {
  if (!dbPromise) {
    dbPromise = openDb();
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

// Usuario queries

export async function insertUsuario(usuario: NewUsuario): Promise<number> {
  const conn = await getDb();
  const result = await conn.run(
    "INSERT INTO usuario (correo, contrasena, name, image, rol) VALUES (?, ?, ?, ?, ?)",
    [
      usuario.correo,
      usuario.contrasena,
      usuario.name,
      usuario.image ?? null,
      usuario.rol,
    ]
  );
  return result.changes?.lastId ?? -1;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM usuario");
  return (result.values ?? []) as Usuario[];
}

export async function getUsuarioById(id: number): Promise<Usuario | null> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM usuario WHERE id = ?", [id]);
  return ((result.values ?? [])[0] as Usuario) ?? null;
}

export async function getUsuarioByCorreo(
  correo: string
): Promise<Usuario | null> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM usuario WHERE correo = ?", [
    correo,
  ]);
  return ((result.values ?? [])[0] as Usuario) ?? null;
}

// Dia queries

export async function insertDia(dia: NewDia): Promise<number> {
  const conn = await getDb();
  const result = await conn.run(
    "INSERT INTO dia (fecha, descripcion, calorias_meta, calorias_obtenidas, user_id) VALUES (?, ?, ?, ?, ?)",
    [
      dia.fecha,
      dia.descripcion,
      dia.calorias_meta,
      dia.calorias_obtenidas,
      dia.user_id,
    ]
  );
  return result.changes?.lastId ?? -1;
}

export async function getDias(userId: number): Promise<Dia[]> {
  const conn = await getDb();
  const result = await conn.query(
    "SELECT * FROM dia WHERE user_id = ? ORDER BY fecha DESC",
    [userId]
  );
  return (result.values ?? []) as Dia[];
}

export async function getDiaById(diaId: number): Promise<Dia | null> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM dia WHERE id = ?", [diaId]);
  return ((result.values ?? [])[0] as Dia) ?? null;
}

export async function updateDia(dia: Dia): Promise<void> {
  const conn = await getDb();
  await conn.run(
    "UPDATE dia SET fecha = ?, descripcion = ?, calorias_meta = ?, calorias_obtenidas = ? WHERE id = ?",
    [
      dia.fecha,
      dia.descripcion,
      dia.calorias_meta,
      dia.calorias_obtenidas,
      dia.id,
    ]
  );
}

export async function deleteDia(diaId: number): Promise<void> {
  const conn = await getDb();
  await conn.run("DELETE FROM dia WHERE id = ?", [diaId]);
}

// SELECT de las comidas de un dia uniendo el enlace dia_comida con el catalogo.
const COMIDA_DEL_DIA_SELECT = `
  SELECT dc.id        AS registro_id,
         c.id         AS comida_id,
         c.nombre     AS nombre,
         c.descripcion AS descripcion,
         c.calorias   AS calorias,
         c.tipo       AS tipo,
         c.image      AS image,
         dc.cantidad  AS cantidad
  FROM dia_comida dc
  JOIN comida c ON c.id = dc.comida_id
`;

export async function getDiaConComidas(
  diaId: number
): Promise<DiaConComidas | null> {
  const conn = await getDb();

  const diaResult = await conn.query("SELECT * FROM dia WHERE id = ?", [diaId]);
  const dia = ((diaResult.values ?? [])[0] as Dia) ?? null;
  if (!dia) return null;

  const comidaResult = await conn.query(
    `${COMIDA_DEL_DIA_SELECT} WHERE dc.dia_id = ? ORDER BY dc.id`,
    [diaId]
  );
  const comidas = (comidaResult.values ?? []) as ComidaDelDia[];

  return { ...dia, comidas };
}

// Devuelve un registro concreto (una comida dentro de un dia) por su id de
// dia_comida. Lo usa la vista de detalle/edicion.
export async function getComidaDelDia(
  registroId: number
): Promise<ComidaDelDia | null> {
  const conn = await getDb();
  const result = await conn.query(
    `${COMIDA_DEL_DIA_SELECT} WHERE dc.id = ?`,
    [registroId]
  );
  return ((result.values ?? [])[0] as ComidaDelDia) ?? null;
}

// Comida (catalogo) queries

function validarDatosComida(nombre: string, calorias: number): void {
  if (!nombre.trim()) {
    throw new Error("El nombre es obligatorio");
  }
  if (!Number.isFinite(calorias) || calorias < 0) {
    throw new Error("Las calorías no pueden ser negativas");
  }
}

// Inserta una comida nueva en el catalogo del usuario. Devuelve su id.
export async function insertComida(comida: NewComida): Promise<number> {
  validarDatosComida(comida.nombre, comida.calorias);
  const conn = await getDb();
  const result = await conn.run(
    "INSERT INTO comida (nombre, descripcion, calorias, tipo, image, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [
      comida.nombre,
      comida.descripcion,
      comida.calorias,
      comida.tipo,
      comida.image ?? null,
      comida.user_id,
    ]
  );
  return result.changes?.lastId ?? -1;
}

export async function getComidaById(comidaId: number): Promise<Comida | null> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM comida WHERE id = ?", [
    comidaId,
  ]);
  return ((result.values ?? [])[0] as Comida) ?? null;
}

// Actualiza una comida del catalogo. Como las calorias son compartidas, se
// recalculan todos los dias que usan esta comida.
export async function updateComida(comida: {
  id: number;
  nombre: string;
  descripcion: string;
  calorias: number;
  tipo: TipoComida;
  image: string | null;
}): Promise<void> {
  validarDatosComida(comida.nombre, comida.calorias);
  const conn = await getDb();
  await conn.run(
    "UPDATE comida SET nombre = ?, descripcion = ?, calorias = ?, tipo = ?, image = ? WHERE id = ?",
    [
      comida.nombre,
      comida.descripcion,
      comida.calorias,
      comida.tipo,
      comida.image ?? null,
      comida.id,
    ]
  );

  const dias = await conn.query(
    "SELECT DISTINCT dia_id FROM dia_comida WHERE comida_id = ?",
    [comida.id]
  );
  for (const fila of (dias.values ?? []) as { dia_id: number }[]) {
    await recalcCaloriasObtenidas(fila.dia_id);
  }
}

// Elimina una comida del catalogo. ON DELETE CASCADE quita sus enlaces de
// todos los dias; despues se recalculan los totales de esos dias.
export async function deleteComidaDelCatalogo(
  comidaId: number
): Promise<void> {
  const conn = await getDb();
  const dias = await conn.query(
    "SELECT DISTINCT dia_id FROM dia_comida WHERE comida_id = ?",
    [comidaId]
  );
  const diasAfectados = (dias.values ?? []) as { dia_id: number }[];

  await conn.run("DELETE FROM comida WHERE id = ?", [comidaId]);

  for (const fila of diasAfectados) {
    await recalcCaloriasObtenidas(fila.dia_id);
  }
}

// Indica si el usuario ya tiene una comida con ese nombre en su catalogo (sin
// importar mayusculas/minusculas). Sirve para no repetir una comida.
export async function comidaExisteEnCatalogo(
  userId: number,
  nombre: string
): Promise<boolean> {
  const conn = await getDb();
  const result = await conn.query(
    "SELECT 1 FROM comida WHERE user_id = ? AND nombre = ? COLLATE NOCASE LIMIT 1",
    [userId, nombre]
  );
  return (result.values ?? []).length > 0;
}

// Devuelve el catalogo del usuario ordenado de la comida mas usada a la menos
// (veces = suma de porciones registradas en todos los dias).
export async function getComidasFrecuentes(
  userId: number
): Promise<ComidaFrecuente[]> {
  const conn = await getDb();
  const result = await conn.query(
    `SELECT c.id          AS id,
            c.nombre      AS nombre,
            c.descripcion AS descripcion,
            c.calorias    AS calorias,
            c.tipo        AS tipo,
            c.image       AS image,
            COALESCE(SUM(dc.cantidad), 0) AS veces
     FROM comida c
     LEFT JOIN dia_comida dc ON dc.comida_id = c.id
     WHERE c.user_id = ?
     GROUP BY c.id
     ORDER BY veces DESC, c.nombre COLLATE NOCASE ASC`,
    [userId]
  );
  return (result.values ?? []) as ComidaFrecuente[];
}

// dia_comida (enlace) queries

// Agrega una comida del catalogo a un dia. Si ya estaba en el dia, suma una
// porcion; si no, crea el enlace con 1 porcion. Recalcula las calorias del dia.
export async function agregarComidaADia(
  diaId: number,
  comidaId: number
): Promise<void> {
  const conn = await getDb();
  const existente = await conn.query(
    "SELECT id FROM dia_comida WHERE dia_id = ? AND comida_id = ? LIMIT 1",
    [diaId, comidaId]
  );
  const fila = (existente.values ?? [])[0];

  if (fila) {
    await conn.run(
      "UPDATE dia_comida SET cantidad = cantidad + 1 WHERE id = ?",
      [fila.id]
    );
  } else {
    await conn.run(
      "INSERT INTO dia_comida (dia_id, comida_id, cantidad) VALUES (?, ?, 1)",
      [diaId, comidaId]
    );
  }
  await recalcCaloriasObtenidas(diaId);
}

// Cambia la cantidad de porciones de una comida en un dia (puede ser fraccional)
// y recalcula las calorias del dia.
export async function actualizarPorciones(
  registroId: number,
  cantidad: number
): Promise<void> {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error("Las porciones deben ser mayores a 0");
  }
  const conn = await getDb();
  const reg = await conn.query(
    "SELECT dia_id FROM dia_comida WHERE id = ?",
    [registroId]
  );
  const fila = (reg.values ?? [])[0] as { dia_id: number } | undefined;
  await conn.run("UPDATE dia_comida SET cantidad = ? WHERE id = ?", [
    cantidad,
    registroId,
  ]);
  if (fila) await recalcCaloriasObtenidas(fila.dia_id);
}

// Quita una comida de un dia (borra el enlace, no la comida del catalogo) y
// recalcula las calorias del dia.
export async function quitarComidaDeDia(registroId: number): Promise<void> {
  const conn = await getDb();
  const reg = await conn.query(
    "SELECT dia_id FROM dia_comida WHERE id = ?",
    [registroId]
  );
  const fila = (reg.values ?? [])[0] as { dia_id: number } | undefined;
  await conn.run("DELETE FROM dia_comida WHERE id = ?", [registroId]);
  if (fila) await recalcCaloriasObtenidas(fila.dia_id);
}

// Mantiene dia.calorias_obtenidas en sync con la suma de (calorias * porciones)
// de las comidas del dia, para que las vistas lean el total sin recalcular.
async function recalcCaloriasObtenidas(diaId: number): Promise<void> {
  const conn = await getDb();
  const result = await conn.query(
    `SELECT COALESCE(SUM(c.calorias * dc.cantidad), 0) AS total
     FROM dia_comida dc
     JOIN comida c ON c.id = dc.comida_id
     WHERE dc.dia_id = ?`,
    [diaId]
  );
  const total = ((result.values ?? [])[0]?.total as number) ?? 0;
  await conn.run("UPDATE dia SET calorias_obtenidas = ? WHERE id = ?", [
    total,
    diaId,
  ]);
}

export async function seedExampleData(): Promise<void> {
  const conn = await getDb();

  const existing = await conn.query("SELECT id FROM usuario LIMIT 1");
  if ((existing.values ?? []).length > 0) return;

  const userId = await insertUsuario({
    correo: "demo@fitflip.com",
    contrasena: "demo1234",
    name: "Usuario Demo",
    image: null,
    rol: "user",
  });

  await insertUsuario({
    correo: "admin@fitflip.com",
    contrasena: "admin1234",
    name: "Administrador",
    image: null,
    rol: "admin",
  });

  const hoy = new Date();
  const fecha = (offset: number): string => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  const diaHoy = await insertDia({
    fecha: fecha(0),
    descripcion: "Día de mantenimiento",
    calorias_meta: 2000,
    calorias_obtenidas: 0,
    user_id: userId,
  });

  const diaAyer = await insertDia({
    fecha: fecha(1),
    descripcion: "Día de entrenamiento",
    calorias_meta: 2500,
    calorias_obtenidas: 0,
    user_id: userId,
  });

  // Catalogo de comidas del usuario.
  const catalogo: {
    nombre: string;
    descripcion: string;
    calorias: number;
    tipo: TipoComida;
  }[] = [
    { nombre: "Avena con frutas", descripcion: "", calorias: 350, tipo: "Desayuno" },
    { nombre: "Pechuga de pollo con arroz", descripcion: "", calorias: 600, tipo: "Almuerzo" },
    { nombre: "Ensalada de atún", descripcion: "", calorias: 420, tipo: "Cena" },
    { nombre: "Huevos revueltos", descripcion: "", calorias: 300, tipo: "Desayuno" },
    { nombre: "Pasta con carne", descripcion: "", calorias: 750, tipo: "Almuerzo" },
  ];

  const ids: Record<string, number> = {};
  for (const c of catalogo) {
    ids[c.nombre] = await insertComida({
      nombre: c.nombre,
      descripcion: c.descripcion,
      calorias: c.calorias,
      tipo: c.tipo,
      image: null,
      user_id: userId,
    });
  }

  // Enlaces dia-comida (cada agregarComidaADia recalcula el total del dia).
  await agregarComidaADia(diaHoy, ids["Avena con frutas"]);
  await agregarComidaADia(diaHoy, ids["Pechuga de pollo con arroz"]);
  await agregarComidaADia(diaHoy, ids["Ensalada de atún"]);
  await agregarComidaADia(diaAyer, ids["Huevos revueltos"]);
  await agregarComidaADia(diaAyer, ids["Pasta con carne"]);
}
