# SheHarvest - Organic Produce E-Commerce Platform

A full-stack web application for a hackathon, connecting women home-growers with consumers for organic, hyperlocal produce.

## Features

- Seller registration and product listing
- Buyer dashboard to browse and order products
- Responsive UI with Tailwind CSS
- Backend with Node.js and Express
- Data storage in JSON file
- Rate limiting and session management for security

## Setup Instructions

1. **Install Node.js**  
   Download and install from [nodejs.org](https://nodejs.org/).

2. **Clone the Repository**
   ```bash
   git clone "https://github.com/rimil2301/organic-e-commerce.git"
   cd organic-e-commerce
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **(Optional) Configure Environment Variables**  
   Create a `.env` file in the root directory for custom settings (e.g., session secret, port).

5. **Start the Server**
   ```bash
   npm run start
   ```
   The app will run on [http://localhost:3000](http://localhost:3000) by default.

## Deployment Notes

- If deploying behind a proxy (e.g., Render, Heroku, Nginx), ensure you set `trust proxy` in `server/server.js`:
  ```js
  app.set('trust proxy', 1);
  ```
- Use a process manager like [PM2](https://pm2.keymetrics.io/) for production.
- Reverse proxy with Nginx or Apache for HTTPS and domain routing.
- Ensure `server/data.json` is writable by the server process.

## Project Structure

- `public/` - Frontend static files (HTML, CSS, JS)
- `server/` - Backend Express server and data storage
- `package.json` - Project dependencies and scripts

## License

This project is licensed under the [MIT License](LICENSE).
