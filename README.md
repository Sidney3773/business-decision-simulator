# Simulador de Toma de Decisiones Empresariales bajo Presión

Prototipo funcional (60%) de un simulador web para **entrenamiento en toma de decisiones empresariales**, con autenticación por roles, gestión de escenarios y ejecución de simulaciones.

---

## Stack Tecnológico

- **Backend:** Node.js + Express + Sequelize + MySQL  
- **Frontend:** React (Vite) + Material-UI + React Router + Axios  
- **Autenticación:** JWT + bcrypt  
- **Base de Datos:** MySQL 8.0  
- **Containerización:** Docker + Docker Compose  

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js 18+](https://nodejs.org/)
- [MySQL 8.0+](https://dev.mysql.com/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

## Instalación y Configuración

### Opción 1: Con Docker (recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd business-decision-simulator
   ```

2. **Levantar los servicios**
   ```bash
   docker-compose up -d
   ```

   Esto iniciará los siguientes servicios:
   - MySQL → `localhost:3306`
   - Backend → `http://localhost:5000`
   - phpMyAdmin → `http://localhost:8080`

3. **Instalar dependencias del frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Iniciar el frontend**
   ```bash
   npm run dev
   ```

   El frontend estará disponible en: [http://localhost:5173](http://localhost:5173)

---

### Opción 2: Instalación Local (sin Docker)

#### Configurar MySQL

Ejecuta en tu terminal MySQL:

```sql
CREATE DATABASE business_simulator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'simulator_user'@'localhost' IDENTIFIED BY 'simulator_pass';
GRANT ALL PRIVILEGES ON business_simulator.* TO 'simulator_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus credenciales (por ejemplo):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=business_simulator
DB_PORT=3306
JWT_SECRET=tu_super_secreto_jwt_cambiar_en_produccion_2024
JWT_EXPIRE=7d
PORT=5000
```

#### Ejecutar migraciones y seeds
```bash
npm run migrate
npm run seed
```

#### Iniciar backend
```bash
npm run dev
```

El backend estará en [http://localhost:5000](http://localhost:5000)

#### Configurar Frontend
```bash
cd frontend
npm install
npm run dev
```

El frontend estará en [http://localhost:5173](http://localhost:5173)

---

## Usuarios de Prueba

Tras ejecutar los **seeds**, puedes acceder con las siguientes credenciales:

| Rol | Email | Contraseña |
|------|--------------------------|--------------|
| Admin | admin@simulator.com | password123 |
| Teacher | teacher@simulator.com | password123 |
| Student | student@simulator.com | password123 |

---

## Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run test
```

---

## API Endpoints

### Autenticación
- `POST /api/auth/register` → Registrar usuario  
- `POST /api/auth/login` → Iniciar sesión  
- `GET /api/auth/me` → Obtener perfil (requiere token)

### Usuarios (Admin)
- `GET /api/users` → Listar usuarios  
- `GET /api/users/:id` → Obtener usuario  
- `PUT /api/users/:id` → Actualizar usuario  
- `DELETE /api/users/:id` → Eliminar usuario  

### Escenarios
- `GET /api/scenarios` → Listar escenarios  
- `GET /api/scenarios/:id` → Obtener escenario  
- `POST /api/scenarios` → Crear escenario (Teacher/Admin)  
- `PUT /api/scenarios/:id` → Actualizar escenario (Teacher/Admin)  
- `DELETE /api/scenarios/:id` → Eliminar escenario (Teacher/Admin)

### Simulaciones
- `POST /api/simulations/run` → Ejecutar simulación  
- `GET /api/simulations/user/:userId` → Simulaciones por usuario  
- `GET /api/simulations/:id` → Obtener simulación  
- `GET /api/simulations` → Listar todas (Admin/Teacher)

---

## Configuración de VSCode

### Extensiones Recomendadas
1. ESLint  
2. Prettier  
3. Docker  
4. SQLTools  
5. ES7+ React/Redux/React-Native snippets  
6. Material Icon Theme  

### launch.json (Depuración)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

---

## Créditos y Estado del Proyecto

Proyecto en desarrollo (avance funcional **60%**).  
Desarrollado por **Sidney**, Ingeniera de Sistemas en formación.  
Fase actual: Documentación y pruebas.  
Objetivo final: Plataforma de simulación empresarial con métricas y resultados automatizados.

---
