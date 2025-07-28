# Open WebUI Analytics

A comprehensive analytics dashboard for [Open WebUI](https://github.com/open-webui/open-webui) that provides real-time insights into your AI assistant usage, user engagement, model performance, and tool utilization.

![Open WebUI Analytics Dashboard](https://img.shields.io/badge/Analytics-Dashboard-blue)
![Database Support](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-green)
![Framework](https://img.shields.io/badge/Frontend-Svelte-orange)
![Backend](https://img.shields.io/badge/Backend-Node.js-yellow)

## ✨ Features

### 📊 Comprehensive Analytics
- **User Statistics**: Total users, active users, engagement rates
- **Chat Metrics**: Total conversations, activity over time
- **Model Usage**: Track which AI models are most popular
- **Token Consumption**: Estimated token usage and costs
- **Tool Analytics**: Built-in and custom tool usage tracking

### 🎯 Key Insights
- User engagement patterns and trends
- Model performance comparisons
- Tool adoption and usage statistics
- Activity heatmaps and time-series data
- Token usage optimization opportunities

### 🗄️ Database Support
- **SQLite**: Direct connection to existing Open WebUI databases
- **PostgreSQL**: Enterprise-grade database support
- **Auto-Discovery**: Automatically finds common database locations
- **Easy Setup**: Web-based configuration interface

### 🚀 Modern Stack
- **Frontend**: Svelte with responsive design
- **Backend**: Node.js with Express
- **Styling**: Modern CSS with dark/light theme support
- **Development**: Hot-reload with Vite

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- Access to your **Open WebUI database** (SQLite file or PostgreSQL connection)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/open-webui-analytics.git
cd open-webui-analytics
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm run dev
```

The application will start in development mode:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3001 (Express server)

### 4. Configure Database

If no database is configured, the application will automatically launch in setup mode. You'll see a configuration interface where you can:

- **Auto-discover** your Open WebUI database
- **Select from common paths**
- **Enter a custom database path**
- **Configure PostgreSQL connection**

## 🔧 Configuration Options

### SQLite Configuration

The easiest setup if you have an existing Open WebUI installation:

1. **Auto-Discovery**: Click "🔍 Auto-Find" to automatically locate your database
2. **Common Paths**: Choose from typical installation locations:
   - `/app/backend/data/webui.db` (Docker default)
   - `~/.local/share/open-webui/webui.db` (Linux default)
   - `./backend/data/webui.db` (Development)
   - `./webui.db` (Local file)
3. **Manual Path**: Enter any custom path (supports `~` for home directory)

### PostgreSQL Configuration

For production deployments or shared databases:

```bash
# Environment variable method
export DATABASE_URL="postgresql://username:password@localhost:5432/openwebui"
npm run server
```

Or use the web interface to configure:
- Host, Port, Database name
- Username and Password
- Connection testing before saving

### Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=sqlite:///path/to/webui.db
# or
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=3001

# Optional: Custom data directory
DATA_DIR=/path/to/data
```

## 📊 Dashboard Overview

### Overview Tab
- **Total Users**: Complete user count
- **Total Chats**: All conversations
- **Active Users**: Users active in the last 30 days
- **Total Tokens**: Estimated token consumption
- **Tool Uses**: Total tool invocations
- **Active Models**: Currently available AI models

### Model Usage Tab
- **Usage Statistics**: Calls per model
- **Token Consumption**: Estimated tokens by model
- **Performance Metrics**: Response patterns
- **Popularity Rankings**: Most used models

### Activity Tab
- **Time Series**: Daily activity patterns
- **User Engagement**: Active users over time
- **Chat Volume**: Conversation trends
- **Configurable Timeframes**: 7, 30, 90 days

### Tools Tab
- **Built-in Tools**: Core Open WebUI functionality
- **Custom Tools**: User-installed extensions
- **Usage Patterns**: Tool adoption rates
- **Integration Analytics**: Tool effectiveness

### Users Tab
- **User Profiles**: Individual user statistics
- **Activity Levels**: Engagement metrics
- **Token Usage**: Per-user consumption
- **Chat History**: Conversation counts

## 🏗️ Architecture

### Frontend (Svelte)
```
src/
├── components/           # Reusable UI components
│   ├── Overview.svelte  # Dashboard overview
│   ├── ModelUsage.svelte # Model analytics
│   ├── ActivityChart.svelte # Activity visualization
│   ├── UserStats.svelte # User statistics
│   ├── ToolUsage.svelte # Tool analytics
│   └── Setup.svelte     # Database configuration
├── lib/
│   └── api.js          # API client functions
├── App.svelte          # Main application
└── main.js            # Application entry point
```

### Backend (Node.js)
```
server.js               # Express server with database abstraction
├── Database Detection  # SQLite vs PostgreSQL
├── Query Abstraction  # Cross-database compatibility
├── API Endpoints      # RESTful analytics API
├── Setup Routes       # Configuration interface
└── CORS & Security    # Cross-origin and security headers
```

### Database Schema
The analytics service reads from your existing Open WebUI database:
- **chat**: Conversation data and metadata
- **user**: User profiles and settings
- **model**: AI model configurations
- **message**: Individual messages and tool calls

## 🔌 API Endpoints

### Analytics API
- `GET /api/stats/overview` - Dashboard summary statistics
- `GET /api/stats/models` - Model usage analytics
- `GET /api/stats/activity?days=30` - Activity metrics
- `GET /api/stats/users` - User statistics
- `GET /api/stats/tools` - Tool usage analytics

### Setup API
- `GET /setup` - Setup mode detection
- `POST /setup/configure` - Database configuration
- `POST /setup/test-sqlite` - SQLite path validation
- `POST /setup/restart` - Server restart

## 🚢 Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "server"]
```

### Environment Setup
```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/openwebui
PORT=3001

# Build and serve
npm run build
npm run server
```

### Reverse Proxy Configuration

#### Nginx
```nginx
server {
    listen 80;
    server_name analytics.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName analytics.yourdomain.com
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

## 🐳 Docker Compose

Complete stack with database:

```yaml
version: '3.8'
services:
  analytics:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://analytics:password@postgres:5432/analytics
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=analytics
      - POSTGRES_USER=analytics
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🛠️ Development

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/your-username/open-webui-analytics.git
cd open-webui-analytics

# Install dependencies
npm install

# Start development servers
npm run dev
```

### Development Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Frontend only (Vite dev server)
- `npm run server` - Backend only (Node.js server)
- `npm run build` - Build frontend for production

### Code Structure
- **Frontend**: Modern Svelte with Vite bundling
- **Backend**: Express.js with database abstraction
- **Styling**: CSS custom properties with responsive design
- **API**: RESTful endpoints with JSON responses

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database file permissions
ls -la /path/to/webui.db

# Verify PostgreSQL connection
psql -h localhost -U username -d database -c "SELECT 1;"
```

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run server
```

#### Setup Mode Not Working
1. Delete existing `.env` file
2. Remove `webui.db` from project root
3. Restart the application
4. Setup interface should appear automatically

#### Analytics Not Loading
1. Check browser console for errors
2. Verify backend server is running on port 3001
3. Ensure database contains chat data
4. Check CORS configuration

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run server

# Backend only debug
NODE_ENV=development npm run server

# Check API endpoints
curl http://localhost:3001/api/stats/overview
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **Frontend**: Follow Svelte best practices
- **Backend**: Use Express.js conventions
- **Database**: Maintain compatibility with both SQLite and PostgreSQL
- **Testing**: Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Open WebUI](https://github.com/open-webui/open-webui) - The amazing AI interface this analytics tool supports
- [Svelte](https://svelte.dev/) - The reactive frontend framework
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - High-performance SQLite bindings
- [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/open-webui-analytics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/open-webui-analytics/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/open-webui-analytics/wiki)

---

**Built with ❤️ for the Open WebUI community**