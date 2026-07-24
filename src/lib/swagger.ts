import { createSwaggerSpec } from 'next-swagger-doc';

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'E-Shop API',
        version: '1.0.0',
        description:
          'REST API documentation for the E-Shop e-commerce platform. All protected routes require a JWT token stored in an httpOnly cookie named `token`.',
        contact: {
          name: 'E-Shop Dev Team',
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          description: 'Current server',
        },
      ],
      tags: [
        { name: 'Auth', description: 'User authentication — login, signup, logout' },
        { name: 'Products', description: 'Public product listing and search' },
        { name: 'Categories', description: 'Product categories' },
        { name: 'Orders', description: 'User order management' },
        { name: 'Contact', description: 'Contact form submissions' },
        { name: 'Subscription', description: 'Premium membership via Stripe' },
        { name: 'User', description: 'User profile, password, account settings' },
        { name: 'Admin - Auth', description: 'Admin-only authentication' },
        { name: 'Admin - Products', description: 'Admin product CRUD' },
        { name: 'Admin - Categories', description: 'Admin category CRUD' },
        { name: 'Admin - Orders', description: 'Admin order management' },
        { name: 'Admin - Contact', description: 'Admin view and reply to contact messages' },
        { name: 'Admin - Subscribers', description: 'Admin view of premium subscribers' },
        { name: 'Stripe', description: 'Stripe checkout and webhook endpoints' },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'token',
            description: 'JWT stored in an httpOnly cookie. Log in first to authenticate.',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Something went wrong' },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '64b1f2c3d4e5f6a7b8c9d0e1' },
              name: { type: 'string', example: 'Zainab Bilal' },
              email: { type: 'string', example: 'zainab@example.com' },
              role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
              subscription: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['none', 'active', 'cancelled', 'past_due'],
                    example: 'none',
                  },
                },
              },
            },
          },
          Product: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '64b1f2c3d4e5f6a7b8c9d0e1' },
              name: { type: 'string', example: 'Wireless Headphones' },
              slug: { type: 'string', example: 'wireless-headphones' },
              description: { type: 'string', example: 'High quality wireless headphones' },
              price: { type: 'number', example: 49.99 },
              originalPrice: { type: 'number', example: 69.99 },
              images: { type: 'array', items: { type: 'string' } },
              category: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string', example: 'Electronics' },
                  slug: { type: 'string', example: 'electronics' },
                },
              },
              stock: { type: 'integer', example: 25 },
              isFeatured: { type: 'boolean', example: false },
              isPremiumOnly: { type: 'boolean', example: false },
            },
          },
          Category: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string', example: 'Electronics' },
              slug: { type: 'string', example: 'electronics' },
              description: { type: 'string', example: 'Electronic devices and accessories' },
              image: { type: 'string', example: 'https://example.com/electronics.jpg' },
            },
          },
          Order: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              user: { type: 'string', description: 'User ID' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    product: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'number' },
                    quantity: { type: 'integer' },
                  },
                },
              },
              totalAmount: { type: 'number', example: 89.99 },
              status: {
                type: 'string',
                enum: ['Pending', 'Paid', 'Accepted', 'Refunded', 'Cancelled'],
                example: 'Paid',
              },
              shippingAddress: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
              refundReason: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 12 },
              totalCount: { type: 'integer', example: 48 },
              totalPages: { type: 'integer', example: 4 },
            },
          },
        },
      },
    },
  });
}