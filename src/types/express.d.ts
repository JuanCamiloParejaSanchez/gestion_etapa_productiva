// src/types/express.d.ts

// Importa los tipos de Express para poder extenderlos
// NOTA: Si este archivo es un módulo global (sin imports/exports de nivel superior),
// TypeScript lo puede detectar automáticamente. Si es un módulo, necesitarás los imports.

import { Request, Response } from 'express'; // <--- AÑADE ESTA LÍNEA

declare global { // <--- AÑADE ESTO para que las declaraciones sean globales si es un módulo
    namespace Express {
        interface Request {
            // Propiedades de Express Request
            body: any; // O el tipo más específico que esperes para req.body
            query: any; // O el tipo más específico que esperes para req.query

            // Propiedades de express-session
            session: import('express-session').Session & Partial<import('express-session').SessionData>;
            // Si también adjuntas un objeto 'user' a la request después de la autenticación
            user?: { id: string; email: string; rol: string; /* ...otras propiedades del usuario */ };
        }

        interface Response {
            // Métodos comunes de Express Response
            status(code: number): Response;
            render(view: string, locals?: Record<string, any>): void;
            redirect(url: string): void;
            clearCookie(name: string, options?: import('express-serve-static-core').CookieOptions): Response;
            // Otros métodos si los usas extensivamente
            json(body?: any): Response;
            send(body?: any): Response;
        }
    }
}

// Extiende la interfaz SessionData del módulo 'express-session'
// Esto sigue siendo necesario para tus propiedades personalizadas de sesión
declare module 'express-session' {
    interface SessionData {
        userEmail?: string;
        userId?: string;
        userRole?: string;
        userName?: string;
        // Añade aquí cualquier otra propiedad personalizada que almacenes en req.session
    }
}