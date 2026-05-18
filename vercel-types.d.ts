declare module "@vercel/node" {
  import { IncomingMessage, ServerResponse } from 'http';
  
  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] };
    cookies: { [key: string]: string };
    body: any;
  }
  
  export interface VercelResponse extends ServerResponse {
    status: (statusCode: number) => this;
    json: (jsonBody: any) => this;
    send: (body: any) => this;
  }
}

declare module "motion/react" {
  import * as React from 'react';
  
  export const motion: any;
  export const AnimatePresence: React.ComponentType<any>;
}
