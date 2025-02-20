const express = require('express');
const cors = require('cors');
const sql = require('mssql'); // Importar el módulo mssql

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'https://byj0su3.github.io', // Permitir solo este dominio
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type'], // Cabeceras permitidas
  credentials: true // Permitir credenciales (si las usas)
}));

// Middleware para leer JSON
app.use(express.json());

// Configuración de la base de datos SQL Server
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

// Función para conectar a la base de datos
async function connectToDatabase() {
  try {
    if (!sql.pool) {
      await sql.connect(dbConfig);
      console.log('✅ Conectado a SQL Server');
    }
  } catch (error) {
    console.error('❌ Error de conexión a SQL Server:', error);
    throw error; // Lanzar el error para manejarlo en el nivel superior
  }
}

// Manejar solicitudes OPTIONS (preflight)
app.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://byj0su3.github.io');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

// Ruta para insertar respuestas de la encuesta
app.post('/', async (req, res) => {
  try {
    await connectToDatabase(); // Asegurar conexión antes de ejecutar la consulta

    const { 
      cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 
    } = req.body;

    console.log("📩 Datos recibidos:", req.body);

    if (!cedula) {
      return res.status(400).json({ success: false, message: "Cedula es requerida" });
    }

    const fechaRegistro = new Date();

    // 🔹 Ejecutar el INSERT con consulta parametrizada
    const request = new sql.Request();
    const query = `
      INSERT INTO respuestas_encuesta 
        (cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
         pregunta6, pregunta7, pregunta8, pregunta9, pregunta10, fecha_registro)
      VALUES 
        (@cedula, @pregunta1, @pregunta2, @pregunta3, @pregunta4, @pregunta5, 
         @pregunta6, @pregunta7, @pregunta8, @pregunta9, @pregunta10, @fechaRegistro);
    `;

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

    await request.query(query);
    console.log('✅ Registro insertado correctamente');

    // 🔹 Obtener el último registro insertado
    const result = await request.query(`
      SELECT TOP 1 * FROM respuestas_encuesta WHERE cedula = @cedula ORDER BY fecha_registro DESC;
    `);

    console.log('📌 Último registro insertado:', result.recordset[0]);

    res.json({ success: true, message: 'Datos insertados correctamente', data: result.recordset[0] });
  } catch (error) {
    console.error('⚠️ Error al insertar datos:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Cerrar la conexión después de cada consulta
    if (sql.pool) {
      await sql.pool.close();
      console.log('🔒 Conexión cerrada');
    }
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('🚀 Servidor de encuestas funcionando correctamente');
});

// Iniciar el servidor en Cloud Run (escuchar en 0.0.0.0)
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
