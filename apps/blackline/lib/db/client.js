import { neon } from '@neondatabase/serverless';
export function database(){
  const url=process.env.DATABASE_URL;
  if(!url||!/^postgres(ql)?:\/\//.test(url))throw new Error('Database is not configured');
  return neon(url,{fetchOptions:{signal:AbortSignal.timeout(10000)}});
}
