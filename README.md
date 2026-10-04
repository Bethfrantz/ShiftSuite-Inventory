# Inventory Management System
A full‑stack inventory management platform built with React, Node.js/Express, and MongoDB. 
Designed for multi‑location operations, vendor tracking, par levels, waste logging, and photo‑based categorization.

This project demonstrates enterprise‑grade UI design, clean architecture, and production‑ready React patterns 
including shared modal systems, portals, validation, animations, and API normalization.

## Features

* Multi‑location inventory support
* Category management with photos and descriptions
* Item management with vendor, barcode, units, par levels, and photos
* Full CRUD operations for categories and items
* Shared modal system:
  * ESC‑key close
  * Click‑outside‑to‑close
  * React portals
  * Smooth animations
  * Form validation
* Responsive UI built with modular CSS
* MongoDB data modeling
* Normalized API wrapper for consistent frontend consumption

## Tech Stack

### Frontend
* React
* React Router
* Modular CSS
* React Portals

### Backend
* Node.js / Express
* REST API
* MongoDB / Mongoose

### Tooling
* ESLint
* GitHub
* Vite or CRA

## Project Structure
/app
/components
ItemEditModal.jsx
DeleteItemModal.jsx
CategoryEditModal.jsx
DeleteCategoryModal.jsx
/pages
Items.jsx
Categories.jsx
ItemDetail.jsx
/api
index.js
/public
/images
/styles
/modals
Modal.module.css
CategoryModal.module.css
README.md
package.json

## Getting Started

1. Clone the repository
git clone https://github.com/yourusername/inventory-system.git  
2. Install dependencies
npm install  
3. Start the backend
cd backend
npm install
npm start  
4. Start the frontend
cd frontend
npm start 
5. Configure MongoDB
Update your .env file:
MONGO_URI=mongodb://localhost:27017/inventory  

## API Endpoints

### Items
* GET /items
* GET /items/:id
* POST /items
* PUT /items/:id
* DELETE /items/:id

### Categories
* GET /categories
* POST /categories
* PUT /categories/:id
* DELETE /categories/:id

## Future Enhancements

* Search and filtering
* Sorting by vendor, par, or category
* Waste tracking
* Reporting and snapshots
* Print view
* Authentication
* Role‑based access

## License

MIT License

## Summary

This project demonstrates practical full‑stack development skills through a complete inventory management system built with React, Node.js/Express, and MongoDB. It includes a clean and responsive user interface, modular architecture, and production‑ready features such as React portals, form validation, modal animations, and normalized API responses. The system supports multi‑location inventory, category and item management, vendor tracking, par levels, and photo‑based organization. It reflects an understanding of real‑world application design, maintainability, and user experience, making it a strong portfolio example of building reliable, scalable, and professional software.

---

