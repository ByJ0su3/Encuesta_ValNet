const express = require('express');
const cors = require('cors');
const sql = require("mssql");

const app = express();

// 🔹 CORS configurado para permitir solo el frontend autorizado
app.use(cors({
  origin: 'https://byj0su3.github.io',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// 🔹 Middleware para leer JSON correctamente
app.use(express.json());

// 🔹 Configuración de la base de datos SQL Server
const dbConfig = {
  server: "34.46.10.198",
  database: "datos_ec",
  user: 'sa',
  password: 'Dominguez007',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

// 🔹 Crear una sola instancia del pool de conexiones
let pool;
async function connectToDatabase() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conectado a SQL Server');
    } catch (error) {
      console.error('❌ Error de conexión a SQL Server:', error);
      throw error;
    }
  }
  return pool;
}

// 🔹 Ruta para insertar respuestas de la encuesta
app.post('/api/respuestas', async (req, res) => {
  try {
    const pool = await connectToDatabase(); // Conectar antes de ejecutar la consulta

    const { 
      cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 
    } = req.body;

    console.log("📩 Datos recibidos:", req.body);

    if (!cedula) {
      return res.status(400).json({ success: false, message: "Cedula es requerida" });
    }

    const fechaRegistro = new Date();

    // 🔹 Insertar datos de forma segura con parámetros
    const insertQuery = `
      INSERT INTO respuestas_encuesta 
        (cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
         pregunta6, pregunta7, pregunta8, pregunta9, pregunta10, fecha_registro)
      VALUES 
        (@cedula, @pregunta1, @pregunta2, @pregunta3, @pregunta4, @pregunta5, 
         @pregunta6, @pregunta7, @pregunta8, @pregunta9, @pregunta10, @fechaRegistro);
    `;

    await pool.request()
      .input('cedula', sql.VarChar, cedula)
      .input('pregunta1', sql.VarChar, pregunta1)
      .input('pregunta2', sql.VarChar, pregunta2)
      .input('pregunta3', sql.VarChar, pregunta3)
      .input('pregunta4', sql.VarChar, pregunta4)
      .input('pregunta5', sql.VarChar, pregunta5)
      .input('pregunta6', sql.VarChar, pregunta6)
      .input('pregunta7', sql.VarChar, pregunta7)
      .input('pregunta8', sql.VarChar, pregunta8)
      .input('pregunta9', sql.VarChar, pregunta9)
      .input('pregunta10', sql.VarChar, pregunta10)
      .input('fechaRegistro', sql.DateTime, fechaRegistro)
      .query(insertQuery);

    console.log('✅ Registro insertado correctamente');

    // 🔹 Obtener el último registro insertado
    const selectQuery = `
      SELECT TOP 1 * FROM respuestas_encuesta WHERE cedula = @cedula ORDER BY fecha_registro DESC;
    `;

    const result = await pool.request()
      .input('cedula', sql.VarChar, cedula)
      .query(selectQuery);

    console.log('📌 Último registro insertado:', result.recordset[0]);

    res.json({ success: true, message: 'Datos insertados correctamente', data: result.recordset[0] });
  } catch (error) {
    console.error('⚠️ Error al insertar datos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔹 Ruta de prueba
app.get('/', (req, res) => {
  res.send('🚀 Servidor de encuestas funcionando correctamente');
});

// 🔹 Iniciar el servidor en Cloud Run (escuchar en 0.0.0.0)
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
