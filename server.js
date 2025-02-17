const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require("mssql");
require('dotenv').config(); // Asegurar que se carguen las variables de entorno

const app = express();

// Configurar CORS
app.use(cors({
  origin: 'https://byj0su3.github.io/Encuesta_ValNet/', // Permite solo este dominio
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuración de conexión a la base de datos
const dbConfig = {
  server: "34.46.10.198", 
  database: "datos_ec",
  user: "Pc",       
  password: "Dominguez007",  
  port: 1433, // Puerto estándar de SQL Server
  options: {
    encrypt: false, // Cambia a `true` si usas Azure
    trustServerCertificate: true, // Necesario en servidores sin SSL configurado
  }
};

// Crear una conexión global para ser reutilizada
let pool;

async function connectToDatabase() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conectado a SQL Server correctamente');
    }
  } catch (error) {
    console.error('❌ Error de conexión a SQL Server:', error.message);
  }
}
connectToDatabase();

// Ruta para insertar respuestas de la encuesta
app.post('/submit-encuesta', async (req, res) => {
  try {
    await connectToDatabase(); // Asegurar que la BD está conectada

    const { 
      cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 
    } = req.body;

    const fechaRegistro = new Date();

    // Insertar datos en la BD
    const result = await pool.request()
      .input("cedula", sql.VarChar, cedula)
      .input("pregunta1", sql.VarChar, pregunta1)
      .input("pregunta2", sql.VarChar, pregunta2)
      .input("pregunta3", sql.VarChar, pregunta3)
      .input("pregunta4", sql.VarChar, pregunta4)
      .input("pregunta5", sql.VarChar, pregunta5)
      .input("pregunta6", sql.VarChar, pregunta6)
      .input("pregunta7", sql.VarChar, pregunta7)
      .input("pregunta8", sql.VarChar, pregunta8)
      .input("pregunta9", sql.VarChar, pregunta9)
      .input("pregunta10", sql.VarChar, pregunta10)
      .input("fecha_registro", sql.DateTime, fechaRegistro)
      .query(`
        INSERT INTO respuestas_encuesta 
          (cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
           pregunta6, pregunta7, pregunta8, pregunta9, pregunta10, fecha_registro)
        VALUES 
          (@cedula, @pregunta1, @pregunta2, @pregunta3, @pregunta4, @pregunta5, 
           @pregunta6, @pregunta7, @pregunta8, @pregunta9, @pregunta10, @fecha_registro);
      `);

    console.log('✅ Registro insertado correctamente');

    // Consultar el último registro insertado
    const data = await pool.request()
      .input("cedula", sql.VarChar, cedula)
      .query(`
        SELECT TOP 1 * FROM respuestas_encuesta 
        WHERE cedula = @cedula 
        ORDER BY fecha_registro DESC;
      `);

    console.log('📌 Último registro insertado:', data.recordset[0]);

    res.json({ success: true, message: 'Datos insertados correctamente', data: data.recordset[0] });
  } catch (error) {
    console.error('⚠️ Error al insertar datos:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar el servidor en el puerto 8080
const PORT = process.env.PORT || 8080; // Cloud Run usa 8080 por defecto
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
