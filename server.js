const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require("mssql");

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'https://byj0su3.github.io', // Asegura que solo tu frontend pueda hacer peticiones
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Middleware para parsear JSON
app.use(bodyParser.json());

// Configuración de la base de datos
const dbConfig = {
  server: "34.46.10.198",
  database: "datos_ec",
  user: 'Pc',       // Usuario de SQL Server
  password: 'Dominguez007',  // Contraseña del usuario de SQL Server
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

// Conectar a la base de datos
async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log('✅ Conectado a SQL Server con autenticación de Windows');
  } catch (error) {
    console.error('❌ Error de conexión a SQL Server:', error);
  }
}
connectToDatabase();

// Ruta para insertar respuestas de la encuesta
app.post('/api/respuestas', async (req, res) => {
  try {
    const { 
      cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 
    } = req.body;

    console.log("Datos recibidos:", req.body); // Log para depuración

    const fechaRegistro = new Date();

    // Crear un objeto Request para el INSERT
    const requestInsert = new sql.Request();
    requestInsert.input("cedula", sql.VarChar, cedula);
    requestInsert.input("pregunta1", sql.VarChar, pregunta1);
    requestInsert.input("pregunta2", sql.VarChar, pregunta2);
    requestInsert.input("pregunta3", sql.VarChar, pregunta3);
    requestInsert.input("pregunta4", sql.VarChar, pregunta4);
    requestInsert.input("pregunta5", sql.VarChar, pregunta5);
    requestInsert.input("pregunta6", sql.VarChar, pregunta6);
    requestInsert.input("pregunta7", sql.VarChar, pregunta7);
    requestInsert.input("pregunta8", sql.VarChar, pregunta8);
    requestInsert.input("pregunta9", sql.VarChar, pregunta9);
    requestInsert.input("pregunta10", sql.VarChar, pregunta10);
    requestInsert.input("fecha_registro", sql.DateTime, fechaRegistro);

    // Ejecutar el INSERT
    await requestInsert.query(`
      INSERT INTO respuestas_encuesta 
        (cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
         pregunta6, pregunta7, pregunta8, pregunta9, pregunta10, fecha_registro)
      VALUES 
        (@cedula, @pregunta1, @pregunta2, @pregunta3, @pregunta4, @pregunta5, 
         @pregunta6, @pregunta7, @pregunta8, @pregunta9, @pregunta10, @fecha_registro);
    `);

    console.log('✅ Registro insertado en la tabla respuestas_encuesta');

    // Crear un nuevo Request para el SELECT
    const requestSelect = new sql.Request();
    requestSelect.input("cedula", sql.VarChar, cedula);
    const result = await requestSelect.query(`
      SELECT * FROM respuestas_encuesta WHERE cedula = @cedula ORDER BY fecha_registro DESC;
    `);

    console.log('📌 Último registro insertado:', result.recordset[0]);

    res.json({ success: true, message: 'Datos insertados correctamente', data: result.recordset[0] });
  } catch (error) {
    console.error('⚠️ Error al insertar datos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('🚀 Servidor de encuestas funcionando correctamente');
});

// Iniciar el servidor
const PORT = process.env.PORT || 8080; // Cloud Run usa 8080 por defecto
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
