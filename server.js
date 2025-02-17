const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();

// Configuración de CORS para producción
app.use(cors({
  origin: 'https://byj0su3.github.io',
  methods: ['POST']
}));

// Pool de conexiones para mejor manejo
const dbConfig = {
  server: "process.env.34.46.10.198", 
  database: "process.env.datos_ec",
  authentication: {
    type: 'ntlm',
    options: {
      userName: 'process.env.Pc',         // Tu usuario de Windows
      password: 'process.env.Dominguez007', // Tu contraseña de Windows
      domain: 'process.env.HP-VICTUS'       // Solo el dominio o el nombre del equipo; no incluyas el usuario aquí
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

// Crear el pool de conexiones
async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    console.log('✅ Conectado a SQL Server');
  } catch (error) {
    console.error('❌ Error de conexión:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1); // Detener la app si falla
  }
}

// Middleware para manejar conexiones
app.use(async (req, res, next) => {
  try {
    if (!pool.connected) {
      await pool.connect();
    }
    next();
  } catch (err) {
    console.error('Error en middleware:', err);
    res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }
});

// Endpoint para guardar encuestas
app.post('/submit-encuesta', async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { cedula, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, 
      pregunta6, pregunta7, pregunta8, pregunta9, pregunta10 } = req.body;

    await transaction.begin();
    const request = new sql.Request(transaction);

    // Parámetros de la consulta
    request.input('cedula', sql.VarChar(20), cedula);
    for (let i = 1; i <= 10; i++) {
      request.input(`pregunta${i}`, sql.VarChar(3), req.body[`pregunta${i}`]);
    }
    request.input('fecha_registro', sql.DateTime, new Date());

    // Query parametrizada
    const query = `
      INSERT INTO respuestas_encuesta 
      (cedula, ${Array.from({length: 10}, (_, i) => `pregunta${i+1}`).join(', ')}, fecha_registro)
      VALUES 
      (@cedula, ${Array.from({length: 10}, (_, i) => `@pregunta${i+1}`).join(', ')}, @fecha_registro)`;

    await request.query(query);
    await transaction.commit();

    console.log('📊 Datos insertados correctamente');
    res.json({ 
      success: true, 
      message: 'Datos guardados en Google Cloud SQL',
      cedula: cedula
    });

  } catch (error) {
    await transaction.rollback();
    console.error('🔥 Error crítico:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      error: 'Error al guardar en la nube',
      details: error.message
    });
  }
});

// Cerrar conexiones al apagar
process.on('SIGINT', async () => {
  await pool.close();
  console.log('🔌 Conexiones de SQL cerradas');
  process.exit();
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
