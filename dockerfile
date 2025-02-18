# Usa una imagen base de Node.js
FROM node:16-alpine

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (si existe)
COPY package*.json ./

# Instala las dependencias
RUN npm install --production

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto en el que la app escuchará
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
