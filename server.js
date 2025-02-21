const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'https://byj0su3.github.io', // Permitir solo este dominio
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configuración del pool de conexión a SQL Server
const pool = new sql.ConnectionPool({
  server: "34.46.34.127", 
  database: "datos_ec",
  user: 'sa',
  password: 'Dominguez007',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
});

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para insertar respuestas de la encuesta
app.post('/', async (req, res) => {
  let connection;
  try {
    // Conectar al pool
    connection = await pool.connect();

    const { 
      cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 
    } = req.body;

    if (!cedula) {
      return res.status(400).json({ success: false, message: "Cedula es requerida" });
    }

    const fechaRegistro = new Date();

    const request = connection.request();

    request.input('cedula', sql.VarChar, cedula);
    request.input('pregunta1', sql.VarChar, pregunta1);
    request.input('pregunta2', sql.VarChar, pregunta2);
    request.input('pregunta3', sql.VarChar, pregunta3);
    request.input('pregunta4', sql.VarChar, pregunta4);
    request.input('pregunta5', sql.VarChar, pregunta5);
    request.input('pregunta6', sql.VarChar, pregunta6);
    request.input('pregunta7', sql.VarChar, pregunta7);
    request.input('pregunta8', sql.VarChar, pregunta8);
    request.input('pregunta9', sql.VarChar, pregunta9);
    request.input('pregunta10', sql.VarChar, pregunta10);
    request.input('fechaRegistro', sql.DateTime, fechaRegistro);

    await request.query(`
      INSERT INTO respuestas_encuesta 
      (cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
       pregunta6, pregunta7, pregunta8, pregunta9, pregunta10, fecha_registro)
      VALUES 
      (@cedula, @pregunta1, @pregunta2, @pregunta3, @pregunta4, @pregunta5, 
       @pregunta6, @pregunta7, @pregunta8, @pregunta9, @pregunta10, @fechaRegistro);
    `);

    console.log('✅ Registro insertado correctamente');

    // Obtener el último registro insertado
    const result = await request.query(`
      SELECT TOP 1 * FROM respuestas_encuesta WHERE cedula = @cedula ORDER BY fecha_registro DESC;
    `);

    res.json({ success: true, message: 'Datos insertados correctamente', data: result.recordset[0] });
  } catch (error) {
    console.error('⚠️ Error al insertar datos:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) {
      connection.close(); // Cerrar la conexión después de cada solicitud
    }
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('🚀 Servidor de encuestas funcionando correctamente');
});

// Iniciar el servidor en Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
