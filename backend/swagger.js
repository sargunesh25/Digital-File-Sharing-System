const swaggerJSDoc = require('swagger-jsdoc');
const BASE_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';

const json = (schema) => ({
  content: {
    'application/json': { schema }
  }
});

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Digital File Sharing System API',
      version: '1.0.0',
      description: 'API documentation for auth, users, files, and transfers.'
    },
    servers: [{ url: BASE_URL }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Files' },
      { name: 'Transfers' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/UserPublic' }
          }
        },
        FileListItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string' },
            size: { type: 'integer' },
            uploadDate: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            isStarred: { type: 'boolean' },
            isTrashed: { type: 'boolean' }
          }
        },
        TransferRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            filename: { type: 'string' },
            size: { type: 'integer' },
            senderDevice: { type: 'string' },
            receiverDevice: { type: 'string' },
            method: { type: 'string' },
            status: { type: 'string' },
            duration: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: {
      '/': { get: { tags: ['Health'], summary: 'Health check', responses: { 200: { description: 'OK' } } } },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password'],
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Created' }, 400: { description: 'Bad request', ...json({ $ref: '#/components/schemas/ErrorResponse' }) } }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: { email: { type: 'string' }, password: { type: 'string' } }
                }
              }
            }
          },
          responses: { 200: { description: 'Authenticated', ...json({ $ref: '#/components/schemas/LoginResponse' }) }, 400: { description: 'Invalid credentials' } }
        }
      },
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Get users',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Users', ...json({ type: 'array', items: { $ref: '#/components/schemas/UserPublic' } }) } }
        }
      },
      '/api/users/settings': {
        get: { tags: ['Users'], summary: 'Get settings', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Settings' } } },
        put: {
          tags: ['Users'],
          summary: 'Update settings',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notifications: { type: 'boolean' },
                    darkMode: { type: 'boolean' },
                    twoFactor: { type: 'boolean' },
                    language: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Updated' } }
        }
      },
      '/api/files/upload': {
        post: {
          tags: ['Files'],
          summary: 'Upload file',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: { file: { type: 'string', format: 'binary' } }
                }
              }
            }
          },
          responses: { 201: { description: 'Uploaded' } }
        }
      },
      '/api/files/chunked/init': {
        post: {
          tags: ['Files'],
          summary: 'Init chunked upload',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filename', 'totalSize', 'totalChunks'],
                  properties: {
                    filename: { type: 'string' },
                    totalSize: { type: 'integer' },
                    totalChunks: { type: 'integer' },
                    mimetype: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Initialized' } }
        }
      },
      '/api/files/chunked/upload': {
        post: {
          tags: ['Files'],
          summary: 'Upload chunk',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['uploadId', 'chunkIndex', 'chunk'],
                  properties: {
                    uploadId: { type: 'string' },
                    chunkIndex: { type: 'integer' },
                    chunk: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Chunk received' } }
        }
      },
      '/api/files/chunked/complete': {
        post: {
          tags: ['Files'],
          summary: 'Complete chunked upload',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['uploadId'],
                  properties: { uploadId: { type: 'string' } }
                }
              }
            }
          },
          responses: { 201: { description: 'Completed' } }
        }
      },
      '/api/files': {
        get: {
          tags: ['Files'],
          summary: 'Get files',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Files', ...json({ type: 'array', items: { $ref: '#/components/schemas/FileListItem' } }) } }
        }
      },
      '/api/files/starred': { get: { tags: ['Files'], summary: 'Get starred files', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
      '/api/files/trash': { get: { tags: ['Files'], summary: 'Get trashed files', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
      '/api/files/shared': { get: { tags: ['Files'], summary: 'Get shared files', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
      '/api/files/shared-with-me': { get: { tags: ['Files'], summary: 'Get files shared with me', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
      '/api/files/download/{id}': {
        get: {
          tags: ['Files'],
          summary: 'Download file',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Binary file' }, 404: { description: 'Not found' } }
        }
      },
      '/api/files/share': {
        post: {
          tags: ['Files'],
          summary: 'Share file',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fileId'],
                  properties: {
                    fileId: { type: 'integer' },
                    accessType: { type: 'string' },
                    invites: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          email: { type: 'string', format: 'email' },
                          permission: { type: 'string' }
                        }
                      }
                    },
                    expiresIn: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Shared' } }
        }
      },
      '/api/files/{id}/star': { put: { tags: ['Files'], summary: 'Toggle star', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } } },
      '/api/files/{id}/trash': { put: { tags: ['Files'], summary: 'Move to trash', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } } },
      '/api/files/{id}/restore': { put: { tags: ['Files'], summary: 'Restore file', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } } },
      '/api/files/{id}': { delete: { tags: ['Files'], summary: 'Delete file permanently', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } } },
      '/api/files/share/{token}': {
        get: {
          tags: ['Files'],
          summary: 'Get shared file by token',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Shared file metadata' }, 410: { description: 'Expired' } }
        }
      },
      '/api/files/share/{token}/download': {
        get: {
          tags: ['Files'],
          summary: 'Download shared file by token',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Binary file' }, 410: { description: 'Expired' } }
        }
      },
      '/api/transfers': {
        post: {
          tags: ['Transfers'],
          summary: 'Log transfer',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filename', 'size'],
                  properties: {
                    filename: { type: 'string' },
                    size: { type: 'integer' },
                    senderDevice: { type: 'string' },
                    receiverDevice: { type: 'string' },
                    method: { type: 'string' },
                    status: { type: 'string' },
                    duration: { type: 'integer' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Logged', ...json({ type: 'object', properties: { transfer: { $ref: '#/components/schemas/TransferRecord' } } }) } }
        },
        get: {
          tags: ['Transfers'],
          summary: 'Get transfer history',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Transfer list', ...json({ type: 'array', items: { $ref: '#/components/schemas/TransferRecord' } }) } }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJSDoc(options);
