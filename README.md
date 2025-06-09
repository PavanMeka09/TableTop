# TableTop

A web application for managing tabletop gaming sessions and events.

## Project Structure

```
├── backend/         # Backend server code
├── database/        # Database related files
├── js/             # JavaScript files
├── pages/          # Web pages
├── vendor/         # Composer dependencies
└── index.html      # Main entry point
```

## Dependencies

This project uses the following main dependencies:

- Razorpay SDK (v2.9+) - For payment processing
- PHPMailer (v6.9+) - For email functionality

## Setup Instructions

1. Clone the repository
2. Install dependencies using Composer:
   ```bash
   composer install
   ```
3. Configure your web server to point to the project directory
4. Set up your database configuration
5. Configure Razorpay credentials for payment processing
6. Configure email settings for PHPMailer

## Features

- User authentication and management
- Payment processing through Razorpay
- Email notifications
- Database management
- Web interface for tabletop gaming sessions

## Development

The project is structured with separate directories for backend, frontend, and database components. Make sure to follow the existing code structure when adding new features.