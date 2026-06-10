import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import type { NewUsuario, Usuario } from "../models/Usuario";
import type { NewDia, Dia, DiaConComidas } from "../models/Dia";
import type { NewComida, Comida } from "../models/Comida";

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
    nombre       TEXT    NOT NULL,
    descripcion  TEXT    NOT NULL DEFAULT '',
    calorias     REAL    NOT NULL DEFAULT 0,
    image        TEXT,
    dia_id       INTEGER NOT NULL REFERENCES dia(id) ON DELETE CASCADE
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
  await conn.execute(CREATE_TABLES);
  return conn;
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

export async function getNonAdminUsuarios(): Promise<Usuario[]> {
  const conn = await getDb();
  const result = await conn.query(
    "SELECT * FROM usuario WHERE rol = 'user' ORDER BY name ASC"
  );
  return (result.values ?? []) as Usuario[];
}

export async function updateUsuario(usuario: Usuario): Promise<void> {
  const conn = await getDb();
  await conn.run(
    "UPDATE usuario SET correo = ?, contrasena = ?, name = ?, image = ?, rol = ? WHERE id = ?",
    [
      usuario.correo,
      usuario.contrasena,
      usuario.name,
      usuario.image ?? null,
      usuario.rol,
      usuario.id,
    ]
  );
}

export async function deleteUsuario(id: number): Promise<void> {
  const conn = await getDb();
  await conn.run("DELETE FROM usuario WHERE id = ?", [id]);
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

export async function getDiaConComidas(
  diaId: number
): Promise<DiaConComidas | null> {
  const conn = await getDb();

  const diaResult = await conn.query("SELECT * FROM dia WHERE id = ?", [diaId]);
  const dia = ((diaResult.values ?? [])[0] as Dia) ?? null;
  if (!dia) return null;

  const comidaResult = await conn.query(
    "SELECT * FROM comida WHERE dia_id = ?",
    [diaId]
  );
  const comidas = (comidaResult.values ?? []) as Comida[];

  return { ...dia, comidas };
}

// Comida queries

export async function insertComida(comida: NewComida): Promise<number> {
  const conn = await getDb();
  const result = await conn.run(
    "INSERT INTO comida (nombre, descripcion, calorias, image, dia_id) VALUES (?, ?, ?, ?, ?)",
    [
      comida.nombre,
      comida.descripcion,
      comida.calorias,
      comida.image ?? null,
      comida.dia_id,
    ]
  );
  await recalcCaloriasObtenidas(comida.dia_id);
  return result.changes?.lastId ?? -1;
}

export async function getComidas(diaId: number): Promise<Comida[]> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM comida WHERE dia_id = ?", [
    diaId,
  ]);
  return (result.values ?? []) as Comida[];
}

export async function getComidaById(comidaId: number): Promise<Comida | null> {
  const conn = await getDb();
  const result = await conn.query("SELECT * FROM comida WHERE id = ?", [
    comidaId,
  ]);
  return ((result.values ?? [])[0] as Comida) ?? null;
}

export async function updateComida(comida: Comida): Promise<void> {
  const conn = await getDb();
  await conn.run(
    "UPDATE comida SET nombre = ?, descripcion = ?, calorias = ?, image = ? WHERE id = ?",
    [
      comida.nombre,
      comida.descripcion,
      comida.calorias,
      comida.image ?? null,
      comida.id,
    ]
  );
  await recalcCaloriasObtenidas(comida.dia_id);
}

export async function deleteComida(comidaId: number): Promise<void> {
  const conn = await getDb();
  const comida = await getComidaById(comidaId);
  await conn.run("DELETE FROM comida WHERE id = ?", [comidaId]);
  if (comida) {
    await recalcCaloriasObtenidas(comida.dia_id);
  }
}

// Keeps dia.calorias_obtenidas in sync with the sum of its comidas, so views
// can read the total without re-querying every comida.
async function recalcCaloriasObtenidas(diaId: number): Promise<void> {
  const conn = await getDb();
  const result = await conn.query(
    "SELECT COALESCE(SUM(calorias), 0) AS total FROM comida WHERE dia_id = ?",
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

  const comidas: NewComida[] = [
    {
      nombre: "Avena con frutas",
      descripcion: "Desayuno",
      calorias: 350,
      image: null,
      dia_id: diaHoy,
    },
    {
      nombre: "Pechuga de pollo con arroz",
      descripcion: "Almuerzo",
      calorias: 600,
      image: null,
      dia_id: diaHoy,
    },
    {
      nombre: "Ensalada de atún",
      descripcion: "Cena",
      calorias: 420,
      image: null,
      dia_id: diaHoy,
    },
    {
      nombre: "Huevos revueltos",
      descripcion: "Desayuno",
      calorias: 300,
      image: null,
      dia_id: diaAyer,
    },
    {
      nombre: "Pasta con carne",
      descripcion: "Almuerzo",
      calorias: 750,
      image: null,
      dia_id: diaAyer,
    },
  ];

  for (const comida of comidas) {
    await insertComida(comida);
  }
}
