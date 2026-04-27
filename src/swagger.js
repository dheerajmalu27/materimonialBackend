import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Matrimonial App API',
      version: '1.0.0',
      description: 'API documentation for the matrimonial application backend',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Address: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              example: 'Mumbai',
            },
            state: {
              type: 'string',
              example: 'Maharashtra',
            },
            country: {
              type: 'string',
              example: 'India',
            },
            pincode: {
              type: 'string',
              example: '400001',
            },
          },
          required: ['city', 'state', 'country', 'pincode'],
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            dob: {
              type: 'string',
              format: 'date',
              example: '1990-01-01',
            },
            birth_time: {
              type: 'string',
              example: '12:00:00',
            },
            height_cm: {
              type: 'number',
              example: 175,
            },
            weight_kg: {
              type: 'number',
              example: 70,
            },
            marital_status: {
              type: 'string',
              example: 'single',
            },
            religion: {
              type: 'string',
              example: 'Hindu',
            },
            caste: {
              type: 'string',
              example: 'Brahmin',
            },
            mother_tongue: {
              type: 'string',
              example: 'Hindi',
            },
            about_me: {
              type: 'string',
              example: 'I am a software engineer looking for a life partner.',
            },
            default_photo: {
              type: 'string',
              example: 'https://example.com/photos/default.jpg',
            },
            short_photo: {
              type: 'string',
              example: 'https://example.com/photos/short.jpg',
            },
            address: {
              type: 'object',
              properties: {
                present: {
                  $ref: '#/components/schemas/Address',
                },
                permanent: {
                  $ref: '#/components/schemas/Address',
                },
              },
              example: {
                present: {
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  country: 'India',
                  pincode: '400001',
                },
                permanent: {
                  city: 'Delhi',
                  state: 'Delhi',
                  country: 'India',
                  pincode: '110001',
                },
              },
            },
            education: {
              type: 'object',
              properties: {
                highest_degree: {
                  type: 'string',
                  example: 'Bachelor of Engineering',
                },
                college: {
                  type: 'string',
                  example: 'IIT Bombay',
                },
                specialization: {
                  type: 'string',
                  example: 'Computer Science',
                },
                passing_year: {
                  type: 'string',
                  example: '2012',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            email: {
              type: 'string',
              example: 'john.doe@example.com',
            },
            mobile: {
              type: 'string',
              example: '+91-9876543210',
            },
            gender: {
              type: 'string',
              example: 'male',
            },
            profile: {
              $ref: '#/components/schemas/UserProfile',
            },
            addresses: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/UserAddress',
              },
            },
            education: {
              $ref: '#/components/schemas/UserEducation',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            user_id: {
              type: 'number',
              example: 1,
            },
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            dob: {
              type: 'string',
              format: 'date',
              example: '1990-01-01',
            },
            birth_time: {
              type: 'string',
              example: '12:00:00',
            },
            height_cm: {
              type: 'number',
              example: 175,
            },
            weight_kg: {
              type: 'number',
              example: 70,
            },
            marital_status: {
              type: 'string',
              example: 'single',
            },
            religion: {
              type: 'string',
              example: 'Hindu',
            },
            caste: {
              type: 'string',
              example: 'Brahmin',
            },
            mother_tongue: {
              type: 'string',
              example: 'Hindi',
            },
            about_me: {
              type: 'string',
              example: 'I am a software engineer looking for a life partner.',
            },
          },
        },
        UserAddress: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            user_id: {
              type: 'number',
              example: 1,
            },
            address_type: {
              type: 'string',
              enum: ['present', 'permanent', 'both'],
              description: 'Type of address. Use "both" if present and permanent addresses are identical.',
              example: 'present',
            },
            city: {
              type: 'string',
              example: 'Mumbai',
            },
            state: {
              type: 'string',
              example: 'Maharashtra',
            },
            country: {
              type: 'string',
              example: 'India',
            },
            pincode: {
              type: 'string',
              example: '400001',
            },
          },
        },
        UserEducation: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            user_id: {
              type: 'number',
              example: 1,
            },
            highest_degree: {
              type: 'string',
              example: 'Bachelor of Engineering',
            },
            college: {
              type: 'string',
              example: 'IIT Bombay',
            },
            specialization: {
              type: 'string',
              example: 'Computer Science',
            },
            passing_year: {
              type: 'string',
              example: '2012',
            },
          },
        },
        ProfileCompletionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            completionPercentage: {
              type: 'number',
              example: 75,
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'User not found',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'], // Path to the API routes
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
