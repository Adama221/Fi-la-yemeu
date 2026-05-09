import startServer from '../server';

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    // Only initialize the server once per function instance
    app = await startServer();
  }
  return app(req, res);
}
